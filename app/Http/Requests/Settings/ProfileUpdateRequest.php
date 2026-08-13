<?php

namespace App\Http\Requests\Settings;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * "Mis Datos" del sistema anterior: cada usuario edita su propia información
 * de contacto (no su rol ni datos clínicos).
 */
class ProfileUpdateRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'nombres' => ['required', 'string', 'max:191'],
            'apellidos' => ['required', 'string', 'max:191'],
            'telefono' => ['required', 'string', 'min:6', 'max:191'],
            'direccion' => ['required', 'string', 'max:191'],
            'genero' => ['required', 'string', 'max:191'],
            'nacimiento' => ['required', 'date'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:191',
                Rule::unique(User::class)->ignore($this->user()->id),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'nombres' => 'nombres',
            'apellidos' => 'apellidos',
            'telefono' => 'teléfono',
            'direccion' => 'dirección',
            'genero' => 'género',
            'nacimiento' => 'fecha de nacimiento',
        ];
    }
}
