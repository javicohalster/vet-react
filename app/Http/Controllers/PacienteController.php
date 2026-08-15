<?php

namespace App\Http\Controllers;

use App\Models\Query;
use App\Models\Raza;
use App\Models\Unity;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;

/**
 * Pacientes (mascotas). Se almacenan en `users` con el rol "paciente"; el
 * campo `apellidos` corresponde al propietario.
 */
class PacienteController extends Controller
{
    /** Id del rol "paciente" en la tabla `roles`. */
    private const ROL_PACIENTE = 4;

    public function index(Request $request): Response
    {
        $buscar = trim((string) $request->query('buscar', ''));

        $pacientes = User::withRole('paciente')
            ->when($buscar !== '', fn (Builder $q) => $this->filtrar($q, $buscar))
            ->orderBy('nombres')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (User $paciente) => $this->fila($paciente));

        return Inertia::render('pacientes/index', [
            'pacientes' => $pacientes,
            'filtros' => ['buscar' => $buscar],
            'razas' => Raza::orderBy('nombre')->get(['id', 'nombre']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $datos = $this->validar($request);
        $this->validarAvatar($request);

        $paciente = User::create($datos + ['avatar' => 'default.jpg']);
        $paciente->roles()->syncWithoutDetaching([self::ROL_PACIENTE]);

        if ($request->hasFile('avatar')) {
            $paciente->update(['avatar' => $this->guardarAvatar($request, $paciente)]);
        }

        return back()->with('success', "El paciente {$paciente->nombres} ha sido guardado exitosamente.");
    }

    public function update(Request $request, User $paciente): RedirectResponse
    {
        $datos = $this->validar($request, $paciente);
        $this->validarAvatar($request);

        if ($request->hasFile('avatar')) {
            $datos['avatar'] = $this->guardarAvatar($request, $paciente);
        }

        $paciente->update($datos);

        return back()->with('success', "El paciente {$paciente->nombres} ha sido actualizado correctamente.");
    }

    public function destroy(User $paciente): RedirectResponse
    {
        if (Query::where('paciente_id', $paciente->id)->exists()) {
            return back()->with('warning', 'No se puede eliminar: el paciente cuenta con historial clínico.');
        }

        $nombre = $paciente->nombres;
        $paciente->roles()->detach();
        $paciente->delete();

        return back()->with('success', "Los registros del paciente {$nombre} han sido eliminados correctamente.");
    }

    /** Ficha del paciente, incluido el QR que enlaza a la ficha pública. */
    public function ficha(User $paciente): JsonResponse
    {
        return response()->json([
            'paciente' => $this->detalle($paciente),
            'urlQr' => route('fichaqr', $paciente->id),
        ]);
    }

    /** Historial clínico: todas las consultas atendidas del paciente. */
    public function expediente(User $paciente): JsonResponse
    {
        $consultas = Query::where('paciente_id', $paciente->id)
            ->where('estado', Query::ESTADO_ATENDIDO)
            ->with(['doctor:id,nombres,apellidos', 'especialidad:id,nombre'])
            ->withCount('archivos')
            ->orderByDesc('fecha_inicio')
            ->get()
            ->map(fn (Query $consulta) => [
                'id' => $consulta->id,
                'fecha' => $consulta->fecha_inicio?->format('d/m/Y'),
                'hora' => $consulta->fecha_inicio?->format('H:i'),
                'doctor' => $consulta->doctor?->nombre_completo,
                'especialidad' => $consulta->especialidad?->nombre,
                'sintomas' => $consulta->sintomas,
                'examenes' => $consulta->examenes,
                'diagnostico' => $consulta->diagnostico,
                'tratamiento' => $consulta->tratamiento,
                'trata' => $consulta->trata,
                'receta' => $consulta->receta,
                'observaciones' => $consulta->observaciones,
                'temperatura' => $consulta->temperatura,
                'peso' => $consulta->peso,
                'tipovacuna' => $consulta->tipovacuna,
                'fechavacuna' => $consulta->fechavacuna,
                'fechasiguientecita' => $consulta->fechasiguientecita,
                'procedimientocirugia' => $consulta->procedimientocirugia,
                'diagnosticohospitalizar' => $consulta->diagnosticohospitalizar,
                'archivos' => $consulta->archivos_count,
            ]);

        return response()->json([
            'paciente' => $this->detalle($paciente),
            'consultas' => $consultas,
        ]);
    }

    /** Ficha del paciente en PDF. */
    public function fichaPdf(Request $request, User $paciente): HttpResponse
    {
        $pdf = Pdf::loadView('pdf.ficha', [
            'paciente' => $paciente,
            'edad' => $paciente->edad,
            'fecha' => Carbon::now()->format('d/m/Y H:i'),
            'clinica' => Unity::orderBy('id')->first(),
            'descargadoPor' => $request->user()?->nombre_completo,
        ]);

        return $pdf->download($this->nombreArchivo($paciente, 'ficha'));
    }

    /** Una consulta del expediente en PDF. */
    public function expedientePdf(Request $request, User $paciente, Query $consulta): HttpResponse
    {
        abort_unless($consulta->paciente_id === $paciente->id, 404);

        $consulta->load(['doctor:id,nombres,apellidos,titulo', 'especialidad:id,nombre']);

        $pdf = Pdf::loadView('pdf.expediente', [
            'paciente' => $paciente,
            'edad' => $paciente->edad,
            'consulta' => $consulta,
            'fecha' => Carbon::now()->format('d/m/Y H:i'),
            'clinica' => Unity::orderBy('id')->first(),
            'descargadoPor' => $request->user()?->nombre_completo,
        ]);

        return $pdf->download($this->nombreArchivo($paciente, 'expediente-'.$consulta->id));
    }

    // -----------------------------------------------------------------

    private function filtrar(Builder $query, string $termino): Builder
    {
        return $query->where(function (Builder $q) use ($termino) {
            $q->where('nombres', 'like', "%{$termino}%")
                ->orWhere('apellidos', 'like', "%{$termino}%")
                ->orWhere('rut', 'like', "%{$termino}%")
                ->orWhere('chip', 'like', "%{$termino}%")
                ->orWhere('telefono', 'like', "%{$termino}%");
        });
    }

    /** @return array<string, mixed> */
    private function fila(User $paciente): array
    {
        return [
            'id' => $paciente->id,
            'rut' => $paciente->rut,
            'chip' => $paciente->chip,
            'nombres' => $paciente->nombres,
            'apellidos' => $paciente->apellidos,
            'telefono' => $paciente->telefono,
            'raza' => $paciente->raza,
            'color' => $paciente->color,
            'edad' => $paciente->edad,
            'nacimiento' => $paciente->nacimiento?->format('Y-m-d'),
            'ultima_atencion' => $paciente->fecha_ult_atencion?->format('d/m/Y'),
        ];
    }

    /** @return array<string, mixed> */
    private function detalle(User $paciente): array
    {
        return [
            'id' => $paciente->id,
            'avatar' => $paciente->avatar,
            'rut' => $paciente->rut,
            'chip' => $paciente->chip,
            'nombres' => $paciente->nombres,
            'apellidos' => $paciente->apellidos,
            'nacimiento' => $paciente->nacimiento?->format('Y-m-d'),
            'edad' => $paciente->edad,
            'genero' => $paciente->genero,
            'email' => $paciente->email,
            'telefono' => $paciente->telefono,
            'direccion' => $paciente->direccion,
            'raza' => $paciente->raza,
            'color' => $paciente->color,
            'peso' => $paciente->peso,
            'altura' => $paciente->altura,
            'esterilizado' => $paciente->esterilizado,
            'especie' => $paciente->especie,
            'observaciones' => $paciente->observaciones,
            'ultima_atencion' => $paciente->fecha_ult_atencion?->format('d/m/Y'),
        ];
    }

    /**
     * Traduce los nombres del formulario a las columnas reales de la tabla.
     *
     * @return array<string, mixed>
     */
    private function validar(Request $request, ?User $paciente = null): array
    {
        $datos = $request->validate([
            'rut' => ['required', 'string', 'max:191'],
            'chip' => ['nullable', 'string', 'max:255'],
            'nombres' => ['required', 'string', 'max:191'],
            'apellidos' => ['required', 'string', 'max:191'],
            'nacimiento' => ['required', 'date'],
            'email' => ['required', 'email', 'max:191'],
            'telefono' => ['required', 'string', 'max:191'],
            'direccion' => ['required', 'string', 'max:191'],
            'genero' => ['required', 'string', 'max:191'],
            'raza' => ['nullable', 'string', 'max:191'],
            'color' => ['nullable', 'string', 'max:500'],
            'peso' => ['nullable', 'numeric', 'min:0', 'max:9999.99'],
            'altura' => ['nullable', 'string', 'max:191'],
            'esterilizado' => ['nullable', 'string', 'max:191'],
            'especie' => ['nullable', 'string', 'max:191'],
            'observaciones' => ['nullable', 'string', 'max:191'],
        ], [], [
            'rut' => 'identificación',
            'nombres' => 'nombre del paciente',
            'apellidos' => 'propietario',
            'nacimiento' => 'fecha de nacimiento',
            'genero' => 'sexo',
        ]);

        return [
            'rut' => $datos['rut'],
            'chip' => $datos['chip'] ?? null,
            'nombres' => $datos['nombres'],
            'apellidos' => $datos['apellidos'],
            'nacimiento' => Carbon::parse($datos['nacimiento'])->toDateString(),
            'email' => $datos['email'],
            'telefono' => $datos['telefono'],
            'direccion' => $datos['direccion'],
            'genero' => $datos['genero'],
            // Columnas reutilizadas: se guardan con su nombre físico original.
            'sangre' => $datos['raza'] ?? null,
            'vih' => $datos['color'] ?? null,
            'peso' => $datos['peso'] ?? null,
            'altura' => $datos['altura'] ?? null,
            'alergia' => $datos['esterilizado'] ?? null,
            'medicamento_actual' => $datos['especie'] ?? null,
            'enfermedad' => $datos['observaciones'] ?? null,
        ];
    }

    private function nombreArchivo(User $paciente, string $prefijo): string
    {
        $base = trim($paciente->nombres.' '.$paciente->apellidos) ?: 'paciente';

        return $prefijo.'-'.str($base)->slug().'.pdf';
    }

    private function validarAvatar(Request $request): void
    {
        $request->validate([
            'avatar' => ['nullable', 'file', 'max:10000', 'mimes:jpeg,jpg,png,bmp'],
        ], [], ['avatar' => 'foto del paciente']);
    }

    /** Redimensiona y guarda la foto del paciente, igual que el avatar de un usuario. */
    private function guardarAvatar(Request $request, User $paciente): string
    {
        $extension = $request->file('avatar')->getClientOriginalExtension();
        $nombreArchivo = $paciente->id.'.'.$extension;

        (new ImageManager(new Driver))
            ->decodePath($request->file('avatar')->getRealPath())
            ->cover(300, 300)
            ->save(public_path('assets/img/perfiles/'.$nombreArchivo));

        return $nombreArchivo;
    }
}
