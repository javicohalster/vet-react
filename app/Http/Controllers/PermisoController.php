<?php

namespace App\Http\Controllers;

use App\Models\Permission;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PermisoController extends Controller
{
    public function index(Request $request): Response
    {
        $buscar = trim((string) $request->query('buscar', ''));

        $permisos = Permission::query()
            ->when($buscar !== '', fn ($q) => $q->where('name', 'like', "%{$buscar}%"))
            ->with('roles:id,name')
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Permission $permiso) => [
                'id' => $permiso->id,
                'name' => $permiso->name,
                'display_name' => $permiso->display_name,
                'description' => $permiso->description,
                'roles' => $permiso->roles->pluck('name'),
            ]);

        return Inertia::render('permisos/index', [
            'permisos' => $permisos,
            'filtros' => ['buscar' => $buscar],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $permiso = Permission::create($this->validar($request));

        return back()->with('success', "El permiso {$permiso->name} ha sido guardado exitosamente.");
    }

    public function update(Request $request, Permission $permiso): RedirectResponse
    {
        $permiso->update($this->validar($request, $permiso));

        return back()->with('success', "El permiso {$permiso->name} ha sido actualizado correctamente.");
    }

    public function destroy(Permission $permiso): RedirectResponse
    {
        if ($permiso->roles()->exists()) {
            return back()->with('warning', 'No se puede eliminar: el permiso está asignado a un rol.');
        }

        $nombre = $permiso->name;
        $permiso->delete();

        return back()->with('success', "El permiso {$nombre} ha sido eliminado correctamente.");
    }

    /** @return array<string, mixed> */
    private function validar(Request $request, ?Permission $permiso = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:191', Rule::unique('permissions', 'name')->ignore($permiso?->id)],
            'display_name' => ['nullable', 'string', 'max:191'],
            'description' => ['nullable', 'string', 'max:191'],
        ], [], ['name' => 'nombre', 'display_name' => 'nombre visible', 'description' => 'descripción']);
    }
}
