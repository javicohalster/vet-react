<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Da de alta los permisos del nuevo módulo de Laboratorio y los asigna a los
 * mismos roles que ya pueden crear/editar/eliminar pacientes (administrador y
 * doctor), igual que el resto de módulos clínicos de la app.
 */
return new class extends Migration
{
    public function up(): void
    {
        $ahora = now();

        $permisos = ['crear-laboratorio', 'editar-laboratorio', 'eliminar-laboratorio', 'leer-laboratorio'];

        foreach ($permisos as $nombre) {
            DB::table('permissions')->insertOrIgnore([
                'name' => $nombre,
                'created_at' => $ahora,
                'updated_at' => $ahora,
            ]);
        }

        $roles = DB::table('roles')->whereIn('name', ['administrador', 'doctor'])->pluck('id', 'name');
        $idsPermisos = DB::table('permissions')->whereIn('name', $permisos)->pluck('id', 'name');

        foreach ($roles as $rolId) {
            foreach ($idsPermisos as $permisoId) {
                DB::table('permission_role')->insertOrIgnore([
                    'role_id' => $rolId,
                    'permission_id' => $permisoId,
                ]);
            }
        }
    }

    public function down(): void
    {
        $permisos = ['crear-laboratorio', 'editar-laboratorio', 'eliminar-laboratorio', 'leer-laboratorio'];
        $ids = DB::table('permissions')->whereIn('name', $permisos)->pluck('id');

        DB::table('permission_role')->whereIn('permission_id', $ids)->delete();
        DB::table('permissions')->whereIn('name', $permisos)->delete();
    }
};
