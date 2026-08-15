<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * `peso` era `int`, así que un valor como 3.5 kg se truncaba a 3.
     * Se cambia a decimal para que las mascotas con peso fraccionario
     * (muy común en gatos y perros pequeños) se guarden correctamente.
     */
    public function up(): void
    {
        // Dato heredado del sistema anterior: '0000-00-00' como "sin fecha".
        // Bajo SQL strict mode, cualquier ALTER TABLE sobre `users` falla
        // mientras existan filas con esa fecha inválida, aunque la columna
        // que se está alterando no sea esa. Se normaliza a NULL primero.
        DB::table('users')->where('fecha_ult_atencion', '0000-00-00')->update(['fecha_ult_atencion' => null]);

        Schema::table('users', function (Blueprint $table) {
            $table->decimal('peso', 6, 2)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->integer('peso')->nullable()->change();
        });
    }
};
