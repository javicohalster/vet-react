<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** Examen de laboratorio (hemograma, química sanguínea, uroanálisis, etc.) de una consulta. */
class Laboratorio extends Model
{
    protected $table = 'laboratorios';

    public const ESTADO_PENDIENTE = 'pendiente';

    public const ESTADO_EN_PROCESO = 'en_proceso';

    public const ESTADO_COMPLETADO = 'completado';

    protected $fillable = [
        'query_id',
        'doctor_id',
        'tipo_examen',
        'fecha_muestra',
        'fecha_resultado',
        'estado',
        'observaciones',
    ];

    protected function casts(): array
    {
        return [
            'fecha_muestra' => 'date',
            'fecha_resultado' => 'date',
        ];
    }

    public function consulta(): BelongsTo
    {
        return $this->belongsTo(Query::class, 'query_id');
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function resultados(): HasMany
    {
        return $this->hasMany(LaboratorioResultado::class, 'laboratorio_id')->orderBy('orden');
    }

    /** Archivos de la consulta a la que pertenece este examen (ahí viven las imágenes y el informe generado). */
    public function archivos(): HasMany
    {
        return $this->hasMany(QueryFile::class, 'query_id', 'query_id');
    }
}
