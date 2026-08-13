<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Un parámetro/analito de un examen de laboratorio (ej. "Hematocrito: 42 % — ref. 37-55"). */
class LaboratorioResultado extends Model
{
    protected $table = 'laboratorio_resultados';

    protected $fillable = [
        'laboratorio_id',
        'parametro',
        'resultado',
        'unidad',
        'valor_referencia',
        'alterado',
        'orden',
    ];

    protected function casts(): array
    {
        return [
            'alterado' => 'boolean',
        ];
    }

    public function laboratorio(): BelongsTo
    {
        return $this->belongsTo(Laboratorio::class, 'laboratorio_id');
    }
}
