<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Catálogo de tipos de vacuna. Antes era una lista fija en el código
     * (nunca vino de una tabla); se convierte en editable desde
     * Mantenimiento y se siembra con los mismos valores que ya existían,
     * para no perder ninguno.
     */
    public function up(): void
    {
        Schema::create('tipos_vacuna', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 191)->unique();
            $table->timestamps();
        });

        $nombres = [
            'BIOZOO PUPPY FENCE L5', 'HIPRADOG PV', 'HIPRADOG 7', 'PFIZER 5L', 'PFIZER 5L + RABIGEN MONO',
            'PFIZER 5L4', 'PFIZER 5L4 CV', 'PFIZER BRONCHICINE', 'BAGOVAC RABIA', 'VIRBAC CANIGEN MHA2PPi / LR',
            'HIPRADOG 7 - BAGOVAC RABIA', 'PFIZER 5L - BAGOVAC RABIA', 'PFIZER 5L4 - BAGOVAC RABIA',
            'VIRBAC FELIGEN CPR', 'VIRBAC FELIGEN CPR - BAGOVAC RABIA', 'PFIZER FELOCELL 3',
            'PFIZER FELOCELL 3 - BAGOVAC RABIA', 'VIRBAC RABIGEN MONO', 'VIRBAC CANIGEN MHA2PPi / L',
            'VIRBAC FELIGEN CPR - RABIGEN MONO', 'DEFENSOR',
        ];

        $ahora = now();

        DB::table('tipos_vacuna')->insert(
            array_map(fn (string $nombre) => ['nombre' => $nombre, 'created_at' => $ahora, 'updated_at' => $ahora], $nombres)
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('tipos_vacuna');
    }
};
