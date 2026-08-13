<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Ficha de {{ $paciente->nombres }} {{ $paciente->apellidos }}</title>
    @include('pdf._estilos')
</head>
<body>
    <header>
        <table class="encabezado">
            <tr>
                <td class="logo"><img src="{{ public_path('images/logo-icon.png') }}" alt="Logo"></td>
                <td>
                    <h1>Ficha personal del paciente</h1>
                    <div class="subtitulo">{{ $clinica?->nombre ?? config('app.name') }} &mdash; emitida el {{ $fecha }}</div>
                </td>
            </tr>
        </table>
    </header>

    <table class="datos">
        <tr><td class="etiqueta">Identificación (CI)</td><td>{{ $paciente->rut }}</td></tr>
        <tr><td class="etiqueta">Chip</td><td>{{ $paciente->chip ?: '—' }}</td></tr>
        <tr><td class="etiqueta">Paciente</td><td>{{ $paciente->nombres }}</td></tr>
        <tr><td class="etiqueta">Especie</td><td>{{ $paciente->especie ?: '—' }}</td></tr>
        <tr><td class="etiqueta">Raza</td><td>{{ $paciente->raza ?: '—' }}</td></tr>
        <tr><td class="etiqueta">Color</td><td>{{ $paciente->color ?: '—' }}</td></tr>
        <tr><td class="etiqueta">Sexo</td><td>{{ $paciente->genero ?: '—' }}</td></tr>
        <tr><td class="etiqueta">Esterilizado</td><td>{{ $paciente->esterilizado ?: '—' }}</td></tr>
        <tr><td class="etiqueta">Fecha de nacimiento</td><td>{{ $paciente->nacimiento?->format('d/m/Y') ?: '—' }}</td></tr>
        <tr><td class="etiqueta">Edad</td><td>{{ $edad ?: '—' }}</td></tr>
        <tr><td class="etiqueta">Peso</td><td>{{ $paciente->peso ? $paciente->peso.' Kg.' : '—' }}</td></tr>
        <tr><td class="etiqueta">Altura</td><td>{{ $paciente->altura ?: '—' }}</td></tr>
        <tr><td class="etiqueta">Propietario</td><td>{{ $paciente->apellidos }}</td></tr>
        <tr><td class="etiqueta">Teléfono</td><td>{{ $paciente->telefono }}</td></tr>
        <tr><td class="etiqueta">Email</td><td>{{ $paciente->email }}</td></tr>
        <tr><td class="etiqueta">Dirección</td><td>{{ $paciente->direccion }}</td></tr>
        <tr><td class="etiqueta">Última atención</td><td>{{ $paciente->fecha_ult_atencion?->format('d/m/Y') ?: '—' }}</td></tr>
        <tr><td class="etiqueta">Observaciones</td><td>{{ $paciente->observaciones ?: '—' }}</td></tr>
    </table>

    <div class="aviso">
        <strong>Advertencia:</strong> la información contenida en esta ficha clínica, así como los estudios y demás
        documentos donde se registren procedimientos y tratamientos aplicados al paciente
        <strong>{{ $paciente->nombres }} {{ $paciente->apellidos }}</strong>, es considerada
        <strong>información sensible</strong> y tiene carácter reservado. Quienes no estén relacionados directamente
        con la atención no tendrán acceso a ella, salvo las excepciones legales.
    </div>

    @if ($descargadoPor)
        <div class="pie-fecha">Documento descargado por: {{ $descargadoPor }} &mdash; {{ $fecha }}</div>
    @endif

    <footer>
        @if ($clinica)
            {{ $clinica->nombre }} &mdash; {{ $clinica->direccion }} &mdash; Telf. {{ $clinica->telefono }} &mdash; {{ $clinica->email }}
        @else
            Documento generado por el sistema {{ config('app.name') }}.
        @endif
    </footer>
</body>
</html>
