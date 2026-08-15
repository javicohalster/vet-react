<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Permite registrar varias vacunas en la misma consulta/historia clínica
     * (el sistema anterior lo permitía; el nuevo solo tenía un juego de
     * columnas de vacuna en `queries`, que se conservan para no perder los
     * datos ya migrados y siguen siendo la "primera" vacuna de consultas
     * viejas).
     */
    public function up(): void
    {
        Schema::create('consulta_vacunas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('query_id')->constrained('queries')->cascadeOnDelete();
            $table->date('fecha_vacuna')->nullable();
            $table->string('tipo_vacuna', 150)->nullable();
            $table->unsignedInteger('dias_revacunar')->nullable();
            $table->date('fecha_siguiente_vacuna')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('consulta_vacunas');
    }
};
