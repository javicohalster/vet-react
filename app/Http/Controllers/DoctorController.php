<?php

namespace App\Http\Controllers;

use App\Models\Dia;
use App\Models\Query;
use App\Models\Speciality;
use App\Models\User;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Doctores: alta y edición, especialidades asignadas, días de agenda abiertos
 * y restablecimiento de contraseña.
 */
class DoctorController extends Controller
{
    private const ROL_DOCTOR = 2;

    public function index(Request $request): Response
    {
        $buscar = trim((string) $request->query('buscar', ''));

        $doctores = User::withRole('doctor')
            ->when($buscar !== '', fn (Builder $q) => $q->where(fn (Builder $s) => $s
                ->where('nombres', 'like', "%{$buscar}%")
                ->orWhere('apellidos', 'like', "%{$buscar}%")
                ->orWhere('rut', 'like', "%{$buscar}%")
                ->orWhere('email', 'like', "%{$buscar}%")))
            ->with('specialities:id,nombre')
            ->orderBy('apellidos')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (User $doctor) => [
                'id' => $doctor->id,
                'rut' => $doctor->rut,
                'username' => $doctor->username,
                'nombres' => $doctor->nombres,
                'apellidos' => $doctor->apellidos,
                'email' => $doctor->email,
                'telefono' => $doctor->telefono,
                'direccion' => $doctor->direccion,
                'genero' => $doctor->genero,
                'nacimiento' => $doctor->nacimiento?->format('Y-m-d'),
                'estudios_complementarios' => $doctor->estudios_complementarios,
                'especialidades' => $doctor->specialities->map(fn ($e) => ['id' => $e->id, 'nombre' => $e->nombre]),
                'dias' => $doctor->dias()->count(),
            ]);

        return Inertia::render('doctores/index', [
            'doctores' => $doctores,
            'filtros' => ['buscar' => $buscar],
            'especialidades' => Speciality::orderBy('nombre')->get(['id', 'nombre']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $datos = $this->validar($request);

        $doctor = User::create($datos + ['avatar' => 'default.jpg']);
        $doctor->roles()->syncWithoutDetaching([self::ROL_DOCTOR]);

        return back()->with('success', "El doctor {$doctor->nombre_completo} ha sido guardado exitosamente.");
    }

    public function update(Request $request, User $doctor): RedirectResponse
    {
        $doctor->update($this->validar($request, $doctor));

        return back()->with('success', "El doctor {$doctor->nombre_completo} ha sido actualizado correctamente.");
    }

    public function destroy(User $doctor): RedirectResponse
    {
        if (Query::where('doctor_id', $doctor->id)->exists()) {
            return back()->with('warning', 'No se puede eliminar: el doctor cuenta con historial clínico.');
        }

        $nombre = $doctor->nombre_completo;
        $doctor->roles()->detach();
        $doctor->specialities()->detach();
        $doctor->dias()->delete();
        $doctor->delete();

        return back()->with('success', "El Dr. {$nombre} ha sido eliminado correctamente.");
    }

    public function actualizarClave(Request $request, User $doctor): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ], [], ['password' => 'contraseña']);

        $doctor->update(['password' => $request->string('password')->value()]);

        return back()->with('success', "La contraseña de {$doctor->nombre_completo} fue actualizada correctamente.");
    }

    public function sincronizarEspecialidades(Request $request, User $doctor): RedirectResponse
    {
        $datos = $request->validate([
            'especialidades' => ['array'],
            'especialidades.*' => ['integer', 'exists:specialities,id'],
            'estudios_complementarios' => ['nullable', 'string', 'max:191'],
        ]);

        $doctor->specialities()->sync($datos['especialidades'] ?? []);
        $doctor->update(['estudios_complementarios' => $datos['estudios_complementarios'] ?? null]);

        return back()->with('success', "Las especialidades del Dr. {$doctor->apellidos} se actualizaron correctamente.");
    }

    /** Días de agenda abiertos por el doctor. */
    public function dias(User $doctor): JsonResponse
    {
        return response()->json([
            'doctor' => ['id' => $doctor->id, 'nombre' => $doctor->nombre_completo],
            'dias' => $doctor->dias()->orderBy('fecha_inicio')->get()->map(fn (Dia $dia) => [
                'id' => $dia->id,
                'fecha' => $dia->fecha_inicio?->format('Y-m-d'),
                'hora_inicio' => $dia->fecha_inicio?->format('H:i'),
                'hora_fin' => $dia->fecha_fin?->format('H:i'),
                'observacion' => $dia->observacion,
                'color' => $dia->color,
            ]),
        ]);
    }

    public function guardarDia(Request $request, User $doctor): RedirectResponse
    {
        $datos = $request->validate([
            'fecha' => ['required', 'date'],
            'hora_inicio' => ['required', 'date_format:H:i'],
            'hora_fin' => ['required', 'date_format:H:i', 'after:hora_inicio'],
            'observacion' => ['nullable', 'string', 'max:191'],
        ], [], [
            'fecha' => 'fecha',
            'hora_inicio' => 'hora de inicio',
            'hora_fin' => 'hora de fin',
        ]);

        $fecha = Carbon::parse($datos['fecha'])->toDateString();
        $inicio = Carbon::parse($fecha.' '.$datos['hora_inicio']);

        if (Dia::where('doctor_id', $doctor->id)->where('fecha_inicio', $inicio)->exists()) {
            throw ValidationException::withMessages([
                'fecha' => 'El doctor ya tiene habilitado este día y hora para agendar citas.',
            ]);
        }

        Dia::create([
            'doctor_id' => $doctor->id,
            'fecha_inicio' => $inicio,
            'fecha_fin' => Carbon::parse($fecha.' '.$datos['hora_fin']),
            'title' => 'Disponible',
            'color' => '#0d9488',
            'observacion' => $datos['observacion'] ?? '',
        ]);

        return back()->with('success', 'Se asignó este día para agendar citas.');
    }

    public function eliminarDia(Dia $dia): RedirectResponse
    {
        $dia->delete();

        return back()->with('success', 'El día se quitó de la agenda.');
    }

    // -----------------------------------------------------------------

    /** @return array<string, mixed> */
    private function validar(Request $request, ?User $doctor = null): array
    {
        $datos = $request->validate([
            'rut' => ['required', 'string', 'max:10', Rule::unique('users', 'rut')->ignore($doctor?->id)],
            'username' => ['nullable', 'string', 'max:50', Rule::unique('users', 'username')->ignore($doctor?->id)],
            'nombres' => ['required', 'string', 'max:191'],
            'apellidos' => ['required', 'string', 'max:191'],
            'nacimiento' => ['required', 'date'],
            'email' => ['required', 'email', 'max:191'],
            'telefono' => ['required', 'string', 'min:6', 'max:191'],
            'direccion' => ['required', 'string', 'max:191'],
            'genero' => ['required', 'string', 'max:191'],
            'titulo' => ['nullable', 'string', 'max:191'],
            'firma' => ['nullable', 'string', 'max:190'],
        ], [], [
            'rut' => 'identificación',
            'nombres' => 'nombres',
            'apellidos' => 'apellidos',
            'nacimiento' => 'fecha de nacimiento',
            'genero' => 'género',
        ]);

        $datos['nacimiento'] = Carbon::parse($datos['nacimiento'])->toDateString();

        return $datos;
    }
}
