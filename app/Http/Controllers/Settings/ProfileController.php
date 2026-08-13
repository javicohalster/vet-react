<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Mis Datos": equivalente a PerfilController del sistema anterior. No
 * incluye eliminar la propia cuenta, algo que el sistema anterior tampoco
 * permitía (las cuentas solo las borra un administrador desde "Personas").
 */
class ProfileController extends Controller
{
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/profile', [
            'status' => $request->session()->get('status'),
        ]);
    }

    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $datos = $request->validated();
        $datos['nacimiento'] = Carbon::parse($datos['nacimiento'])->toDateString();

        $request->user()->update($datos);

        return to_route('profile.edit')->with('success', 'Mis datos se han actualizado correctamente.');
    }
}
