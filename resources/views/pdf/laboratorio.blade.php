<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Informe de laboratorio {{ $laboratorio->id }}</title>
    @include('pdf._estilos')
    <style>
        table.resultados { width: 100%; border-collapse: collapse; margin-top: 4px; }
        table.resultados th {
            background: #0f766e;
            color: #fff;
            font-size: 8px;
            text-transform: uppercase;
            letter-spacing: .04em;
            padding: 5px 6px;
            text-align: left;
        }
        table.resultados td {
            padding: 5px 6px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 9px;
        }
        table.resultados tr.alterado td { color: #b91c1c; font-weight: bold; }
        .estado-chip {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 8px;
            font-size: 8px;
            text-transform: uppercase;
            background: #f0fdfa;
            color: #0f766e;
            border: 1px solid #ccfbf1;
        }
    </style>
</head>
<body>
    <header>
        <table class="encabezado">
            <tr>
                <td class="logo"><img src="{{ public_path('images/logo-icon.png') }}" alt="Logo"></td>
                <td>
                    <h1>Informe de laboratorio</h1>
                    <div class="subtitulo">
                        {{ $clinica?->nombre ?? config('app.name') }} &mdash;
                        examen N.º {{ $laboratorio->id }} del {{ $laboratorio->fecha_muestra?->format('d/m/Y') }}
                    </div>
                </td>
            </tr>
        </table>
    </header>

    <table class="datos" style="margin-bottom: 14px;">
        <tr><td class="etiqueta">Paciente</td><td>{{ $paciente?->nombres }}</td></tr>
        <tr><td class="etiqueta">Propietario</td><td>{{ $paciente?->apellidos }}</td></tr>
        <tr><td class="etiqueta">Especie / Raza</td><td>{{ $paciente?->especie ?: '—' }} / {{ $paciente?->raza ?: '—' }}</td></tr>
        <tr><td class="etiqueta">Edad</td><td>{{ $edad ?: '—' }}</td></tr>
        <tr><td class="etiqueta">Tipo de examen</td><td>{{ $laboratorio->tipo_examen }}</td></tr>
        <tr><td class="etiqueta">Fecha de la muestra</td><td>{{ $laboratorio->fecha_muestra?->format('d/m/Y') }}</td></tr>
        <tr><td class="etiqueta">Fecha del resultado</td><td>{{ $laboratorio->fecha_resultado?->format('d/m/Y') ?: '—' }}</td></tr>
        <tr><td class="etiqueta">Estado</td><td><span class="estado-chip">{{ str($laboratorio->estado)->replace('_', ' ') }}</span></td></tr>
        <tr><td class="etiqueta">Doctor responsable</td><td>{{ $laboratorio->doctor?->nombre_completo ?: '—' }}</td></tr>
    </table>

    @if ($laboratorio->resultados->isNotEmpty())
        <div class="bloque">
            <h2>Resultados</h2>
            <table class="resultados">
                <thead>
                    <tr>
                        <th style="width: 34%;">Parámetro</th>
                        <th style="width: 22%;">Resultado</th>
                        <th style="width: 14%;">Unidad</th>
                        <th style="width: 30%;">Valor de referencia</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($laboratorio->resultados as $resultado)
                        <tr class="{{ $resultado->alterado ? 'alterado' : '' }}">
                            <td>{{ $resultado->parametro }}</td>
                            <td>{{ $resultado->resultado ?: '—' }}</td>
                            <td>{{ $resultado->unidad ?: '—' }}</td>
                            <td>{{ $resultado->valor_referencia ?: '—' }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    @endif

    @if ($laboratorio->observaciones)
        <div class="bloque">
            <h2>Observaciones / interpretación</h2>
            {!! nl2br(e($laboratorio->observaciones)) !!}
        </div>
    @endif

    @if ($laboratorio->doctor)
        <div class="firma">
            <div class="linea"></div>
            {{ $laboratorio->doctor->nombre_completo }}<br>
            {{ $laboratorio->doctor->titulo ?: 'Médico Veterinario' }}
        </div>
    @endif

    <div class="pie-fecha">Informe generado el {{ $fecha }}</div>

    <footer>
        @if ($clinica)
            {{ $clinica->nombre }} &mdash; {{ $clinica->direccion }} &mdash; Telf. {{ $clinica->telefono }} &mdash; {{ $clinica->email }}
        @else
            Documento generado por el sistema {{ config('app.name') }}.
        @endif
    </footer>
</body>
</html>
