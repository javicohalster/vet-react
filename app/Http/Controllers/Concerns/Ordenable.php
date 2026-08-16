<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Http\Request;

/**
 * Ordenamiento ascendente/descendente por columna en las tablas grandes
 * (DataTable). Cada controlador define qué columnas visibles se pueden
 * ordenar y a qué columna real de la base corresponden, para no permitir
 * ordenar por cualquier cosa que llegue en la URL.
 */
trait Ordenable
{
    /**
     * Aplica el orden pedido por la URL (si es una columna permitida) o el
     * de por defecto. Devuelve ['orden' => ..., 'direccion' => ...] para
     * mandar de vuelta al frontend y que la tabla marque la columna activa.
     *
     * @param  array<string, string>  $columnas  columna visible => columna real en la base
     * @return array{orden: string, direccion: string}
     */
    protected function aplicarOrden(
        Builder $query,
        Request $request,
        array $columnas,
        string $porDefecto,
        string $direccionPorDefecto = 'asc',
    ): array {
        $orden = $request->query('orden');
        $direccion = $request->query('direccion') === 'desc' ? 'desc' : 'asc';

        if (! is_string($orden) || ! array_key_exists($orden, $columnas)) {
            $orden = $porDefecto;
            $direccion = $direccionPorDefecto;
        }

        $query->orderBy($columnas[$orden], $direccion);

        return ['orden' => $orden, 'direccion' => $direccion];
    }
}
