<?php

namespace App\Http\Controllers;

use App\Models\Laboratorio;
use App\Models\Query;
use App\Models\QueryFile;
use App\Models\Unity;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Laboratorio: registro estructurado de exámenes (hemograma, química
 * sanguínea, uroanálisis, coproparasitológico, etc.) de una consulta, con
 * parámetro/resultado/unidad/valor de referencia por analito.
 *
 * Las imágenes y el informe en PDF se adjuntan como `QueryFile` de la misma
 * consulta, así que aparecen automáticamente en el módulo de Documentos sin
 * necesitar rutas ni lógica de archivos propias.
 */
class LaboratorioController extends Controller
{
    public function index(Request $request): Response
    {
        $buscar = trim((string) $request->query('buscar', ''));
        $estado = $request->query('estado', Laboratorio::ESTADO_PENDIENTE);

        $laboratorios = Laboratorio::query()
            ->with(['consulta.paciente:id,nombres,apellidos', 'doctor:id,nombres,apellidos'])
            ->when($estado !== 'todos', fn (Builder $q) => $q->where('estado', $estado))
            ->when($buscar !== '', function (Builder $q) use ($buscar) {
                $q->where(function (Builder $sub) use ($buscar) {
                    $sub->where('tipo_examen', 'like', "%{$buscar}%")
                        ->orWhereHas('consulta.paciente', function (Builder $p) use ($buscar) {
                            $p->where('nombres', 'like', "%{$buscar}%")
                                ->orWhere('apellidos', 'like', "%{$buscar}%")
                                ->orWhere('rut', 'like', "%{$buscar}%");
                        });
                });
            })
            ->orderByDesc('fecha_muestra')
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Laboratorio $laboratorio) => [
                'id' => $laboratorio->id,
                'paciente' => $laboratorio->consulta->paciente?->nombres,
                'propietario' => $laboratorio->consulta->paciente?->apellidos,
                'tipo_examen' => $laboratorio->tipo_examen,
                'fecha_muestra' => $laboratorio->fecha_muestra?->format('d/m/Y'),
                'estado' => $laboratorio->estado,
                'doctor' => $laboratorio->doctor?->nombre_completo,
            ]);

        return Inertia::render('laboratorio/index', [
            'laboratorios' => $laboratorios,
            'filtros' => ['buscar' => $buscar, 'estado' => $estado],
            'contadores' => [
                'pendiente' => Laboratorio::where('estado', Laboratorio::ESTADO_PENDIENTE)->count(),
                'en_proceso' => Laboratorio::where('estado', Laboratorio::ESTADO_EN_PROCESO)->count(),
                'completado' => Laboratorio::where('estado', Laboratorio::ESTADO_COMPLETADO)->count(),
            ],
            'doctores' => User::withRole('doctor')
                ->orderBy('apellidos')
                ->get(['id', 'nombres', 'apellidos'])
                ->map(fn (User $doctor) => ['id' => $doctor->id, 'nombre' => $doctor->nombre_completo]),
        ]);
    }

    /** Consultas de un paciente, para elegir a cuál se asocia el nuevo examen. */
    public function consultasDelPaciente(User $paciente): JsonResponse
    {
        $consultas = Query::where('paciente_id', $paciente->id)
            ->with('doctor:id,nombres,apellidos')
            ->orderByDesc('fecha_inicio')
            ->get()
            ->map(fn (Query $consulta) => [
                'id' => $consulta->id,
                'fecha' => $consulta->fecha_inicio?->format('d/m/Y H:i'),
                'estado' => $consulta->estado,
                'doctor' => $consulta->doctor?->nombre_completo,
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

    public function show(Laboratorio $laboratorio): JsonResponse
    {
        $laboratorio->load(['consulta.paciente:id,nombres,apellidos,rut', 'doctor:id,nombres,apellidos', 'resultados']);

        return response()->json([
            'id' => $laboratorio->id,
            'queryId' => $laboratorio->query_id,
            'paciente' => [
                'nombres' => $laboratorio->consulta->paciente?->nombres,
                'apellidos' => $laboratorio->consulta->paciente?->apellidos,
                'rut' => $laboratorio->consulta->paciente?->rut,
            ],
            'doctorId' => $laboratorio->doctor_id,
            'doctor' => $laboratorio->doctor?->nombre_completo,
            'tipoExamen' => $laboratorio->tipo_examen,
            'fechaMuestra' => $laboratorio->fecha_muestra?->format('Y-m-d'),
            'fechaResultado' => $laboratorio->fecha_resultado?->format('Y-m-d'),
            'estado' => $laboratorio->estado,
            'observaciones' => $laboratorio->observaciones,
            'resultados' => $laboratorio->resultados->map(fn ($r) => [
                'parametro' => $r->parametro,
                'resultado' => $r->resultado,
                'unidad' => $r->unidad,
                'valorReferencia' => $r->valor_referencia,
                'alterado' => $r->alterado,
            ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $datos = $this->validar($request);

        $laboratorio = Laboratorio::create(collect($datos)->except('resultados')->all());
        $this->guardarResultados($laboratorio, $datos['resultados'] ?? []);

        return back()->with('success', 'El examen de laboratorio se registró correctamente.');
    }

    public function update(Request $request, Laboratorio $laboratorio): RedirectResponse
    {
        $datos = $this->validar($request);

        $laboratorio->update(collect($datos)->except(['resultados', 'query_id'])->all());

        $laboratorio->resultados()->delete();
        $this->guardarResultados($laboratorio, $datos['resultados'] ?? []);

        return back()->with('success', 'El examen de laboratorio se actualizó correctamente.');
    }

    public function destroy(Laboratorio $laboratorio): RedirectResponse
    {
        $laboratorio->delete();

        return back()->with('success', 'El examen de laboratorio fue eliminado.');
    }

    /** Genera el informe en PDF y lo adjunta también como documento de la consulta. */
    public function informePdf(Laboratorio $laboratorio): HttpResponse
    {
        $laboratorio->load(['consulta.paciente', 'doctor', 'resultados']);
        $paciente = $laboratorio->consulta->paciente;

        $pdf = Pdf::loadView('pdf.laboratorio', [
            'laboratorio' => $laboratorio,
            'paciente' => $paciente,
            'edad' => $paciente?->edad,
            'clinica' => Unity::orderBy('id')->first(),
            'fecha' => now()->format('d/m/Y H:i'),
        ]);

        $nombreDescarga = 'informe-laboratorio-'.$laboratorio->id.'-'.str(trim($paciente?->nombres.' '.$paciente?->apellidos))->slug().'.pdf';
        $nombreGuardado = Str::uuid().'_'.$nombreDescarga;

        Storage::disk('local')->put('documentos/'.$nombreGuardado, $pdf->output());

        QueryFile::create([
            'query_id' => $laboratorio->query_id,
            'file_path' => $nombreGuardado,
            'uploaded_at' => now()->toDateString(),
        ]);

        return $pdf->download($nombreDescarga);
    }

    // -----------------------------------------------------------------

    /** @return array<string, mixed> */
    private function validar(Request $request): array
    {
        return $request->validate([
            'query_id' => ['required', 'integer', 'exists:queries,id'],
            'doctor_id' => ['nullable', 'integer', 'exists:users,id'],
            'tipo_examen' => ['required', 'string', 'max:150'],
            'fecha_muestra' => ['required', 'date'],
            'fecha_resultado' => ['nullable', 'date'],
            'estado' => ['required', 'in:pendiente,en_proceso,completado'],
            'observaciones' => ['nullable', 'string', 'max:2000'],
            'resultados' => ['nullable', 'array'],
            'resultados.*.parametro' => ['required', 'string', 'max:150'],
            'resultados.*.resultado' => ['nullable', 'string', 'max:150'],
            'resultados.*.unidad' => ['nullable', 'string', 'max:50'],
            'resultados.*.valor_referencia' => ['nullable', 'string', 'max:100'],
            'resultados.*.alterado' => ['nullable', 'boolean'],
        ], [], [
            'query_id' => 'consulta',
            'tipo_examen' => 'tipo de examen',
            'fecha_muestra' => 'fecha de la muestra',
        ]);
    }

    /** @param  array<int, array<string, mixed>>  $resultados */
    private function guardarResultados(Laboratorio $laboratorio, array $resultados): void
    {
        foreach ($resultados as $indice => $resultado) {
            $laboratorio->resultados()->create([
                'parametro' => $resultado['parametro'],
                'resultado' => $resultado['resultado'] ?? null,
                'unidad' => $resultado['unidad'] ?? null,
                'valor_referencia' => $resultado['valor_referencia'] ?? null,
                'alterado' => $resultado['alterado'] ?? false,
                'orden' => $indice,
            ]);
        }
    }
}
