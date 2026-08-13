<?php

namespace App\Http\Controllers;

use App\Models\Dia;
use App\Models\Query;
use App\Models\Speciality;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Agenda de citas médicas: el calendario de la pantalla de inicio.
 */
class CitaController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('citas/index', [
            'doctores' => $this->doctores(),
            'especialidades' => Speciality::orderBy('nombre')->get(['id', 'nombre']),
            'resumen' => [
                'pacientes' => User::withRole('paciente')->count(),
                'pendientes' => Query::pendientes()->count(),
                'atendidasHoy' => Query::atendidas()->whereDate('fecha_inicio', today())->count(),
            ],
        ]);
    }

    /** Eventos que consume el calendario. Un doctor solo ve su propia agenda. */
    public function eventos(Request $request): JsonResponse
    {
        $usuario = $request->user();

        $citas = Query::query()
            ->visiblesPara($usuario)
            ->with(['paciente:id,nombres,apellidos', 'doctor:id,nombres,apellidos', 'especialidad:id,nombre'])
            ->when($request->filled('desde'), fn ($q) => $q->where('fecha_fin', '>=', $request->string('desde')))
            ->when($request->filled('hasta'), fn ($q) => $q->where('fecha_inicio', '<=', $request->string('hasta')))
            ->get()
            ->map(fn (Query $cita) => [
                'id' => $cita->id,
                'title' => trim($cita->paciente?->nombres.' / '.$cita->paciente?->apellidos, ' /'),
                'start' => $cita->fecha_inicio?->toIso8601String(),
                'end' => $cita->fecha_fin?->toIso8601String(),
                'color' => $cita->color,
                'extendedProps' => [
                    'estado' => $cita->estado,
                    'descripcion' => $cita->descripcion,
                    'pacienteId' => $cita->paciente_id,
                    'paciente' => $cita->paciente?->nombre_completo,
                    'doctorId' => $cita->doctor_id,
                    'doctor' => $cita->doctor?->nombre_completo,
                    'especialidadId' => $cita->speciality_id,
                    'especialidad' => $cita->especialidad?->nombre,
                ],
            ]);

        // Franjas de agenda abierta de los doctores, como fondo del calendario.
        $agenda = Dia::query()
            ->when($usuario->hasRole('doctor'), fn ($q) => $q->where('doctor_id', $usuario->id))
            ->get()
            ->map(fn (Dia $dia) => [
                'id' => 'dia-'.$dia->id,
                'start' => $dia->fecha_inicio?->toIso8601String(),
                'end' => $dia->fecha_fin?->toIso8601String(),
                'display' => 'background',
                'color' => '#ccfbf1',
                'extendedProps' => ['doctorId' => $dia->doctor_id],
            ]);

        return response()->json([
            'citas' => $citas,
            'agenda' => $agenda,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $datos = $this->validar($request);

        [$inicio, $fin] = $this->rango($datos);

        $this->verificarDisponibilidad((int) $datos['doctor_id'], $inicio, $fin);

        $cita = Query::create([
            'fecha_inicio' => $inicio,
            'fecha_fin' => $fin,
            'estado' => Query::ESTADO_PENDIENTE,
            'color' => Query::COLOR_PENDIENTE,
            'descripcion' => $datos['descripcion'] ?? null,
            'doctor_id' => $datos['doctor_id'],
            'paciente_id' => $datos['paciente_id'],
            'speciality_id' => $datos['speciality_id'],
            'unity_id' => $datos['unity_id'] ?? 1,
        ]);

        // El sistema anterior registra en el paciente la fecha de la última atención.
        User::whereKey($cita->paciente_id)->update(['fecha_ult_atencion' => $inicio->toDateString()]);

        return back()->with('success', 'La cita ha sido reservada correctamente.');
    }

    public function update(Request $request, Query $cita): RedirectResponse
    {
        $datos = $this->validar($request);

        [$inicio, $fin] = $this->rango($datos);

        $this->verificarDisponibilidad((int) $datos['doctor_id'], $inicio, $fin, $cita->id);

        $cita->update([
            'fecha_inicio' => $inicio,
            'fecha_fin' => $fin,
            'descripcion' => $datos['descripcion'] ?? null,
            'doctor_id' => $datos['doctor_id'],
            'paciente_id' => $datos['paciente_id'],
            'speciality_id' => $datos['speciality_id'],
        ]);

        return back()->with('success', 'La cita ha sido actualizada correctamente.');
    }

    /** Arrastrar / redimensionar la cita en el calendario. */
    public function mover(Request $request, Query $cita): RedirectResponse
    {
        $datos = $request->validate([
            'fecha_inicio' => ['required', 'date'],
            'fecha_fin' => ['required', 'date', 'after:fecha_inicio'],
        ]);

        $inicio = Carbon::parse($datos['fecha_inicio']);
        $fin = Carbon::parse($datos['fecha_fin']);

        $this->verificarDisponibilidad((int) $cita->doctor_id, $inicio, $fin, $cita->id);

        $cita->update(['fecha_inicio' => $inicio, 'fecha_fin' => $fin]);

        return back()->with('success', 'La cita se movió correctamente.');
    }

    public function destroy(Query $cita): RedirectResponse
    {
        $cita->delete();

        return back()->with('success', 'La cita ha sido eliminada correctamente.');
    }

    // -----------------------------------------------------------------

    /** @return array<string, mixed> */
    private function validar(Request $request): array
    {
        return $request->validate([
            'fecha' => ['required', 'date'],
            'hora_inicio' => ['required', 'date_format:H:i'],
            'hora_fin' => ['required', 'date_format:H:i', 'after:hora_inicio'],
            'paciente_id' => ['required', 'integer', 'exists:users,id'],
            'doctor_id' => ['required', 'integer', 'exists:users,id'],
            'speciality_id' => ['required', 'integer', 'exists:specialities,id'],
            'descripcion' => ['nullable', 'string', 'max:191'],
            'unity_id' => ['nullable', 'integer', 'exists:unities,id'],
        ], [], [
            'fecha' => 'fecha',
            'hora_inicio' => 'hora de inicio',
            'hora_fin' => 'hora de fin',
            'paciente_id' => 'paciente',
            'doctor_id' => 'doctor',
            'speciality_id' => 'especialidad',
        ]);
    }

    /**
     * @param  array<string, mixed>  $datos
     * @return array{0: Carbon, 1: Carbon}
     */
    private function rango(array $datos): array
    {
        $fecha = Carbon::parse($datos['fecha'])->toDateString();

        return [
            Carbon::parse($fecha.' '.$datos['hora_inicio']),
            Carbon::parse($fecha.' '.$datos['hora_fin']),
        ];
    }

    /**
     * Reglas heredadas: el doctor debe tener agenda abierta ese día y no puede
     * tener otra cita pendiente que se solape con el rango solicitado.
     *
     * @throws ValidationException
     */
    private function verificarDisponibilidad(int $doctorId, Carbon $inicio, Carbon $fin, ?int $ignorarId = null): void
    {
        if (! Dia::doctorTieneAgenda($doctorId, $inicio->toDateTimeString())) {
            throw ValidationException::withMessages([
                'fecha' => 'El doctor no tiene agenda abierta en la fecha que seleccionó.',
            ]);
        }

        if (Query::doctorOcupado($doctorId, $inicio->toDateTimeString(), $fin->toDateTimeString(), $ignorarId)) {
            throw ValidationException::withMessages([
                'hora_inicio' => 'El doctor ya tiene una consulta pendiente en ese rango de horas.',
            ]);
        }
    }

    /** @return \Illuminate\Support\Collection<int, array<string, mixed>> */
    private function doctores()
    {
        return User::withRole('doctor')
            ->with('specialities:id,nombre')
            ->orderBy('apellidos')
            ->get(['id', 'nombres', 'apellidos'])
            ->map(fn (User $doctor) => [
                'id' => $doctor->id,
                'nombre' => $doctor->nombre_completo,
                'especialidades' => $doctor->specialities->pluck('id'),
            ]);
    }
}
