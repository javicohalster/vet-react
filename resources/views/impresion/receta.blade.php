<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Receta médica N.º {{ $consulta->id }}</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: 'Instrument Sans', system-ui, -apple-system, 'Segoe UI', sans-serif;
            color: #0f172a;
            background: #f1f5f9;
            margin: 0;
            padding: 32px 24px;
        }
        .hoja {
            max-width: 820px;
            margin: 0 auto;
            background: #fff;
            padding: 36px 44px;
            border-radius: 20px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 20px 45px -12px rgba(15, 23, 42, .12);
        }
        header {
            border-bottom: 2px solid #ccfbf1;
            padding-bottom: 16px;
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            gap: 14px;
        }
        header img.logo { width: 48px; height: 48px; border-radius: 12px; flex-shrink: 0; }
        h1 {
            margin: 0;
            font-size: 19px;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            color: #0f766e;
            font-weight: 700;
        }
        .clinica { font-size: 12px; color: #64748b; margin-top: 4px; }
        .cabecera { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
        .cabecera td { padding: 5px 0; vertical-align: top; }
        .cabecera .etiqueta { font-weight: 600; width: 130px; color: #334155; }
        .medicamentos { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 24px; font-size: 13px; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
        .medicamentos th {
            background: #0f766e;
            color: #fff;
            padding: 10px 14px;
            text-align: left;
            font-size: 11px;
            letter-spacing: .06em;
            text-transform: uppercase;
            font-weight: 600;
        }
        .medicamentos td {
            border-top: 1px solid #e2e8f0;
            padding: 14px;
            vertical-align: top;
            min-height: 120px;
        }
        .observaciones {
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 12px 16px;
            font-size: 13px;
            margin-bottom: 18px;
            background: #f8fafc;
        }
        .observaciones h2 {
            margin: 0 0 6px;
            font-size: 11px;
            letter-spacing: .05em;
            text-transform: uppercase;
            color: #0f766e;
            font-weight: 700;
        }
        .firma { margin-top: 44px; text-align: right; }
        .firma img { max-height: 80px; }
        .firma .linea {
            border-top: 1px solid #334155;
            width: 240px;
            margin-left: auto;
            padding-top: 6px;
            font-size: 12px;
            text-align: center;
            color: #334155;
        }
        footer {
            margin-top: 32px;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
            font-size: 11px;
            color: #64748b;
            text-align: center;
        }
        .acciones { max-width: 820px; margin: 0 auto 16px; text-align: right; }
        .boton {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #0d9488;
            color: #fff;
            border: 0;
            border-radius: 10px;
            padding: 10px 20px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            text-decoration: none;
            box-shadow: 0 1px 3px rgba(15, 23, 42, .15);
            transition: background-color .15s ease;
        }
        .boton:hover { background: #0f766e; }
        @media print {
            body { background: #fff; padding: 0; }
            .hoja { box-shadow: none; border: none; border-radius: 0; max-width: none; padding: 0; }
            .acciones { display: none; }
        }
    </style>
</head>
<body>
    <div class="acciones">
        <button type="button" class="boton" onclick="window.print()">Imprimir receta</button>
    </div>

    <div class="hoja">
        <header>
            <img class="logo" src="{{ asset('images/logo-icon.png') }}" alt="Logo">
            <div>
                <h1>Receta médica</h1>
                <div class="clinica">
                    {{ $clinica?->nombre ?? config('app.name') }}
                    @if ($clinica?->direccion) &mdash; {{ $clinica->direccion }} @endif
                    @if ($clinica?->telefono) &mdash; Telf. {{ $clinica->telefono }} @endif
                </div>
            </div>
        </header>

        <table class="cabecera">
            <tr>
                <td class="etiqueta">Receta N.º</td>
                <td>{{ $consulta->id }}</td>
                <td class="etiqueta">Fecha</td>
                <td>{{ $fecha }}</td>
            </tr>
            <tr>
                <td class="etiqueta">Propietario</td>
                <td>{{ $consulta->paciente?->apellidos }}</td>
                <td class="etiqueta">Paciente</td>
                <td>{{ $consulta->paciente?->nombres }}</td>
            </tr>
            <tr>
                <td class="etiqueta">Especie / Raza</td>
                <td>{{ $consulta->paciente?->especie ?: '—' }} / {{ $consulta->paciente?->raza ?: '—' }}</td>
                <td class="etiqueta">Especialidad</td>
                <td>{{ $consulta->especialidad?->nombre ?: '—' }}</td>
            </tr>
        </table>

        <table class="medicamentos">
            <thead>
                <tr>
                    <th style="width: 50%;">Medicamentos</th>
                    <th style="width: 50%;">Indicaciones</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>{!! nl2br(e($consulta->tratamiento ?: '')) !!}</td>
                    <td>{!! nl2br(e($consulta->receta ?: '')) !!}</td>
                </tr>
            </tbody>
        </table>

        @if ($consulta->diagnostico)
            <div class="observaciones">
                <h2>Observaciones / Diagnóstico</h2>
                {!! nl2br(e($consulta->diagnostico)) !!}
            </div>
        @endif

        @if ($consulta->fechasiguientecita)
            <div class="observaciones">
                <h2>Fecha de la siguiente cita</h2>
                {{ $consulta->fechasiguientecita }}
            </div>
        @endif

        <div class="firma">
            @if ($consulta->doctor?->firma)
                <img src="{{ asset('images/firmas/'.$consulta->doctor->firma) }}" alt="Firma del doctor">
            @endif
            <div class="linea">
                {{ $consulta->doctor?->nombre_completo }}<br>
                {{ $consulta->doctor?->titulo ?: 'Médico Veterinario' }}
            </div>
        </div>

        <footer>
            @if ($clinica?->email) {{ $clinica->email }} &mdash; @endif
            Documento generado por el sistema {{ config('app.name') }}. Todos los derechos reservados &copy; {{ date('Y') }}.
        </footer>
    </div>
</body>
</html>
