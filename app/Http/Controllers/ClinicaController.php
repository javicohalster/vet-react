<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\Ordenable;
use App\Models\Query;
use App\Models\Unity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Clínicas / sucursales (tabla `unities`). En el sistema anterior la vista
 * estaba vacía; aquí se implementa el CRUD completo.
 */
class ClinicaController extends Controller
{
    use Ordenable;

    private const COLUMNAS_ORDENABLES = [
        'nombre' => 'nombre',
        'telefono' => 'telefono',
        'email' => 'email',
        'region' => 'region',
        'ciudad' => 'ciudad',
    ];

    public function index(Request $request): Response
    {
        $buscar = trim((string) $request->query('buscar', ''));

        $consulta = Unity::query()
            ->when($buscar !== '', fn ($q) => $q->where(fn ($s) => $s
                ->where('nombre', 'like', "%{$buscar}%")
                ->orWhere('ciudad', 'like', "%{$buscar}%")
                ->orWhere('email', 'like', "%{$buscar}%")));

        $orden = $this->aplicarOrden($consulta, $request, self::COLUMNAS_ORDENABLES, 'nombre');

        $clinicas = $consulta
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Unity $clinica) => [
                'id' => $clinica->id,
                'nombre' => $clinica->nombre,
                'telefono' => $clinica->telefono,
                'email' => $clinica->email,
                'direccion' => $clinica->direccion,
                'region' => $clinica->region,
                'ciudad' => $clinica->ciudad,
                'consultas' => Query::where('unity_id', $clinica->id)->count(),
            ]);

        return Inertia::render('clinica/index', [
            'clinicas' => $clinicas,
            'filtros' => ['buscar' => $buscar, ...$orden],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $clinica = Unity::create($this->validar($request));

        return back()->with('success', "La clínica {$clinica->nombre} ha sido guardada exitosamente.");
    }

    public function update(Request $request, Unity $clinica): RedirectResponse
    {
        $clinica->update($this->validar($request));

        return back()->with('success', "La clínica {$clinica->nombre} ha sido actualizada correctamente.");
    }

    public function destroy(Unity $clinica): RedirectResponse
    {
        if (Query::where('unity_id', $clinica->id)->exists()) {
            return back()->with('warning', 'No se puede eliminar: la clínica tiene consultas asociadas.');
        }

        $nombre = $clinica->nombre;
        $clinica->users()->detach();
        $clinica->delete();

        return back()->with('success', "La clínica {$nombre} ha sido eliminada correctamente.");
    }

    /** @return array<string, mixed> */
    private function validar(Request $request): array
    {
        return $request->validate([
            'nombre' => ['required', 'string', 'max:191'],
            'telefono' => ['required', 'string', 'max:191'],
            'email' => ['required', 'email', 'max:191'],
            'direccion' => ['required', 'string', 'max:191'],
            'region' => ['required', 'string', 'max:191'],
            'ciudad' => ['required', 'string', 'max:191'],
        ], [], ['nombre' => 'nombre', 'telefono' => 'teléfono', 'direccion' => 'dirección']);
    }
}
