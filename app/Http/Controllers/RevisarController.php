<?php

namespace App\Http\Controllers;

use App\Models\Query;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;

/**
 * "Siguientes Citas": pacientes con una próxima cita, vacuna o
 * desparasitación programada dentro del rango de fechas indicado.
 *
 * Las fechas de seguimiento heredadas del sistema anterior (citas y
 * desparasitación) son varchar en formato dd-mm-aaaa, comparadas con
 * STR_TO_DATE. Las vacunas, en cambio, viven en `consulta_vacunas` (tabla
 * nueva) con una columna `date` real, así que no necesitan ese truco.
 */
class RevisarController extends Controller
{
    private const FORMATO_SQL_CITAS = "STR_TO_DATE(queries.fechasiguientecita, '%d-%m-%Y')";

    private const FORMATO_SQL_DESPARASITACION = "STR_TO_DATE(queries.fechasigueintedesparasitacion, '%d-%m-%Y')";

    public function index(Request $request): Response
    {
        $tipo = in_array($request->query('tipo'), ['vacunas', 'desparasitaciones'], true)
            ? $request->query('tipo')
            : 'citas';

        $desde = $request->date('desde') ?? Carbon::today();
        $hasta = $request->date('hasta') ?? Carbon::today()->addWeek();
        $buscar = trim((string) $request->query('buscar', ''));

        $filas = match ($tipo) {
            'vacunas' => $this->proximasVacunas($desde, $hasta, $buscar),
            'desparasitaciones' => $this->proximasDesparasitaciones($desde, $hasta, $buscar),
            default => $this->proximasCitas($desde, $hasta, $buscar),
        };

        return Inertia::render('revisar/index', [
            'citas' => $filas,
            'tipo' => $tipo,
            'filtros' => [
                'buscar' => $buscar,
                'desde' => $desde->toDateString(),
                'hasta' => $hasta->toDateString(),
            ],
        ]);
    }

    private function proximasCitas(Carbon $desde, Carbon $hasta, string $buscar): LengthAwarePaginator
    {
        return Query::query()
            ->join('users as paciente', 'queries.paciente_id', '=', 'paciente.id')
            ->whereNotNull('queries.fechasiguientecita')
            ->where('queries.fechasiguientecita', '<>', '')
            ->whereRaw(self::FORMATO_SQL_CITAS.' BETWEEN ? AND ?', [$desde->toDateString(), $hasta->toDateString()])
            ->when($buscar !== '', fn ($q) => $this->filtrarPaciente($q, $buscar))
            ->orderByRaw(self::FORMATO_SQL_CITAS.' asc')
            ->select([
                'queries.id',
                ...$this->columnasPaciente(),
                DB::raw(self::FORMATO_SQL_CITAS.' as fecha_proxima'),
                DB::raw('NULL as detalle'),
            ])
            ->paginate(20)
            ->withQueryString()
            ->through(fn ($fila) => $this->fila($fila));
    }

    private function proximasVacunas(Carbon $desde, Carbon $hasta, string $buscar): LengthAwarePaginator
    {
        return DB::table('consulta_vacunas as v')
            ->join('queries', 'v.query_id', '=', 'queries.id')
            ->join('users as paciente', 'queries.paciente_id', '=', 'paciente.id')
            ->whereNotNull('v.fecha_siguiente_vacuna')
            ->whereBetween('v.fecha_siguiente_vacuna', [$desde->toDateString(), $hasta->toDateString()])
            ->when($buscar !== '', fn ($q) => $this->filtrarPaciente($q, $buscar))
            ->orderBy('v.fecha_siguiente_vacuna')
            ->select([
                'v.id',
                ...$this->columnasPaciente(),
                'v.fecha_siguiente_vacuna as fecha_proxima',
                'v.tipo_vacuna as detalle',
            ])
            ->paginate(20)
            ->withQueryString()
            ->through(fn ($fila) => $this->fila($fila));
    }

    private function proximasDesparasitaciones(Carbon $desde, Carbon $hasta, string $buscar): LengthAwarePaginator
    {
        return Query::query()
            ->join('users as paciente', 'queries.paciente_id', '=', 'paciente.id')
            ->whereNotNull('queries.fechasigueintedesparasitacion')
            ->where('queries.fechasigueintedesparasitacion', '<>', '')
            ->whereRaw(self::FORMATO_SQL_DESPARASITACION.' BETWEEN ? AND ?', [$desde->toDateString(), $hasta->toDateString()])
            ->when($buscar !== '', fn ($q) => $this->filtrarPaciente($q, $buscar))
            ->orderByRaw(self::FORMATO_SQL_DESPARASITACION.' asc')
            ->select([
                'queries.id',
                ...$this->columnasPaciente(),
                DB::raw(self::FORMATO_SQL_DESPARASITACION.' as fecha_proxima'),
                'queries.descripciondesparacitacion as detalle',
            ])
            ->paginate(20)
            ->withQueryString()
            ->through(fn ($fila) => $this->fila($fila));
    }

    // -----------------------------------------------------------------

    /** @return array<int, string> */
    private function columnasPaciente(): array
    {
        return [
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
        ];
    }

    private function filtrarPaciente($query, string $termino)
    {
        return $query->where(function ($q) use ($termino) {
            $q->where('paciente.nombres', 'like', "%{$termino}%")
                ->orWhere('paciente.apellidos', 'like', "%{$termino}%")
                ->orWhere('paciente.rut', 'like', "%{$termino}%")
                ->orWhere('paciente.telefono', 'like', "%{$termino}%");
        });
    }

    /** @return array<string, mixed> */
    private function fila($fila): array
    {
        return [
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
            'fecha_proxima' => $fila->fecha_proxima
                ? Carbon::parse($fila->fecha_proxima)->format('d/m/Y')
                : null,
            'dias_restantes' => $fila->fecha_proxima
                ? Carbon::today()->diffInDays(Carbon::parse($fila->fecha_proxima), false)
                : null,
            'detalle' => $fila->detalle,
        ];
    }

    private function edad(string $nacimiento): string
    {
        $diff = Carbon::parse($nacimiento)->diff(Carbon::now());

        return sprintf('%d años, %d mes, %d días', $diff->y, $diff->m, $diff->d);
    }
}
