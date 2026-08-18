<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Expediente de {{ $paciente->nombres }} {{ $paciente->apellidos }}</title>
    @include('pdf._estilos')
</head>
<body>
    @php
        /**
         * Cada bloque replica las secciones del formulario de atención. Solo se
         * imprimen los campos con contenido, igual que en el sistema anterior.
         */
        $general = [
            'Anamnesis' => $consulta->sintomas,
            'Peso' => $consulta->peso,
            'Temperatura' => $consulta->temperatura,
            'Diagnóstico' => $consulta->diagnostico,
            'Pruebas realizadas' => $consulta->examenes,
            'Resultados' => $consulta->observaciones,
            'Tratamiento' => $consulta->trata,
            'Medicamentos' => $consulta->tratamiento,
            'Indicaciones' => $consulta->receta,
            'Fecha siguiente cita' => $consulta->fechasiguientecita,
        ];

        // Una consulta puede tener varias vacunas (lista nueva). Las consultas
        // de antes de esa función solo tienen el juego de campos sueltos.
        $vacunas = $consulta->vacunas->isNotEmpty()
            ? $consulta->vacunas->map(fn ($v) => [
                'fecha' => $v->fecha_vacuna?->format('d/m/Y'),
                'tipo' => $v->tipo_vacuna,
                'dias' => $v->dias_revacunar,
                'siguiente' => $v->fecha_siguiente_vacuna?->format('d/m/Y'),
            ])
            : collect(filled($consulta->tipovacuna) || filled($consulta->fechavacuna) ? [[
                'fecha' => $consulta->fechavacuna,
                'tipo' => $consulta->tipovacuna,
                'dias' => $consulta->diasrevacuna,
                'siguiente' => $consulta->fechavacunasiguiente,
            ]] : []);

        $desparasitacion = [
            'Fecha de desparasitación' => $consulta->fechadesparasitacion,
            'Peso (Kg.)' => $consulta->pesodesparasitacion,
            'Descripción' => $consulta->descripciondesparacitacion,
            'Posología' => $consulta->posologia,
            'Dosis' => $consulta->dosis,
            'Días a desparasitar' => $consulta->diasdesparacitar,
            'Fecha siguiente desparasitación' => $consulta->fechasigueintedesparasitacion,
        ];

        $cirugia = [
            'Fecha de cirugía' => $consulta->fechacirugia,
            'Peso' => $consulta->pesocirugia,
            'Procedimiento' => $consulta->procedimientocirugia,
            'Receta' => $consulta->recetacirugia,
        ];

        $hospitalizacion = [
            'Fecha de ingreso' => $consulta->fechahospitalizacion,
            'Motivo / diagnóstico de ingreso' => $consulta->diagnosticohospitalizar,
            'Peso' => $consulta->pesohospitalizar,
            'Temperatura' => $consulta->temperaturahospitalizar,
            'Frecuencia cardíaca' => $consulta->frecuenciacardiacahospitalizar,
            'Frecuencia respiratoria' => $consulta->frecuenciarespiratoriahospitalizar,
            'Mucosas' => $consulta->mucosashospitalizar,
            'Grado de hidratación' => $consulta->hidratacionhospitalizar,
            'Tratamiento' => $consulta->tratamientohotpitalizar,
            'Estado al alta' => $consulta->estadoaltahospitalizacion,
            'Fecha de alta' => $consulta->fechaaltahospitalizacion,
            'Indicaciones al alta' => $consulta->recetahospitalizar,
        ];

        $secciones = [
            'Consulta' => $general,
            'Desparasitación' => $desparasitacion,
            'Cirugía' => $cirugia,
            'Hospitalización' => $hospitalizacion,
        ];
    @endphp

    <header>
        <table class="encabezado">
            <tr>
                <td class="logo"><img src="{{ public_path('images/logo-icon.png') }}" alt="Logo"></td>
                <td>
                    <h1>Expediente clínico</h1>
                    <div class="subtitulo">
                        {{ $clinica?->nombre ?? config('app.name') }} &mdash;
                        consulta N.º {{ $consulta->id }} del {{ $consulta->fecha_inicio?->format('d/m/Y H:i') }}
                    </div>
                </td>
            </tr>
        </table>
    </header>

    <table class="datos" style="margin-bottom: 14px;">
        <tr><td class="etiqueta">Paciente</td><td>{{ $paciente->nombres }}</td></tr>
        <tr><td class="etiqueta">Propietario</td><td>{{ $paciente->apellidos }}</td></tr>
        <tr><td class="etiqueta">Identificación</td><td>{{ $paciente->rut }}</td></tr>
        <tr><td class="etiqueta">Especie / Raza</td><td>{{ $paciente->especie ?: '—' }} / {{ $paciente->raza ?: '—' }}</td></tr>
        <tr><td class="etiqueta">Edad</td><td>{{ $edad ?: '—' }}</td></tr>
        <tr><td class="etiqueta">Fecha de nacimiento</td><td>{{ $paciente->nacimiento?->format('d/m/Y') ?: '—' }}</td></tr>
        <tr><td class="etiqueta">Teléfono</td><td>{{ $paciente->telefono }}</td></tr>
        <tr><td class="etiqueta">Atendido por</td><td>{{ $consulta->doctor?->nombre_completo ?: '—' }}</td></tr>
        <tr><td class="etiqueta">Especialidad</td><td>{{ $consulta->especialidad?->nombre ?: '—' }}</td></tr>
    </table>

    @if ($vacunas->isNotEmpty())
        <div class="bloque">
            <h2>Vacunación</h2>
            <table class="datos">
                <tr>
                    <td class="etiqueta">Fecha</td>
                    <td class="etiqueta">Vacuna</td>
                    <td class="etiqueta">Días para revacunar</td>
                    <td class="etiqueta">Fecha siguiente</td>
                </tr>
                @foreach ($vacunas as $v)
                    <tr>
                        <td>{{ $v['fecha'] ?: '—' }}</td>
                        <td>{{ $v['tipo'] ?: '—' }}</td>
                        <td>{{ $v['dias'] ?: '—' }}</td>
                        <td>{{ $v['siguiente'] ?: '—' }}</td>
                    </tr>
                @endforeach
            </table>
        </div>
    @endif

    @foreach ($secciones as $titulo => $campos)
        @php $conDatos = array_filter($campos, fn ($valor) => filled($valor)); @endphp

        @if (! empty($conDatos))
            <div class="bloque">
                <h2>{{ $titulo }}</h2>
                <table class="datos">
                    @foreach ($conDatos as $etiqueta => $valor)
                        <tr>
                            <td class="etiqueta">{{ $etiqueta }}</td>
                            <td>{!! nl2br(e($valor)) !!}</td>
                        </tr>
                    @endforeach
                </table>
            </div>
        @endif
    @endforeach

    @if ($consulta->doctor)
        <div class="firma">
            <div class="linea"></div>
            {{ $consulta->doctor->nombre_completo }}<br>
            {{ $consulta->doctor->titulo ?: 'Médico Veterinario' }}
        </div>
    @endif

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
