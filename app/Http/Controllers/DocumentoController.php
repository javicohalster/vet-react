<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\Ordenable;
use App\Models\Query;
use App\Models\QueryFile;
use App\Models\User;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;
use ZipArchive;

/**
 * Documentos adjuntos a las consultas (resultados de laboratorio, radiografías,
 * ecografías, etc.).
 *
 * Sustituye a los scripts sueltos de `public/qr`. A diferencia de aquellos, los
 * archivos se guardan fuera del directorio público y se sirven a través de esta
 * clase, que exige sesión iniciada.
 */
class DocumentoController extends Controller
{
    use Ordenable;

    private const DISCO = 'local';

    private const CARPETA = 'documentos';

    private const MAX_KB = 51200; // 50 MB, igual que el sistema anterior.

    private const EXTENSIONES = 'pdf,doc,docx,jpg,jpeg,png,gif,webp,bmp,mp4,avi,mov,webm,ogg';

    /** Listado de pacientes con el número de documentos cargados. */
    private const COLUMNAS_ORDENABLES = [
        'rut' => 'rut',
        'chip' => 'chip',
        'nombres' => 'nombres',
        'apellidos' => 'apellidos',
        'telefono' => 'telefono',
    ];

    public function index(Request $request): Response
    {
        $buscar = trim((string) $request->query('buscar', ''));

        $consulta = User::withRole('paciente')
            ->when($buscar !== '', function (Builder $q) use ($buscar) {
                $q->where(function (Builder $sub) use ($buscar) {
                    $sub->where('nombres', 'like', "%{$buscar}%")
                        ->orWhere('apellidos', 'like', "%{$buscar}%")
                        ->orWhere('rut', 'like', "%{$buscar}%")
                        ->orWhere('chip', 'like', "%{$buscar}%");
                });
            });

        $orden = $this->aplicarOrden($consulta, $request, self::COLUMNAS_ORDENABLES, 'nombres');

        $pacientes = $consulta
            ->paginate(15)
            ->withQueryString()
            ->through(fn (User $paciente) => [
                'id' => $paciente->id,
                'rut' => $paciente->rut,
                'chip' => $paciente->chip,
                'nombres' => $paciente->nombres,
                'apellidos' => $paciente->apellidos,
                'telefono' => $paciente->telefono,
                'consultas' => Query::where('paciente_id', $paciente->id)->count(),
                'documentos' => QueryFile::whereIn(
                    'query_id',
                    Query::where('paciente_id', $paciente->id)->select('id')
                )->count(),
            ]);

        return Inertia::render('documentos/index', [
            'pacientes' => $pacientes,
            'filtros' => ['buscar' => $buscar, ...$orden],
        ]);
    }

    /** Consultas de un paciente, para elegir a cuál adjuntar documentos. */
    public function consultasDelPaciente(User $paciente): JsonResponse
    {
        $consultas = Query::where('paciente_id', $paciente->id)
            ->with('doctor:id,nombres,apellidos')
            ->withCount('archivos')
            ->orderByDesc('fecha_inicio')
            ->get()
            ->map(fn (Query $consulta) => [
                'id' => $consulta->id,
                'fecha' => $consulta->fecha_inicio?->format('d/m/Y H:i'),
                'estado' => $consulta->estado,
                'doctor' => $consulta->doctor?->nombre_completo,
                'archivos' => $consulta->archivos_count,
            ]);

        return response()->json([
            'paciente' => [
                'id' => $paciente->id,
                'nombres' => $paciente->nombres,
                'apellidos' => $paciente->apellidos,
            ],
            'consultas' => $consultas,
        ]);
    }

    /** Documentos de una consulta concreta. */
    public function show(Query $consulta): JsonResponse
    {
        $consulta->load('paciente:id,nombres,apellidos');

        return response()->json([
            'consulta' => [
                'id' => $consulta->id,
                'fecha' => $consulta->fecha_inicio?->format('d/m/Y'),
                'paciente' => $consulta->paciente?->nombres,
                'propietario' => $consulta->paciente?->apellidos,
            ],
            'archivos' => $consulta->archivos()->orderByDesc('id')->get()->map(fn (QueryFile $archivo) => [
                'id' => $archivo->id,
                'nombre' => $this->nombreLegible($archivo->file_path),
                'extension' => $archivo->extension,
                'esImagen' => $archivo->es_imagen,
                'esVideo' => $archivo->es_video,
                'esPdf' => $archivo->es_pdf,
                'subido' => $archivo->uploaded_at?->format('d/m/Y'),
                'url' => route('documentos.descargar', $archivo->id),
            ]),
        ]);
    }

    public function store(Request $request, Query $consulta): RedirectResponse
    {
        $request->validate([
            'archivo' => ['required', 'file', 'max:'.self::MAX_KB, 'mimes:'.self::EXTENSIONES],
        ], [], ['archivo' => 'archivo']);

        $archivo = $request->file('archivo');

        $nombre = Str::uuid().'_'
            .Str::slug(pathinfo($archivo->getClientOriginalName(), PATHINFO_FILENAME))
            .'.'.mb_strtolower($archivo->getClientOriginalExtension());

        $archivo->storeAs(self::CARPETA, $nombre, self::DISCO);

        QueryFile::create([
            'query_id' => $consulta->id,
            'file_path' => $nombre,
            'uploaded_at' => now()->toDateString(),
        ]);

        return back()->with('success', 'El archivo se subió correctamente.');
    }

    /** Descarga o previsualiza un archivo. */
    public function descargar(Request $request, QueryFile $archivo): StreamedResponse
    {
        $ruta = self::CARPETA.'/'.$archivo->file_path;

        abort_unless(Storage::disk(self::DISCO)->exists($ruta), 404, 'El archivo ya no está disponible.');

        // `inline` permite incrustar PDF, imágenes y vídeo en la vista previa.
        $disposicion = $request->boolean('descargar') ? 'attachment' : 'inline';

        return Storage::disk(self::DISCO)->response($ruta, $this->nombreLegible($archivo->file_path), [
            'Content-Disposition' => $disposicion.'; filename="'.$this->nombreLegible($archivo->file_path).'"',
        ]);
    }

    /** Descarga todos los documentos de una consulta en un ZIP. */
    public function zip(Query $consulta): BinaryFileResponse
    {
        $archivos = $consulta->archivos()->get();

        abort_if($archivos->isEmpty(), 404, 'No existen archivos para descargar.');

        $rutaZip = tempnam(sys_get_temp_dir(), 'docs').'.zip';
        $zip = new ZipArchive;

        abort_unless($zip->open($rutaZip, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true, 500, 'No se pudo crear el archivo ZIP.');

        foreach ($archivos as $archivo) {
            $ruta = Storage::disk(self::DISCO)->path(self::CARPETA.'/'.$archivo->file_path);

            if (is_file($ruta)) {
                $zip->addFile($ruta, $this->nombreLegible($archivo->file_path));
            }
        }

        $zip->close();

        return response()
            ->download($rutaZip, "documentos-consulta-{$consulta->id}.zip")
            ->deleteFileAfterSend();
    }

    public function destroy(QueryFile $archivo): RedirectResponse
    {
        Storage::disk(self::DISCO)->delete(self::CARPETA.'/'.$archivo->file_path);
        $archivo->delete();

        return back()->with('success', 'El documento fue eliminado.');
    }

    // -----------------------------------------------------------------

    /** Quita el identificador único que se antepone al guardar. */
    private function nombreLegible(string $almacenado): string
    {
        return Str::after($almacenado, '_') ?: $almacenado;
    }
}
