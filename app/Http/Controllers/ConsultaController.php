<?php

namespace App\Http\Controllers;

use App\Models\Query;
use App\Models\User;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Consultas médicas: listado de citas pendientes y atendidas, y el registro
 * de la atención (consulta general, vacunación, desparasitación, cirugía y
 * hospitalización).
 */
class ConsultaController extends Controller
{
    public function index(Request $request): Response
    {
        $usuario = $request->user();
        $buscar = trim((string) $request->query('buscar', ''));
        $pestana = $request->query('pestana') === 'atendidas' ? 'atendidas' : 'pendientes';

        $consultas = Query::query()
            ->visiblesPara($usuario)
            ->where('estado', $pestana === 'atendidas' ? Query::ESTADO_ATENDIDO : Query::ESTADO_PENDIENTE)
            ->when($buscar !== '', fn (Builder $q) => $this->filtrarPorTexto($q, $buscar))
            ->with(['paciente:id,nombres,apellidos', 'doctor:id,nombres,apellidos', 'especialidad:id,nombre'])
            ->orderByDesc('fecha_inicio')
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
            'filtros' => ['buscar' => $buscar],
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

            // Vacunación
            'fechavacuna' => ['nullable', 'string', 'max:50'],
            'tipovacuna' => ['nullable', 'string', 'max:150'],
            'diasrevacuna' => ['nullable', 'integer'],
            'fechavacunasiguiente' => ['nullable', 'string', 'max:50'],

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

        $consulta->fill($datos);
        $consulta->estado = Query::ESTADO_ATENDIDO;
        $consulta->color = Query::COLOR_ATENDIDO;
        $consulta->save();

        return back()->with('success', 'La consulta médica se ha guardado exitosamente.');
    }

    public function destroy(Query $consulta): RedirectResponse
    {
        $consulta->delete();

        return back()->with('success', 'La consulta ha sido eliminada correctamente.');
    }

    // -----------------------------------------------------------------

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
