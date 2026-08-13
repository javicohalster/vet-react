<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Raza extends Model
{
    protected $table = 'razas';

    /** La tabla heredada no tiene created_at / updated_at. */
    public $timestamps = false;

    protected $fillable = ['nombre', 'url', 'descripcion', 'estado'];

    public function setNombreAttribute(?string $valor): void
    {
        $this->attributes['nombre'] = mb_strtolower((string) $valor);
    }

    public function getNombreAttribute(?string $valor): string
    {
        return mb_convert_case((string) $valor, MB_CASE_TITLE, 'UTF-8');
    }
}
