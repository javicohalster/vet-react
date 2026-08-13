<?php

namespace App\Http\Controllers;

use App\Models\Speciality;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Búsquedas incrementales para los selectores del frontend. La base tiene
 * miles de pacientes, así que no se envían todos al navegador.
 */
class BuscadorController extends Controller
{
    /** Doctores de una especialidad (para el campo "Doctor que atendió"). */
    public function doctoresPorEspecialidad(Speciality $especialidad): JsonResponse
    {
        $doctores = $especialidad->users()
            ->orderBy('apellidos')
            ->get(['users.id', 'users.nombres', 'users.apellidos'])
            ->map(fn (User $doctor) => [
                'id' => $doctor->id,
                'nombre' => $doctor->nombre_completo,
            ]);

        return response()->json($doctores);
    }

    public function pacientes(Request $request): JsonResponse
    {
        $termino = trim((string) $request->query('q', ''));

        $pacientes = User::withRole('paciente')
            ->when($termino !== '', function ($query) use ($termino) {
                $query->where(function ($q) use ($termino) {
                    $q->where('nombres', 'like', "%{$termino}%")
                        ->orWhere('apellidos', 'like', "%{$termino}%")
                        ->orWhere('rut', 'like', "%{$termino}%")
                        ->orWhere('chip', 'like', "%{$termino}%");
                });
            })
            ->orderBy('nombres')
            ->limit(30)
            ->get(['id', 'nombres', 'apellidos', 'rut'])
            ->map(fn (User $paciente) => [
                'id' => $paciente->id,
                'nombre' => $paciente->nombres,
                'propietario' => $paciente->apellidos,
                'rut' => $paciente->rut,
                'etiqueta' => trim($paciente->nombres.' / '.$paciente->apellidos, ' /'),
            ]);

        return response()->json($pacientes);
    }
}
