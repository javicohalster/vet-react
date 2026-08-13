<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Speciality extends Model
{
    protected $table = 'specialities';

    protected $fillable = ['nombre'];

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'speciality_user', 'speciality_id', 'user_id');
    }

    public function setNombreAttribute(?string $valor): void
    {
        $this->attributes['nombre'] = mb_strtolower((string) $valor);
    }

    public function getNombreAttribute(?string $valor): string
    {
        return mb_convert_case((string) $valor, MB_CASE_TITLE, 'UTF-8');
    }
}
