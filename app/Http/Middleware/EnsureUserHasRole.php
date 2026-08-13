<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Permite el paso si el usuario tiene al menos uno de los roles indicados.
 * Uso: ->middleware('role:administrador|doctor|recepcionista')
 */
class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string $roles): Response
    {
        $usuario = $request->user();

        if (! $usuario || ! $usuario->hasRole(explode('|', $roles))) {
            abort(403, 'No tienes un rol autorizado para acceder a esta sección.');
        }

        return $next($request);
    }
}
