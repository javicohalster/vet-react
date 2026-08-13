<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $paciente->nombres }} {{ $paciente->apellidos }}</title>
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
            max-width: 640px;
            margin: 0 auto;
            background: #fff;
            padding: 32px 36px;
            border-radius: 20px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 20px 45px -12px rgba(15, 23, 42, .12);
        }
        header {
            text-align: center;
            border-bottom: 2px solid #ccfbf1;
            padding-bottom: 16px;
            margin-bottom: 20px;
        }
        header img.avatar {
            width: 96px;
            height: 96px;
            border-radius: 50%;
            object-fit: cover;
            border: 3px solid #0d9488;
            margin-bottom: 10px;
        }
        h1 {
            margin: 0;
            font-size: 17px;
            letter-spacing: 1px;
            text-transform: uppercase;
            color: #0f766e;
            font-weight: 700;
        }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        table td {
            padding: 8px 6px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: top;
        }
        td.etiqueta {
            width: 40%;
            font-weight: 600;
            color: #334155;
            text-transform: uppercase;
            font-size: 11px;
        }
        .qr { text-align: center; margin-top: 22px; }
        .qr img { width: 130px; height: 130px; }
        .qr-link {
            margin: 8px auto 0;
            max-width: 260px;
            font-size: 11px;
            color: #0f766e;
            word-break: break-all;
        }
        .aviso {
            margin-top: 20px;
            font-size: 11px;
            color: #475569;
            text-align: justify;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 12px 14px;
            background: #f8fafc;
        }
        footer {
            margin-top: 22px;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
            font-size: 11px;
            color: #64748b;
            text-align: center;
        }
        @media print {
            body { background: #fff; padding: 0; }
            .hoja { box-shadow: none; border: none; border-radius: 0; max-width: none; }
        }
    </style>
</head>
<body>
    <div class="hoja">
        <header>
            <img src="{{ asset('images/logo-icon.png') }}" alt="Logo" style="width:36px;height:36px;border-radius:6px;margin-bottom:8px;">
            <img
                class="avatar"
                src="{{ $paciente->avatar && $paciente->avatar !== 'default.jpg' ? asset('assets/img/perfiles/'.$paciente->avatar) : asset('assets/img/default-avatar-paciente.svg') }}"
                alt="Foto del paciente"
            >
            <h1>Ficha del paciente</h1>
        </header>

        <table>
            <tr><td class="etiqueta">CI propietario</td><td>{{ $paciente->rut }}</td></tr>
            <tr><td class="etiqueta">Chip</td><td>{{ $paciente->chip ?: '—' }}</td></tr>
            <tr><td class="etiqueta">Paciente</td><td>{{ $paciente->nombres }}</td></tr>
            <tr><td class="etiqueta">Especie</td><td>{{ $paciente->especie ?: '—' }}</td></tr>
            <tr><td class="etiqueta">Raza</td><td>{{ $paciente->raza ?: '—' }}</td></tr>
            <tr><td class="etiqueta">Color</td><td>{{ $paciente->color ?: '—' }}</td></tr>
            <tr><td class="etiqueta">Sexo</td><td>{{ $paciente->genero ?: '—' }}</td></tr>
            <tr><td class="etiqueta">Esterilizado</td><td>{{ $paciente->esterilizado ?: '—' }}</td></tr>
            <tr><td class="etiqueta">Propietario</td><td>{{ $paciente->apellidos }}</td></tr>
            <tr><td class="etiqueta">Email</td><td><a href="mailto:{{ $paciente->email }}">{{ $paciente->email }}</a></td></tr>
            <tr><td class="etiqueta">Dirección</td><td>{{ $paciente->direccion }}</td></tr>
            <tr><td class="etiqueta">Teléfono</td><td>{{ $paciente->telefono }}</td></tr>
            <tr><td class="etiqueta">Fecha de nacimiento</td><td>{{ $paciente->nacimiento?->format('d/m/Y') ?: '—' }}</td></tr>
            <tr><td class="etiqueta">Edad</td><td>{{ $edad ?: '—' }}</td></tr>
            <tr><td class="etiqueta">Observaciones</td><td>{{ $paciente->observaciones ?: '—' }}</td></tr>
        </table>

        <div class="qr">
            {!! QrCode::size(160)->generate(url('fichaqr/'.$paciente->id)) !!}
            <p class="qr-link">{{ url('fichaqr/'.$paciente->id) }}</p>
        </div>

        <div class="aviso">
            <strong>Advertencia:</strong> la información que se muestra en esta ficha clínica es considerada
            <strong>información sensible</strong> y tiene carácter reservado. Quienes no estén relacionados
            directamente con la atención no tendrán acceso a ella, salvo las excepciones legales.
        </div>

        <footer>
            Ficha generada el {{ $fecha }} &mdash; Documento generado por el sistema {{ config('app.name') }}.
            Todos los derechos reservados &copy; {{ date('Y') }}.
        </footer>
    </div>
</body>
</html>
