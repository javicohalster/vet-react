<?php

namespace App\Console\Commands;

use App\Mail\RecordatorioCita;
use App\Models\ConsultaVacuna;
use App\Models\Query;
use App\Models\Unity;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Avisa por correo a los propietarios cuyo paciente tiene, para mañana, una
 * próxima cita, vacuna o desparasitación programada. Reemplaza al comando
 * `recordatorio:activa` del sistema anterior.
 *
 * Las fechas de seguimiento se guardaron históricamente como texto libre en
 * dos formatos distintos (d-m-Y en registros antiguos, Y-m-d en los nuevos),
 * así que se comparan ambos.
 */
class EnviarRecordatorios extends Command
{
    protected $signature = 'recordatorios:enviar';

    protected $description = 'Envía un correo recordatorio a los pacientes con cita, vacuna o desparasitación programada para mañana';

    public function handle(): void
    {
        $fechasValidas = [
            Carbon::tomorrow()->format('Y-m-d'),
            Carbon::tomorrow()->format('d-m-Y'),
        ];

        $clinica = Unity::orderBy('id')->first();
        $fechaLegible = Carbon::tomorrow()->translatedFormat('l d \\d\\e F \\d\\e Y');

        $consultas = Query::query()
            ->whereNotNull('paciente_id')
            ->where(function ($q) use ($fechasValidas) {
                $q->whereIn('fechasiguientecita', $fechasValidas)
                    ->orWhereIn('fechavacunasiguiente', $fechasValidas)
                    ->orWhereIn('fechasigueintedesparasitacion', $fechasValidas);
            })
            ->with('paciente:id,nombres,apellidos,email')
            ->get(['id', 'paciente_id', 'fechasiguientecita', 'fechavacunasiguiente', 'fechasigueintedesparasitacion']);

        $enviados = 0;

        foreach ($consultas as $consulta) {
            $paciente = $consulta->paciente;
            if (! $paciente || ! $paciente->email) {
                continue;
            }

            foreach ($this->motivos() as $columna => $motivo) {
                if (! in_array($consulta->{$columna}, $fechasValidas, true)) {
                    continue;
                }

                Mail::to($paciente->email)->send(new RecordatorioCita(
                    paciente: $paciente->nombres,
                    propietario: $paciente->apellidos,
                    motivo: $motivo,
                    fecha: $fechaLegible,
                    clinica: $clinica,
                ));

                Log::info("Recordatorio ({$motivo}) enviado a {$paciente->email} — consulta #{$consulta->id}");
                $enviados++;
            }
        }

        // Vacunas registradas en `consulta_vacunas` (una consulta puede tener
        // varias); esta fecha sí es una columna `date` real, sin el problema
        // de formatos mixtos de las de arriba.
        $vacunas = ConsultaVacuna::whereDate('fecha_siguiente_vacuna', Carbon::tomorrow())
            ->with('consulta.paciente:id,nombres,apellidos,email')
            ->get();

        foreach ($vacunas as $vacuna) {
            $paciente = $vacuna->consulta?->paciente;
            if (! $paciente || ! $paciente->email) {
                continue;
            }

            Mail::to($paciente->email)->send(new RecordatorioCita(
                paciente: $paciente->nombres,
                propietario: $paciente->apellidos,
                motivo: 'una vacuna',
                fecha: $fechaLegible,
                clinica: $clinica,
            ));

            Log::info("Recordatorio (una vacuna) enviado a {$paciente->email} — consulta_vacuna #{$vacuna->id}");
            $enviados++;
        }

        $this->info("Recordatorios enviados: {$enviados}");
    }

    /** @return array<string, string> columna de `queries` => texto del motivo para el correo */
    private function motivos(): array
    {
        return [
            'fechasiguientecita' => 'una cita',
            'fechavacunasiguiente' => 'una vacuna',
            'fechasigueintedesparasitacion' => 'una desparasitación',
        ];
    }
}
