<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Día/franja horaria en que un doctor abre agenda para recibir citas. */
class Dia extends Model
{
    protected $table = 'dias';

    protected $fillable = ['fecha_inicio', 'fecha_fin', 'title', 'color', 'observacion', 'doctor_id'];

    protected function casts(): array
    {
        return [
            'fecha_inicio' => 'datetime',
            'fecha_fin' => 'datetime',
        ];
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    /** ¿El doctor tiene agenda abierta que cubra el instante indicado? */
    public static function doctorTieneAgenda(int $doctorId, string $fechaInicio): bool
    {
        return static::where('doctor_id', $doctorId)
            ->whereDate('fecha_inicio', substr($fechaInicio, 0, 10))
            ->exists();
    }
}
