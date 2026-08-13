<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Contracts\View\View;
use Illuminate\Support\Carbon;

/**
 * Ficha del paciente accesible mediante el código QR impreso.
 *
 * Reemplaza a `public/qr/ficha_qr.php`. Se mantiene pública (es el propósito
 * del QR), pero ahora usa Eloquent con parámetros enlazados en lugar de
 * interpolar `$_GET['qr']` en la consulta SQL.
 */
class FichaPublicaController extends Controller
{
    public function show(User $paciente): View
    {
        abort_unless($paciente->hasRole('paciente'), 404);

        return view('impresion.ficha-qr', [
            'paciente' => $paciente,
            'edad' => $paciente->edad,
            'fecha' => Carbon::now()->format('d/m/Y H:i'),
        ]);
    }
}
