<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;

/**
 * Tabla `users` heredada del sistema anterior. Almacena tanto al personal
 * (administradores, doctores, recepcionistas) como a los pacientes (mascotas).
 *
 * Para los pacientes varias columnas se reutilizan con otro significado:
 *   rut                -> CI / identificación del propietario
 *   nombres            -> nombre del paciente (mascota)
 *   apellidos          -> propietario
 *   genero             -> sexo
 *   sangre             -> raza
 *   vih                -> color
 *   alergia            -> esterilizado
 *   medicamento_actual -> especie
 *   enfermedad         -> observaciones
 *
 * Los accesores `raza`, `color`, `especie`, etc. exponen esos nombres reales
 * sin modificar la base de datos.
 */
class User extends Authenticatable
{
    use Notifiable;

    protected $table = 'users';

    protected $fillable = [
        'username',
        'nombres',
        'apellidos',
        'email',
        'password',
        'rut',
        'telefono',
        'direccion',
        'nacimiento',
        'genero',
        'estado',
        'actividad',
        'titulo',
        'estudios_complementarios',
        'posicion',
        'fecha_admision',
        'diagnostico',
        'descripcion',
        'avatar',
        'firma',
        'sangre',
        'vih',
        'peso',
        'altura',
        'alergia',
        'medicamento_actual',
        'enfermedad',
        'fecha_ult_atencion',
        'chip',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'nacimiento' => 'date',
            'fecha_ult_atencion' => 'date',
            'password' => 'hashed',
            'peso' => 'decimal:2',
        ];
    }

    // -----------------------------------------------------------------
    // Relaciones
    // -----------------------------------------------------------------

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_user', 'user_id', 'role_id');
    }

    public function specialities(): BelongsToMany
    {
        return $this->belongsToMany(Speciality::class, 'speciality_user', 'user_id', 'speciality_id');
    }

    public function unities(): BelongsToMany
    {
        return $this->belongsToMany(Unity::class, 'unity_user', 'user_id', 'unity_id');
    }

    /** Consultas en las que este usuario es el paciente. */
    public function consultas(): HasMany
    {
        return $this->hasMany(Query::class, 'paciente_id');
    }

    /** Consultas en las que este usuario es el doctor tratante. */
    public function consultasComoDoctor(): HasMany
    {
        return $this->hasMany(Query::class, 'doctor_id');
    }

    /** Días de agenda abiertos por el doctor. */
    public function dias(): HasMany
    {
        return $this->hasMany(Dia::class, 'doctor_id');
    }

    // -----------------------------------------------------------------
    // Roles y permisos (reemplaza a Zizaco\Entrust del sistema anterior)
    // -----------------------------------------------------------------

    /** Filtra usuarios que tengan el rol indicado. */
    public function scopeWithRole(Builder $query, string $role): Builder
    {
        return $query->whereHas('roles', fn (Builder $q) => $q->where('roles.name', $role));
    }

    /** @param string|array<int,string> $roles */
    public function hasRole(string|array $roles): bool
    {
        return $this->roles->whereIn('name', (array) $roles)->isNotEmpty();
    }

    /** @return array<int,string> */
    public function permissionNames(): array
    {
        return $this->roles
            ->flatMap(fn (Role $role) => $role->permissions->pluck('name'))
            ->unique()
            ->values()
            ->all();
    }

    /** @param string|array<int,string> $permissions */
    public function hasPermission(string|array $permissions): bool
    {
        $granted = $this->permissionNames();

        foreach ((array) $permissions as $permission) {
            if (in_array($permission, $granted, true)) {
                return true;
            }
        }

        return false;
    }

    // -----------------------------------------------------------------
    // Accesores y mutadores
    // -----------------------------------------------------------------

    /**
     * El sistema anterior guardaba nombres y apellidos en minúscula y los
     * mostraba capitalizados. Se conserva ese comportamiento para que los
     * datos existentes se sigan viendo igual.
     */
    public function setNombresAttribute(?string $valor): void
    {
        $this->attributes['nombres'] = mb_strtolower((string) $valor);
    }

    public function getNombresAttribute(?string $valor): string
    {
        return $this->capitalizar($valor);
    }

    public function setApellidosAttribute(?string $valor): void
    {
        $this->attributes['apellidos'] = mb_strtolower((string) $valor);
    }

    public function getApellidosAttribute(?string $valor): string
    {
        return $this->capitalizar($valor);
    }

    public function setEmailAttribute(?string $valor): void
    {
        $this->attributes['email'] = mb_strtolower((string) $valor);
    }

    private function capitalizar(?string $valor): string
    {
        return mb_convert_case((string) $valor, MB_CASE_TITLE, 'UTF-8');
    }

    /** Nombre completo: para pacientes equivale a "mascota / propietario". */
    public function getNombreCompletoAttribute(): string
    {
        return trim($this->nombres.' '.$this->apellidos);
    }

    /** Edad detallada, en el mismo formato que usaba el sistema anterior. */
    public function getEdadAttribute(): string
    {
        if (! $this->nacimiento) {
            return '';
        }

        $diff = Carbon::parse($this->nacimiento)->diff(Carbon::now());

        return sprintf('%d años, %d mes, %d días', $diff->y, $diff->m, $diff->d);
    }

    public function getEdadAniosAttribute(): ?int
    {
        return $this->nacimiento ? Carbon::parse($this->nacimiento)->age : null;
    }

    // Alias legibles sobre las columnas reutilizadas para pacientes.
    public function getRazaAttribute(): ?string
    {
        return $this->attributes['sangre'] ?? null;
    }

    public function getColorAttribute(): ?string
    {
        return $this->attributes['vih'] ?? null;
    }

    public function getEsterilizadoAttribute(): ?string
    {
        return $this->attributes['alergia'] ?? null;
    }

    public function getEspecieAttribute(): ?string
    {
        return $this->attributes['medicamento_actual'] ?? null;
    }

    public function getObservacionesAttribute(): ?string
    {
        return $this->attributes['enfermedad'] ?? null;
    }
}
