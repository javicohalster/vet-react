<?php

namespace App\Http\Controllers;

use App\Models\Query;
use App\Models\Role;
use App\Models\User;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Personas: todos los usuarios del sistema y los roles que tienen asignados.
 * Excluye a los pacientes, que se gestionan en su propio módulo.
 */
class PersonaController extends Controller
{
    public function index(Request $request): Response
    {
        $buscar = trim((string) $request->query('buscar', ''));

        $personas = User::query()
            ->whereHas('roles', fn (Builder $q) => $q->where('roles.name', '!=', 'paciente'))
            ->when($buscar !== '', fn (Builder $q) => $q->where(fn (Builder $s) => $s
                ->where('nombres', 'like', "%{$buscar}%")
                ->orWhere('apellidos', 'like', "%{$buscar}%")
                ->orWhere('rut', 'like', "%{$buscar}%")
                ->orWhere('username', 'like', "%{$buscar}%")
                ->orWhere('email', 'like', "%{$buscar}%")))
            ->with('roles:id,name,display_name')
            ->orderBy('apellidos')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (User $persona) => [
                'id' => $persona->id,
                'rut' => $persona->rut,
                'username' => $persona->username,
                'nombres' => $persona->nombres,
                'apellidos' => $persona->apellidos,
                'email' => $persona->email,
                'telefono' => $persona->telefono,
                'direccion' => $persona->direccion,
                'genero' => $persona->genero,
                'nacimiento' => $persona->nacimiento?->format('Y-m-d'),
                'roles' => $persona->roles->map(fn (Role $rol) => [
                    'id' => $rol->id,
                    'nombre' => $rol->display_name ?: $rol->name,
                ]),
                'roles_ids' => $persona->roles->pluck('id'),
            ]);

        return Inertia::render('personas/index', [
            'personas' => $personas,
            'filtros' => ['buscar' => $buscar],
            'roles' => Role::orderBy('name')->get(['id', 'name', 'display_name'])
                ->map(fn (Role $rol) => ['id' => $rol->id, 'nombre' => $rol->display_name ?: $rol->name]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $datos = $this->validar($request);
        $roles = $datos['roles'] ?? [];
        unset($datos['roles']);

        $persona = User::create($datos + ['avatar' => 'default.jpg']);
        $persona->roles()->sync($roles);

        return back()->with('success', "Los registros de {$persona->nombre_completo} se han registrado correctamente.");
    }

    public function update(Request $request, User $persona): RedirectResponse
    {
        $datos = $this->validar($request, $persona);
        unset($datos['roles']);

        $persona->update($datos);

        return back()->with('success', "Los registros de {$persona->nombre_completo} se han actualizado correctamente.");
    }

    public function destroy(User $persona): RedirectResponse
    {
        if (Query::where('doctor_id', $persona->id)->exists()) {
            return back()->with('warning', 'No se puede eliminar: la persona cuenta con historial clínico.');
        }

        $nombre = $persona->nombre_completo;
        $persona->roles()->detach();
        $persona->specialities()->detach();
        $persona->delete();

        return back()->with('success', "Los registros de {$nombre} han sido eliminados correctamente.");
    }

    public function sincronizarRoles(Request $request, User $persona): RedirectResponse
    {
        $datos = $request->validate([
            'roles' => ['array'],
            'roles.*' => ['integer', 'exists:roles,id'],
        ]);

        $persona->roles()->sync($datos['roles'] ?? []);

        return back()->with('success', "Los roles de {$persona->nombre_completo} se han actualizado correctamente.");
    }

    public function actualizarClave(Request $request, User $persona): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ], [], ['password' => 'contraseña']);

        $persona->update(['password' => $request->string('password')->value()]);

        return back()->with('success', "La contraseña de {$persona->nombre_completo} fue actualizada correctamente.");
    }

    /** @return array<string, mixed> */
    private function validar(Request $request, ?User $persona = null): array
    {
        $datos = $request->validate([
            'rut' => ['required', 'string', 'max:10', Rule::unique('users', 'rut')->ignore($persona?->id)],
            'username' => ['nullable', 'string', 'max:50', Rule::unique('users', 'username')->ignore($persona?->id)],
            'nombres' => ['required', 'string', 'max:191'],
            'apellidos' => ['required', 'string', 'max:191'],
            'nacimiento' => ['required', 'date'],
            'email' => ['required', 'email', 'max:191'],
            'telefono' => ['required', 'string', 'min:6', 'max:191'],
            'direccion' => ['required', 'string', 'max:191'],
            'genero' => ['required', 'string', 'max:191'],
            'roles' => ['array'],
            'roles.*' => ['integer', 'exists:roles,id'],
        ], [], [
            'rut' => 'identificación',
            'nacimiento' => 'fecha de nacimiento',
            'genero' => 'género',
        ]);

        $datos['nacimiento'] = Carbon::parse($datos['nacimiento'])->toDateString();

        return $datos;
    }
}
