<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\Ordenable;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RolController extends Controller
{
    use Ordenable;

    private const COLUMNAS_ORDENABLES = [
        'name' => 'name',
        'display_name' => 'display_name',
        'usuarios' => 'users_count',
    ];

    public function index(Request $request): Response
    {
        $buscar = trim((string) $request->query('buscar', ''));

        $consulta = Role::query()
            ->when($buscar !== '', fn ($q) => $q->where(fn ($s) => $s
                ->where('name', 'like', "%{$buscar}%")
                ->orWhere('display_name', 'like', "%{$buscar}%")))
            ->with('permissions:id,name')
            ->withCount('users');

        $orden = $this->aplicarOrden($consulta, $request, self::COLUMNAS_ORDENABLES, 'name');

        $roles = $consulta
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Role $rol) => [
                'id' => $rol->id,
                'name' => $rol->name,
                'display_name' => $rol->display_name,
                'description' => $rol->description,
                'usuarios' => $rol->users_count,
                'permisos' => $rol->permissions->pluck('name'),
                'permisos_ids' => $rol->permissions->pluck('id'),
            ]);

        return Inertia::render('roles/index', [
            'roles' => $roles,
            'filtros' => ['buscar' => $buscar, ...$orden],
            'permisos' => Permission::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $rol = Role::create($this->validar($request));

        return back()->with('success', "El rol {$rol->name} ha sido guardado exitosamente.");
    }

    public function update(Request $request, Role $rol): RedirectResponse
    {
        $rol->update($this->validar($request, $rol));

        return back()->with('success', "El rol {$rol->name} ha sido actualizado correctamente.");
    }

    public function destroy(Role $rol): RedirectResponse
    {
        if ($rol->users()->exists()) {
            return back()->with('warning', 'No se puede eliminar: el rol está asignado a una o más personas.');
        }

        $nombre = $rol->name;
        $rol->permissions()->detach();
        $rol->delete();

        return back()->with('success', "El rol {$nombre} ha sido eliminado correctamente.");
    }

    public function sincronizarPermisos(Request $request, Role $rol): RedirectResponse
    {
        $datos = $request->validate([
            'permisos' => ['array'],
            'permisos.*' => ['integer', 'exists:permissions,id'],
        ]);

        $rol->permissions()->sync($datos['permisos'] ?? []);

        return back()->with('success', "Los permisos del rol {$rol->name} se han guardado correctamente.");
    }

    /** @return array<string, mixed> */
    private function validar(Request $request, ?Role $rol = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:191', Rule::unique('roles', 'name')->ignore($rol?->id)],
            'display_name' => ['nullable', 'string', 'max:191'],
            'description' => ['nullable', 'string', 'max:191'],
        ], [], ['name' => 'nombre', 'display_name' => 'nombre visible', 'description' => 'descripción']);
    }
}
