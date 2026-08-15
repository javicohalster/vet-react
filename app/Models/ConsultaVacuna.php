<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Una vacuna aplicada dentro de una consulta. Una misma consulta puede tener
 * varias (el sistema anterior lo permitía; ver comentario en la migración).
 */
class ConsultaVacuna extends Model
{
    protected $fillable = ['query_id', 'fecha_vacuna', 'tipo_vacuna', 'dias_revacunar', 'fecha_siguiente_vacuna'];

    protected function casts(): array
    {
        return [
            'fecha_vacuna' => 'date',
            'fecha_siguiente_vacuna' => 'date',
        ];
    }

    public function consulta(): BelongsTo
    {
        return $this->belongsTo(Query::class, 'query_id');
    }
}
