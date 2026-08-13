<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/** Clínica / sucursal. */
class Unity extends Model
{
    protected $table = 'unities';

    protected $fillable = ['nombre', 'telefono', 'email', 'direccion', 'avatar', 'region', 'ciudad'];

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'unity_user', 'unity_id', 'user_id');
    }
}
