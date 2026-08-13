<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Permite el paso si el usuario tiene al menos uno de los permisos indicados.
 * Uso: ->middleware('permission:leer-pacientes|leer-citas')
 */
class EnsureUserHasPermission
{
    public function handle(Request $request, Closure $next, string $permissions): Response
    {
        $usuario = $request->user();

        if (! $usuario || ! $usuario->hasPermission(explode('|', $permissions))) {
            abort(403, 'No tienes permiso para acceder a esta sección.');
        }

        return $next($request);
    }
}
