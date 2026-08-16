<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\Ordenable;
use App\Models\Query;
use App\Models\Speciality;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class EspecialidadController extends Controller
{
    use Ordenable;

    private const COLUMNAS_ORDENABLES = [
        'nombre' => 'nombre',
        'doctores' => 'users_count',
    ];

    public function index(Request $request): Response
    {
        $buscar = trim((string) $request->query('buscar', ''));

        $consulta = Speciality::query()
            ->when($buscar !== '', fn ($q) => $q->where('nombre', 'like', "%{$buscar}%"))
            ->withCount('users');

        $orden = $this->aplicarOrden($consulta, $request, self::COLUMNAS_ORDENABLES, 'nombre');

        $especialidades = $consulta
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Speciality $especialidad) => [
                'id' => $especialidad->id,
                'nombre' => $especialidad->nombre,
                'doctores' => $especialidad->users_count,
                'consultas' => Query::where('speciality_id', $especialidad->id)->count(),
            ]);

        return Inertia::render('especialidades/index', [
            'especialidades' => $especialidades,
            'filtros' => ['buscar' => $buscar, ...$orden],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $datos = $request->validate([
            'nombre' => ['required', 'string', 'max:191', Rule::unique('specialities', 'nombre')],
        ], [], ['nombre' => 'nombre']);

        $especialidad = Speciality::create($datos);

        return back()->with('success', "La especialidad {$especialidad->nombre} ha sido guardada exitosamente.");
    }

    public function update(Request $request, Speciality $especialidad): RedirectResponse
    {
        $datos = $request->validate([
            'nombre' => ['required', 'string', 'max:191', Rule::unique('specialities', 'nombre')->ignore($especialidad->id)],
        ], [], ['nombre' => 'nombre']);

        $especialidad->update($datos);

        return back()->with('success', "La especialidad {$especialidad->nombre} ha sido actualizada correctamente.");
    }

    public function destroy(Speciality $especialidad): RedirectResponse
    {
        if (Query::where('speciality_id', $especialidad->id)->exists()) {
            return back()->with('warning', 'No se puede eliminar: la especialidad cuenta con historial clínico.');
        }

        $nombre = $especialidad->nombre;
        $especialidad->users()->detach();
        $especialidad->delete();

        return back()->with('success', "La especialidad {$nombre} ha sido eliminada correctamente.");
    }
}
