<?php

namespace App\Http\Controllers;

use App\Models\Query;
use App\Models\Unity;
use Illuminate\Contracts\View\View;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * Receta médica imprimible de una consulta.
 *
 * Reemplaza a `public/qr/receta.php`, que construía la consulta SQL
 * concatenando `$_GET['qr']` directamente y era accesible sin sesión.
 */
class RecetaController extends Controller
{
    public function show(Request $request, Query $consulta): View
    {
        $consulta->load([
            'paciente:id,nombres,apellidos,rut,chip,sangre,medicamento_actual,nacimiento',
            'doctor:id,nombres,apellidos,firma,titulo',
            'especialidad:id,nombre',
        ]);

        return view('impresion.receta', [
            'consulta' => $consulta,
            'fecha' => Carbon::now()->format('d/m/Y H:i'),
            'clinica' => Unity::orderBy('id')->first(),
        ]);
    }
}
