<?php

namespace App\Http\Controllers;

use App\Models\Query;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Siguientes Citas": pacientes con una próxima cita agendada dentro del
 * rango de fechas indicado.
 *
 * `queries.fechasiguientecita` es un varchar en formato dd-mm-aaaa. El sistema
 * anterior lo comparaba como texto, por lo que el rango ordenaba por día en
 * lugar de por fecha y devolvía resultados incorrectos. Aquí se convierte a
 * fecha real con STR_TO_DATE antes de filtrar y ordenar.
 */
class RevisarController extends Controller
{
    private const FORMATO_SQL = "STR_TO_DATE(queries.fechasiguientecita, '%d-%m-%Y')";

    public function index(Request $request): Response
    {
        $desde = $request->date('desde') ?? Carbon::today();
        $hasta = $request->date('hasta') ?? Carbon::today()->addWeek();
        $buscar = trim((string) $request->query('buscar', ''));

        $citas = Query::query()
            ->join('users as paciente', 'queries.paciente_id', '=', 'paciente.id')
            ->whereNotNull('queries.fechasiguientecita')
            ->where('queries.fechasiguientecita', '<>', '')
            ->whereRaw(self::FORMATO_SQL.' BETWEEN ? AND ?', [$desde->toDateString(), $hasta->toDateString()])
            ->when($buscar !== '', function ($query) use ($buscar) {
                $query->where(function ($q) use ($buscar) {
                    $q->where('paciente.nombres', 'like', "%{$buscar}%")
                        ->orWhere('paciente.apellidos', 'like', "%{$buscar}%")
                        ->orWhere('paciente.rut', 'like', "%{$buscar}%")
                        ->orWhere('paciente.telefono', 'like', "%{$buscar}%");
                });
            })
            ->orderByRaw(self::FORMATO_SQL.' asc')
            ->select([
                'queries.id',
                'queries.fechasiguientecita',
                'paciente.id as paciente_id',
                'paciente.rut',
                'paciente.chip',
                'paciente.nombres',
                'paciente.apellidos',
                'paciente.telefono',
                'paciente.email',
                'paciente.sangre as raza',
                'paciente.nacimiento',
                'paciente.fecha_ult_atencion',
                DB::raw(self::FORMATO_SQL.' as proxima_fecha'),
            ])
            ->paginate(20)
            ->withQueryString()
            ->through(fn ($fila) => [
                'id' => $fila->id,
                'paciente_id' => $fila->paciente_id,
                'rut' => $fila->rut,
                'chip' => $fila->chip,
                'nombres' => mb_convert_case((string) $fila->nombres, MB_CASE_TITLE, 'UTF-8'),
                'apellidos' => mb_convert_case((string) $fila->apellidos, MB_CASE_TITLE, 'UTF-8'),
                'telefono' => $fila->telefono,
                'email' => $fila->email,
                'raza' => $fila->raza,
                'edad' => $fila->nacimiento ? $this->edad($fila->nacimiento) : null,
                'ultima_atencion' => $fila->fecha_ult_atencion
                    ? Carbon::parse($fila->fecha_ult_atencion)->format('d/m/Y')
                    : null,
                'proxima_cita' => $fila->proxima_fecha
                    ? Carbon::parse($fila->proxima_fecha)->format('d/m/Y')
                    : $fila->fechasiguientecita,
                'dias_restantes' => $fila->proxima_fecha
                    ? Carbon::today()->diffInDays(Carbon::parse($fila->proxima_fecha), false)
                    : null,
            ]);

        return Inertia::render('revisar/index', [
            'citas' => $citas,
            'filtros' => [
                'buscar' => $buscar,
                'desde' => $desde->toDateString(),
                'hasta' => $hasta->toDateString(),
            ],
        ]);
    }

    private function edad(string $nacimiento): string
    {
        $diff = Carbon::parse($nacimiento)->diff(Carbon::now());

        return sprintf('%d años, %d mes, %d días', $diff->y, $diff->m, $diff->d);
    }
}
