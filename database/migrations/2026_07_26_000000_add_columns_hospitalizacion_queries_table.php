<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Completa el registro de hospitalización de `queries`: antes solo guardaba
 * una foto de peso/temperatura y el tratamiento; le faltaban los demás signos
 * vitales de ingreso (FC, FR, mucosas, hidratación) y todo el egreso (fecha,
 * estado y las indicaciones para la casa), que son la parte que hoy no se
 * podía registrar en absoluto.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('queries', function (Blueprint $table) {
            $table->string('frecuenciacardiacahospitalizar', 30)->nullable()->after('temperaturahospitalizar');
            $table->string('frecuenciarespiratoriahospitalizar', 30)->nullable()->after('frecuenciacardiacahospitalizar');
            $table->string('mucosashospitalizar', 100)->nullable()->after('frecuenciarespiratoriahospitalizar');
            $table->string('hidratacionhospitalizar', 100)->nullable()->after('mucosashospitalizar');
            $table->string('estadoaltahospitalizacion', 100)->nullable()->after('tratamientohotpitalizar');
            $table->string('fechaaltahospitalizacion', 50)->nullable()->after('estadoaltahospitalizacion');
        });
    }

    public function down(): void
    {
        Schema::table('queries', function (Blueprint $table) {
            $table->dropColumn([
                'frecuenciacardiacahospitalizar',
                'frecuenciarespiratoriahospitalizar',
                'mucosashospitalizar',
                'hidratacionhospitalizar',
                'estadoaltahospitalizacion',
                'fechaaltahospitalizacion',
            ]);
        });
    }
};
