<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Parámetros individuales de un examen (una fila por analito, con su valor de referencia). */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('laboratorio_resultados', function (Blueprint $table) {
            $table->id();
            $table->foreignId('laboratorio_id')->constrained('laboratorios')->cascadeOnDelete();
            $table->string('parametro', 150);
            $table->string('resultado', 150)->nullable();
            $table->string('unidad', 50)->nullable();
            $table->string('valor_referencia', 100)->nullable();
            $table->boolean('alterado')->default(false);
            $table->unsignedInteger('orden')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('laboratorio_resultados');
    }
};
