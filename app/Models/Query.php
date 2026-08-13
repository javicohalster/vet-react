<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Consulta médica (tabla `queries`). Una fila nace como cita "pendiente" y
 * pasa a "atendido" cuando el doctor registra la atención.
 *
 * Los bloques de campos corresponden a las pestañas del formulario de atención:
 * consulta general, vacunación, desparasitación, cirugía y hospitalización.
 */
class Query extends Model
{
    protected $table = 'queries';

    public const ESTADO_PENDIENTE = 'pendiente';

    public const ESTADO_ATENDIDO = 'atendido';

    public const COLOR_PENDIENTE = '#0d9488';

    public const COLOR_ATENDIDO = '#64748b';

    protected $fillable = [
        'fecha_inicio',
        'fecha_fin',
        'estado',
        'color',
        'descripcion',
        'doctor_id',
        'paciente_id',
        'unity_id',
        'speciality_id',

        // Consulta general
        'sintomas',
        'examenes',
        'tratamiento',
        'trata',
        'observaciones',
        'temperatura',
        'peso',
        'receta',
        'diagnostico',
        'tipo',
        'doctorConsulta',
        'fecharegistra',
        'fechasiguientecita',

        // Vacunación
        'fechavacuna',
        'tipovacuna',
        'diasrevacuna',
        'fechavacunasiguiente',

        // Desparasitación
        'fechadesparasitacion',
        'pesodesparasitacion',
        'descripciondesparacitacion',
        'posologia',
        'dosis',
        'diasdesparacitar',
        'fechasigueintedesparasitacion',

        // Cirugía
        'fechacirugia',
        'pesocirugia',
        'procedimientocirugia',
        'recetacirugia',

        // Hospitalización
        'fechahospitalizacion',
        'pesohospitalizar',
        'temperaturahospitalizar',
        'frecuenciacardiacahospitalizar',
        'frecuenciarespiratoriahospitalizar',
        'mucosashospitalizar',
        'hidratacionhospitalizar',
        'diagnosticohospitalizar',
        'tratamientohotpitalizar',
        'estadoaltahospitalizacion',
        'fechaaltahospitalizacion',
        'recetahospitalizar',
    ];

    protected function casts(): array
    {
        return [
            'fecha_inicio' => 'datetime',
            'fecha_fin' => 'datetime',
        ];
    }

    // -----------------------------------------------------------------
    // Relaciones
    // -----------------------------------------------------------------

    public function paciente(): BelongsTo
    {
        return $this->belongsTo(User::class, 'paciente_id');
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function especialidad(): BelongsTo
    {
        return $this->belongsTo(Speciality::class, 'speciality_id');
    }

    public function clinica(): BelongsTo
    {
        return $this->belongsTo(Unity::class, 'unity_id');
    }

    public function archivos(): HasMany
    {
        return $this->hasMany(QueryFile::class, 'query_id');
    }

    public function laboratorios(): HasMany
    {
        return $this->hasMany(Laboratorio::class, 'query_id');
    }

    // -----------------------------------------------------------------
    // Scopes
    // -----------------------------------------------------------------

    public function scopePendientes(Builder $query): Builder
    {
        return $query->where('estado', self::ESTADO_PENDIENTE);
    }

    public function scopeAtendidas(Builder $query): Builder
    {
        return $query->where('estado', self::ESTADO_ATENDIDO);
    }

    /** Un doctor solo ve su propia agenda; el resto del personal las ve todas. */
    public function scopeVisiblesPara(Builder $query, User $usuario): Builder
    {
        if ($usuario->hasRole('doctor')) {
            return $query->where('doctor_id', $usuario->id);
        }

        return $query;
    }

    /** ¿El doctor ya tiene una cita pendiente que se solape con el rango dado? */
    public static function doctorOcupado(int $doctorId, string $inicio, string $fin, ?int $ignorarId = null): bool
    {
        return static::where('doctor_id', $doctorId)
            ->where('estado', self::ESTADO_PENDIENTE)
            ->when($ignorarId, fn (Builder $q) => $q->where('id', '!=', $ignorarId))
            ->where('fecha_inicio', '<', $fin)
            ->where('fecha_fin', '>', $inicio)
            ->exists();
    }
}
