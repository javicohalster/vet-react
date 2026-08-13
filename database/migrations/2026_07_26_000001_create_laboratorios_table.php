<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Órdenes/resultados de laboratorio. Cada examen cuelga de una consulta
 * (`query_id`) para que sus imágenes e informe generado puedan aparecer,
 * sin lógica adicional, en el módulo de Documentos ya existente (que lista
 * todo por `query_files.query_id`).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('laboratorios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('query_id')->constrained('queries')->cascadeOnDelete();
            $table->foreignId('doctor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('tipo_examen', 150);
            $table->date('fecha_muestra');
            $table->date('fecha_resultado')->nullable();
            $table->string('estado', 30)->default('pendiente');
            $table->text('observaciones')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('laboratorios');
    }
};
