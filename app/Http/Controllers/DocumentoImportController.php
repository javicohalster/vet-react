<?php

namespace App\Http\Controllers;

use App\Models\Query;
use App\Models\QueryFile;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * A veces se copian documentos directo a la carpeta del servidor (por File
 * Manager) en vez de subirlos desde la app. Esos archivos existen en disco
 * pero no tienen fila en `query_files`, así que la app no sabe a qué
 * paciente/consulta pertenecen y no aparecen en ningún lado.
 *
 * Esta pantalla detecta esos archivos "sueltos", sugiere el paciente según
 * el nombre del archivo (mismo patrón que usa DocumentoController al subir:
 * uuid_propietario-pcte-paciente.ext) y deja elegir la consulta exacta antes
 * de vincularlo.
 */
class DocumentoImportController extends Controller
{
    private const DISCO = 'local';

    private const CARPETA = 'documentos';

    public function index(): Response
    {
        $sueltos = $this->archivosSueltos()->map(fn (string $archivo) => [
            'archivo' => $archivo,
            'nombre_legible' => Str::after($archivo, '_') ?: $archivo,
            'paciente_sugerido' => $this->sugerirPaciente($archivo),
        ]);

        return Inertia::render('documentos/importar', ['archivos' => $sueltos]);
    }

    /**
     * Vincula de una sola vez todos los archivos sueltos cuyo nombre permite
     * identificar exactamente un paciente. Si ese paciente tiene una sola
     * consulta atendida, se usa esa; si tiene varias, se usa la más
     * reciente (no hay forma de saber cuál de sus visitas es por el nombre
     * del archivo solo). Los que no se puedan identificar quedan igual en
     * la lista para elegirlos a mano.
     */
    public function vincularAutomaticos(): RedirectResponse
    {
        $vinculados = 0;
        $sinConsulta = 0;

        foreach ($this->archivosSueltos() as $archivo) {
            $paciente = $this->sugerirPaciente($archivo);
            if (! $paciente) {
                continue;
            }

            $consulta = Query::where('paciente_id', $paciente['id'])
                ->where('estado', Query::ESTADO_ATENDIDO)
                ->orderByDesc('fecha_inicio')
                ->first();

            if (! $consulta) {
                $sinConsulta++;

                continue;
            }

            QueryFile::create([
                'query_id' => $consulta->id,
                'file_path' => $archivo,
                'uploaded_at' => now()->toDateString(),
            ]);

            $vinculados++;
        }

        $mensaje = "Se vincularon {$vinculados} archivo(s) automáticamente.";
        if ($sinConsulta > 0) {
            $mensaje .= " {$sinConsulta} se identificaron pero el paciente no tiene consultas atendidas, así que no se pudieron vincular.";
        }

        return back()->with('success', $mensaje);
    }

    /** Muestra el archivo suelto (para verlo antes de decidir a qué consulta va). */
    public function ver(string $archivo): StreamedResponse
    {
        $archivo = basename($archivo); // nunca navegar fuera de la carpeta
        $ruta = self::CARPETA.'/'.$archivo;

        abort_unless(Storage::disk(self::DISCO)->exists($ruta), 404, 'El archivo ya no está disponible.');

        return Storage::disk(self::DISCO)->response($ruta, $archivo, ['Content-Disposition' => 'inline; filename="'.$archivo.'"']);
    }

    public function vincular(Request $request): RedirectResponse
    {
        $datos = $request->validate([
            'archivo' => ['required', 'string'],
            'query_id' => ['required', 'integer', 'exists:queries,id'],
        ]);

        $archivo = basename($datos['archivo']);
        $ruta = self::CARPETA.'/'.$archivo;

        abort_unless(Storage::disk(self::DISCO)->exists($ruta), 404, 'El archivo ya no está disponible.');

        if (QueryFile::where('file_path', $archivo)->exists()) {
            return back()->with('warning', 'Ese archivo ya estaba vinculado.');
        }

        QueryFile::create([
            'query_id' => $datos['query_id'],
            'file_path' => $archivo,
            'uploaded_at' => now()->toDateString(),
        ]);

        return back()->with('success', 'Documento vinculado correctamente.');
    }

    // -----------------------------------------------------------------

    /** Nombres de archivo en la carpeta de documentos que no están en query_files. */
    private function archivosSueltos(): \Illuminate\Support\Collection
    {
        $registrados = QueryFile::pluck('file_path')->all();

        return collect(Storage::disk(self::DISCO)->files(self::CARPETA))
            ->map(fn (string $ruta) => basename($ruta))
            ->diff($registrados)
            ->values();
    }

    /**
     * Intenta ubicar al paciente a partir del nombre del archivo. Se han visto
     * dos patrones distintos: "uuid_propietario-pcte-paciente.ext" (subida
     * desde la app) y "id-corto_Propietario_Nombre_PCTE_Paciente.ext" (copiado
     * a mano, con guion bajo y mayúsculas). Solo sugiere si encuentra
     * exactamente un paciente que calce; si hay varios o ninguno, se deja en
     * blanco para elegirlo a mano.
     *
     * @return array<string, mixed>|null
     */
    private function sugerirPaciente(string $archivo): ?array
    {
        $sinExtension = pathinfo($archivo, PATHINFO_FILENAME);

        // Quita el identificador del inicio: un uuid completo (con guiones) o
        // un id corto tipo uniqid() (solo caracteres hexadecimales).
        $sinPrefijo = preg_replace('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/i', '', $sinExtension);
        $sinPrefijo = preg_replace('/^[0-9a-f]{6,}_/i', '', $sinPrefijo);

        // Separador "pcte" con guion o guion bajo, sin importar mayúsculas.
        if (! preg_match('/^(.+?)[_-]pcte[_-](.+)$/i', $sinPrefijo, $partes)) {
            return null;
        }

        $propietario = trim(str_replace(['-', '_'], ' ', $partes[1]));
        $paciente = trim(str_replace(['-', '_'], ' ', $partes[2]));

        $candidatos = User::withRole('paciente')
            ->where('apellidos', 'like', "%{$propietario}%")
            ->where('nombres', 'like', "%{$paciente}%")
            ->limit(2)
            ->get();

        if ($candidatos->count() !== 1) {
            return null;
        }

        $encontrado = $candidatos->first();

        return [
            'id' => $encontrado->id,
            'etiqueta' => $encontrado->nombre_completo,
        ];
    }
}
