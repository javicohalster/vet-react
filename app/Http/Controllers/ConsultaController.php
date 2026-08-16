<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\Ordenable;
use App\Models\ConsultaVacuna;
use App\Models\Query;
use App\Models\User;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Consultas médicas: listado de citas pendientes y atendidas, y el registro
 * de la atención (consulta general, vacunación, desparasitación, cirugía y
 * hospitalización).
 */
class ConsultaController extends Controller
{
    use Ordenable;

    /** Columna visible en la tabla => columna real (con joins, para poder ordenar por paciente/doctor/especialidad). */
    private const COLUMNAS_ORDENABLES = [
        'fecha' => 'queries.fecha_inicio',
        'paciente' => 'paciente.nombres',
        'propietario' => 'paciente.apellidos',
        'doctor' => 'doctor.apellidos',
        'especialidad' => 'specialities.nombre',
        'estado' => 'queries.estado',
    ];

    public function index(Request $request): Response
    {
        $usuario = $request->user();
        $buscar = trim((string) $request->query('buscar', ''));
        $pestana = $request->query('pestana') === 'atendidas' ? 'atendidas' : 'pendientes';

        $consulta = Query::query()
            ->join('users as paciente', 'queries.paciente_id', '=', 'paciente.id')
            ->leftJoin('users as doctor', 'queries.doctor_id', '=', 'doctor.id')
            ->leftJoin('specialities', 'queries.speciality_id', '=', 'specialities.id')
            ->select('queries.*')
            ->visiblesPara($usuario)
            ->where('queries.estado', $pestana === 'atendidas' ? Query::ESTADO_ATENDIDO : Query::ESTADO_PENDIENTE)
            ->when($buscar !== '', fn (Builder $q) => $this->filtrarPorTexto($q, $buscar))
            ->with(['paciente:id,nombres,apellidos', 'doctor:id,nombres,apellidos', 'especialidad:id,nombre']);

        $orden = $this->aplicarOrden($consulta, $request, self::COLUMNAS_ORDENABLES, 'fecha', 'desc');

        $consultas = $consulta
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Query $consulta) => [
                'id' => $consulta->id,
                'fecha' => $consulta->fecha_inicio?->format('d/m/Y H:i'),
                'paciente' => $consulta->paciente?->nombres,
                'propietario' => $consulta->paciente?->apellidos,
                'doctor' => $consulta->doctor ? 'Dr. '.$consulta->doctor->apellidos : null,
                'especialidad' => $consulta->especialidad?->nombre,
                'estado' => $consulta->estado,
                'archivos' => $consulta->archivos()->count(),
            ]);

        return Inertia::render('consultas/index', [
            'consultas' => $consultas,
            'pestana' => $pestana,
            'filtros' => ['buscar' => $buscar, ...$orden],
            'doctores' => User::withRole('doctor')
                ->orderBy('apellidos')
                ->get(['id', 'nombres', 'apellidos'])
                ->map(fn (User $d) => ['id' => $d->id, 'nombre' => $d->nombre_completo]),
            'contadores' => [
                'pendientes' => Query::query()->visiblesPara($usuario)->pendientes()->count(),
                'atendidas' => Query::query()->visiblesPara($usuario)->atendidas()->count(),
            ],
        ]);
    }

    /** Detalle completo de una consulta, para ver o editar la atención. */
    public function show(Query $consulta): \Illuminate\Http\JsonResponse
    {
        $consulta->load(['paciente:id,nombres,apellidos,nacimiento,sangre,vih,medicamento_actual,chip,rut', 'doctor:id,nombres,apellidos', 'especialidad:id,nombre']);

        $visitas = Query::where('paciente_id', $consulta->paciente_id)
            ->where('estado', Query::ESTADO_ATENDIDO)
            ->count();

        return response()->json([
            'id' => $consulta->id,
            'estado' => $consulta->estado,
            'fecha' => $consulta->fecha_inicio?->format('d/m/Y H:i'),
            'paciente' => [
                'id' => $consulta->paciente?->id,
                'nombre' => $consulta->paciente?->nombres,
                'propietario' => $consulta->paciente?->apellidos,
                'edad' => $consulta->paciente?->edad,
                'raza' => $consulta->paciente?->raza,
                'especie' => $consulta->paciente?->especie,
                'chip' => $consulta->paciente?->chip,
                'rut' => $consulta->paciente?->rut,
            ],
            'doctor' => $consulta->doctor?->nombre_completo,
            'especialidad' => $consulta->especialidad?->nombre,
            'especialidad_id' => $consulta->speciality_id,
            'visitas' => $visitas,
            'atencion' => $this->camposAtencion($consulta),
            'vacunas' => $this->listaVacunas($consulta),
        ]);
    }

    /** Guarda la atención médica y marca la consulta como atendida. */
    public function atender(Request $request, Query $consulta): RedirectResponse
    {
        $datos = $request->validate([
            // Consulta general
            'sintomas' => ['nullable', 'string', 'max:2000'],
            'examenes' => ['nullable', 'string', 'max:1000'],
            'tratamiento' => ['nullable', 'string', 'max:1000'],
            'trata' => ['nullable', 'string', 'max:255'],
            'observaciones' => ['nullable', 'string', 'max:1000'],
            'temperatura' => ['nullable', 'string', 'max:100'],
            'peso' => ['nullable', 'string', 'max:50'],
            'receta' => ['nullable', 'string', 'max:1000'],
            'diagnostico' => ['nullable', 'string', 'max:1000'],
            'tipo' => ['nullable', 'string', 'max:3'],
            'doctorConsulta' => ['nullable', 'integer', 'exists:users,id'],
            'fecharegistra' => ['nullable', 'string', 'max:50'],
            'fechasiguientecita' => ['nullable', 'string', 'max:50'],

            // Vacunación: ahora una lista (una consulta puede tener varias vacunas).
            // Los 4 campos sueltos de arriba (fechavacuna, tipovacuna, etc.) se
            // conservan en la tabla `queries` solo por compatibilidad con
            // consultas antiguas; ya no se editan desde este formulario.
            'vacunas' => ['nullable', 'array'],
            'vacunas.*.fecha_vacuna' => ['nullable', 'date'],
            'vacunas.*.tipo_vacuna' => ['nullable', 'string', 'max:150'],
            'vacunas.*.dias_revacunar' => ['nullable', 'integer', 'min:0'],
            'vacunas.*.fecha_siguiente_vacuna' => ['nullable', 'date'],

            // Desparasitación
            'fechadesparasitacion' => ['nullable', 'string', 'max:50'],
            'pesodesparasitacion' => ['nullable', 'string', 'max:30'],
            'descripciondesparacitacion' => ['nullable', 'string', 'max:1000'],
            'posologia' => ['nullable', 'string', 'max:200'],
            'dosis' => ['nullable', 'string', 'max:250'],
            'diasdesparacitar' => ['nullable', 'integer'],
            'fechasigueintedesparasitacion' => ['nullable', 'string', 'max:50'],

            // Cirugía
            'fechacirugia' => ['nullable', 'string', 'max:50'],
            'pesocirugia' => ['nullable', 'string', 'max:50'],
            'procedimientocirugia' => ['nullable', 'string', 'max:1000'],
            'recetacirugia' => ['nullable', 'string', 'max:1000'],

            // Hospitalización
            'fechahospitalizacion' => ['nullable', 'string', 'max:50'],
            'pesohospitalizar' => ['nullable', 'string', 'max:30'],
            'temperaturahospitalizar' => ['nullable', 'string', 'max:30'],
            'frecuenciacardiacahospitalizar' => ['nullable', 'string', 'max:30'],
            'frecuenciarespiratoriahospitalizar' => ['nullable', 'string', 'max:30'],
            'mucosashospitalizar' => ['nullable', 'string', 'max:100'],
            'hidratacionhospitalizar' => ['nullable', 'string', 'max:100'],
            'diagnosticohospitalizar' => ['nullable', 'string', 'max:1000'],
            'tratamientohotpitalizar' => ['nullable', 'string', 'max:1000'],
            'estadoaltahospitalizacion' => ['nullable', 'string', 'max:100'],
            'fechaaltahospitalizacion' => ['nullable', 'string', 'max:50'],
            'recetahospitalizar' => ['nullable', 'string', 'max:1000'],
        ]);

        $vacunas = $datos['vacunas'] ?? [];
        unset($datos['vacunas']);

        // La fecha siguiente se recalcula siempre en el servidor a partir de
        // fecha + días, para no depender de que el navegador la haya
        // calculado bien (y por si se manda por otra vía en el futuro).
        if (! empty($datos['fechadesparasitacion']) && $datos['diasdesparacitar'] ?? null) {
            $datos['fechasigueintedesparasitacion'] = Carbon::parse($datos['fechadesparasitacion'])
                ->addDays((int) $datos['diasdesparacitar'])
                ->format('Y-m-d');
        }

        $consulta->fill($datos);
        $consulta->estado = Query::ESTADO_ATENDIDO;
        $consulta->color = Query::COLOR_ATENDIDO;
        $consulta->save();

        $this->sincronizarVacunas($consulta, $vacunas);

        return back()->with('success', 'La consulta médica se ha guardado exitosamente.');
    }

    public function destroy(Query $consulta): RedirectResponse
    {
        $consulta->delete();

        return back()->with('success', 'La consulta ha sido eliminada correctamente.');
    }

    // -----------------------------------------------------------------

    /**
     * Reemplaza las vacunas de la consulta por la lista recibida. Ignora
     * filas en blanco (el usuario abrió una fila con "+ Agregar vacuna" y no
     * la llenó) y recalcula la fecha siguiente en el servidor.
     *
     * @param  array<int, array<string, mixed>>  $vacunas
     */
    private function sincronizarVacunas(Query $consulta, array $vacunas): void
    {
        $consulta->vacunas()->delete();

        foreach ($vacunas as $vacuna) {
            $fecha = $vacuna['fecha_vacuna'] ?? null;
            $tipo = $vacuna['tipo_vacuna'] ?? null;

            if (! $fecha && ! $tipo) {
                continue; // fila vacía, no se guarda
            }

            $dias = isset($vacuna['dias_revacunar']) && $vacuna['dias_revacunar'] !== ''
                ? (int) $vacuna['dias_revacunar']
                : null;

            $fechaSiguiente = $fecha && $dias
                ? Carbon::parse($fecha)->addDays($dias)->toDateString()
                : ($vacuna['fecha_siguiente_vacuna'] ?? null);

            ConsultaVacuna::create([
                'query_id' => $consulta->id,
                'fecha_vacuna' => $fecha,
                'tipo_vacuna' => $tipo,
                'dias_revacunar' => $dias,
                'fecha_siguiente_vacuna' => $fechaSiguiente,
            ]);
        }
    }

    /**
     * Vacunas de la consulta para mostrar en el formulario. Si la consulta es
     * de antes de esta función (datos migrados del sistema anterior) y no
     * tiene filas en la tabla nueva, se muestra su vacuna "suelta" como
     * primera fila editable, para no perderla de vista.
     *
     * @return array<int, array<string, mixed>>
     */
    private function listaVacunas(Query $consulta): array
    {
        $vacunas = $consulta->vacunas()->orderBy('fecha_vacuna')->get()->map(fn (ConsultaVacuna $v) => [
            'id' => $v->id,
            'fecha_vacuna' => $v->fecha_vacuna?->format('Y-m-d'),
            'tipo_vacuna' => $v->tipo_vacuna,
            'dias_revacunar' => $v->dias_revacunar,
            'fecha_siguiente_vacuna' => $v->fecha_siguiente_vacuna?->format('Y-m-d'),
        ])->all();

        if (empty($vacunas) && ($consulta->tipovacuna || $consulta->fechavacuna)) {
            $vacunas[] = [
                'id' => null,
                'fecha_vacuna' => $consulta->fechavacuna,
                'tipo_vacuna' => $consulta->tipovacuna,
                'dias_revacunar' => $consulta->diasrevacuna,
                'fecha_siguiente_vacuna' => $consulta->fechavacunasiguiente,
            ];
        }

        return $vacunas;
    }

    /** Busca por nombre de paciente, propietario o identificación. */
    private function filtrarPorTexto(Builder $query, string $termino): Builder
    {
        return $query->whereHas('paciente', function (Builder $q) use ($termino) {
            $q->where('nombres', 'like', "%{$termino}%")
                ->orWhere('apellidos', 'like', "%{$termino}%")
                ->orWhere('rut', 'like', "%{$termino}%")
                ->orWhere('chip', 'like', "%{$termino}%");
        });
    }

    /** @return array<string, mixed> */
    private function camposAtencion(Query $consulta): array
    {
        $campos = [
            'sintomas', 'examenes', 'tratamiento', 'trata', 'observaciones', 'temperatura',
            'peso', 'receta', 'diagnostico', 'tipo', 'doctorConsulta', 'fecharegistra',
            'fechasiguientecita', 'fechavacuna', 'tipovacuna', 'diasrevacuna',
            'fechavacunasiguiente', 'fechadesparasitacion', 'pesodesparasitacion',
            'descripciondesparacitacion', 'posologia', 'dosis', 'diasdesparacitar',
            'fechasigueintedesparasitacion', 'fechacirugia', 'pesocirugia',
            'procedimientocirugia', 'recetacirugia', 'fechahospitalizacion',
            'pesohospitalizar', 'temperaturahospitalizar', 'frecuenciacardiacahospitalizar',
            'frecuenciarespiratoriahospitalizar', 'mucosashospitalizar', 'hidratacionhospitalizar',
            'diagnosticohospitalizar', 'tratamientohotpitalizar', 'estadoaltahospitalizacion',
            'fechaaltahospitalizacion', 'recetahospitalizar',
        ];

        return collect($campos)
            ->mapWithKeys(fn (string $campo) => [$campo => $consulta->{$campo}])
            ->all();
    }
}
