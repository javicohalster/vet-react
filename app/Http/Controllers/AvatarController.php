<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;

/** Foto de perfil del usuario en sesión (equivalente a User\AvatarController). */
class AvatarController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'avatar' => ['required', 'file', 'max:10000', 'mimes:jpeg,jpg,png,bmp'],
        ], [], ['avatar' => 'imagen']);

        $usuario = $request->user();
        $extension = $request->file('avatar')->getClientOriginalExtension();
        $nombreArchivo = $usuario->id.'.'.$extension;

        $manager = new ImageManager(new Driver);
        $manager->decodePath($request->file('avatar')->getRealPath())
            ->cover(300, 300)
            ->save(public_path('assets/img/perfiles/'.$nombreArchivo));

        $usuario->update(['avatar' => $nombreArchivo]);

        return back()->with('success', 'La imagen fue subida con éxito.');
    }
}
