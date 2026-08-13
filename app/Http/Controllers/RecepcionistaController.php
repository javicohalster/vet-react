<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RecepcionistaController extends Controller
{
    private const ROL_RECEPCIONISTA = 3;

    public function index(Request $request): Response
    {
        $buscar = trim((string) $request->query('buscar', ''));

        $recepcionistas = User::withRole('recepcionista')
            ->when($buscar !== '', fn (Builder $q) => $q->where(fn (Builder $s) => $s
                ->where('nombres', 'like', "%{$buscar}%")
                ->orWhere('apellidos', 'like', "%{$buscar}%")
                ->orWhere('rut', 'like', "%{$buscar}%")
                ->orWhere('email', 'like', "%{$buscar}%")))
            ->orderBy('apellidos')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (User $persona) => [
                'id' => $persona->id,
                'rut' => $persona->rut,
                'username' => $persona->username,
                'nombres' => $persona->nombres,
                'apellidos' => $persona->apellidos,
                'email' => $persona->email,
                'telefono' => $persona->telefono,
                'direccion' => $persona->direccion,
                'genero' => $persona->genero,
                'nacimiento' => $persona->nacimiento?->format('Y-m-d'),
            ]);

        return Inertia::render('recepcionistas/index', [
            'recepcionistas' => $recepcionistas,
            'filtros' => ['buscar' => $buscar],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $recepcionista = User::create($this->validar($request) + ['avatar' => 'default.jpg']);
        $recepcionista->roles()->syncWithoutDetaching([self::ROL_RECEPCIONISTA]);

        return back()->with('success', "El recepcionista {$recepcionista->nombre_completo} ha sido guardado exitosamente.");
    }

    public function update(Request $request, User $recepcionista): RedirectResponse
    {
        $recepcionista->update($this->validar($request, $recepcionista));

        return back()->with('success', "El recepcionista {$recepcionista->nombre_completo} ha sido actualizado correctamente.");
    }

    public function destroy(User $recepcionista): RedirectResponse
    {
        $nombre = $recepcionista->nombre_completo;
        $recepcionista->roles()->detach();
        $recepcionista->delete();

        return back()->with('success', "Los registros de {$nombre} han sido eliminados correctamente.");
    }

    public function actualizarClave(Request $request, User $recepcionista): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ], [], ['password' => 'contraseña']);

        $recepcionista->update(['password' => $request->string('password')->value()]);

        return back()->with('success', "La contraseña de {$recepcionista->nombre_completo} fue actualizada correctamente.");
    }

    /** @return array<string, mixed> */
    private function validar(Request $request, ?User $recepcionista = null): array
    {
        $datos = $request->validate([
            'rut' => ['required', 'string', 'max:10', Rule::unique('users', 'rut')->ignore($recepcionista?->id)],
            'username' => ['nullable', 'string', 'max:50', Rule::unique('users', 'username')->ignore($recepcionista?->id)],
            'nombres' => ['required', 'string', 'max:191'],
            'apellidos' => ['required', 'string', 'max:191'],
            'nacimiento' => ['required', 'date'],
            'email' => ['required', 'email', 'max:191'],
            'telefono' => ['required', 'string', 'min:6', 'max:191'],
            'direccion' => ['required', 'string', 'max:191'],
            'genero' => ['required', 'string', 'max:191'],
        ], [], [
            'rut' => 'identificación',
            'nacimiento' => 'fecha de nacimiento',
            'genero' => 'género',
        ]);

        $datos['nacimiento'] = Carbon::parse($datos['nacimiento'])->toDateString();

        return $datos;
    }
}
