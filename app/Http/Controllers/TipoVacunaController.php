<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\Ordenable;
use App\Models\ConsultaVacuna;
use App\Models\TipoVacuna;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Mantenimiento del catálogo de tipos de vacuna. Antes era una lista fija
 * en el código de "Atender consulta"; ahora se administra aquí y ese
 * formulario la consulta desde la base.
 */
class TipoVacunaController extends Controller
{
    use Ordenable;

    private const COLUMNAS_ORDENABLES = ['nombre' => 'nombre'];

    public function index(Request $request): Response
    {
        $buscar = trim((string) $request->query('buscar', ''));

        $consulta = TipoVacuna::query()
            ->when($buscar !== '', fn ($q) => $q->where('nombre', 'like', "%{$buscar}%"));

        $orden = $this->aplicarOrden($consulta, $request, self::COLUMNAS_ORDENABLES, 'nombre');

        $tiposVacuna = $consulta
            ->paginate(15)
            ->withQueryString()
            ->through(fn (TipoVacuna $tipo) => [
                'id' => $tipo->id,
                'nombre' => $tipo->nombre,
                'aplicaciones' => ConsultaVacuna::where('tipo_vacuna', $tipo->nombre)->count(),
            ]);

        return Inertia::render('vacunas/index', [
            'tiposVacuna' => $tiposVacuna,
            'filtros' => ['buscar' => $buscar, ...$orden],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $datos = $request->validate([
            'nombre' => ['required', 'string', 'max:191', Rule::unique('tipos_vacuna', 'nombre')],
        ], [], ['nombre' => 'nombre']);

        $tipo = TipoVacuna::create($datos);

        return back()->with('success', "La vacuna {$tipo->nombre} ha sido guardada exitosamente.");
    }

    public function update(Request $request, TipoVacuna $vacuna): RedirectResponse
    {
        $datos = $request->validate([
            'nombre' => ['required', 'string', 'max:191', Rule::unique('tipos_vacuna', 'nombre')->ignore($vacuna->id)],
        ], [], ['nombre' => 'nombre']);

        $vacuna->update($datos);

        return back()->with('success', "La vacuna {$vacuna->nombre} ha sido actualizada correctamente.");
    }

    public function destroy(TipoVacuna $vacuna): RedirectResponse
    {
        $nombre = $vacuna->nombre;
        $vacuna->delete();

        return back()->with('success', "La vacuna {$nombre} ha sido eliminada del catálogo. Las consultas ya registradas con ella no se modifican.");
    }
}
