<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Catálogo de vacunas disponibles al atender una consulta (Mantenimiento > Vacunas). */
class TipoVacuna extends Model
{
    protected $table = 'tipos_vacuna';

    protected $fillable = ['nombre'];
}
