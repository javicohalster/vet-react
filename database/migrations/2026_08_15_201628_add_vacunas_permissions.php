<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Permisos del mantenimiento de "tipos de vacuna". Solo administrador
 * los tiene (igual que especialidades): los doctores usan la lista al
 * atender, pero no la administran.
 */
return new class extends Migration
{
    public function up(): void
    {
        $ahora = now();

        $permisos = ['crear-vacunas', 'editar-vacunas', 'eliminar-vacunas', 'leer-vacunas'];

        foreach ($permisos as $nombre) {
            DB::table('permissions')->insertOrIgnore([
                'name' => $nombre,
                'guard_name' => 'web',
                'created_at' => $ahora,
                'updated_at' => $ahora,
            ]);
        }

        $rolAdministrador = DB::table('roles')->where('name', 'administrador')->value('id');
        $idsPermisos = DB::table('permissions')->whereIn('name', $permisos)->pluck('id');

        foreach ($idsPermisos as $permisoId) {
            DB::table('permission_role')->insertOrIgnore([
                'role_id' => $rolAdministrador,
                'permission_id' => $permisoId,
            ]);
        }
    }

    public function down(): void
    {
        $permisos = ['crear-vacunas', 'editar-vacunas', 'eliminar-vacunas', 'leer-vacunas'];
        $ids = DB::table('permissions')->whereIn('name', $permisos)->pluck('id');

        DB::table('permission_role')->whereIn('permission_id', $ids)->delete();
        DB::table('permissions')->whereIn('name', $permisos)->delete();
    }
};
