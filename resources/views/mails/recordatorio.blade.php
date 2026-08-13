<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Recordatorio</title>
    <style>
        body { margin: 0; padding: 0; background: #f1f5f9; font-family: Arial, Helvetica, sans-serif; color: #0f172a; }
        .contenedor { max-width: 520px; margin: 0 auto; padding: 32px 16px; }
        .tarjeta { background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
        .cabecera { background: #0f766e; padding: 22px 28px; }
        .cabecera h1 { margin: 0; color: #ffffff; font-size: 18px; letter-spacing: .03em; }
        .cuerpo { padding: 28px; font-size: 14px; line-height: 1.6; }
        .destacado { background: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 10px; padding: 14px 18px; margin: 18px 0; }
        .destacado p { margin: 4px 0; }
        .etiqueta { color: #0f766e; font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; }
        .pie { padding: 4px 28px 26px; font-size: 13px; color: #334155; }
        .footer-nota { text-align: center; font-size: 11px; color: #94a3b8; padding: 16px; }
    </style>
</head>
<body>
    <div class="contenedor">
        <div class="tarjeta">
            <div class="cabecera">
                <h1>{{ $clinica?->nombre ?? config('app.name') }}</h1>
            </div>
            <div class="cuerpo">
                <p>Estimado(a) <strong>{{ $propietario }}</strong>,</p>
                <p>Le recordamos que mañana su mascota tiene {{ $motivo }} programada:</p>

                <div class="destacado">
                    <p class="etiqueta">Paciente</p>
                    <p>{{ $paciente }}</p>
                    <p class="etiqueta">Fecha</p>
                    <p>{{ $fecha }}</p>
                </div>

                @if ($clinica?->direccion || $clinica?->telefono)
                    <p>
                        @if ($clinica?->direccion) {{ $clinica->direccion }} @endif
                        @if ($clinica?->telefono) &mdash; Telf. {{ $clinica->telefono }} @endif
                    </p>
                @endif

                <p>Nuestros horarios de atención son las 24 horas del día, los 7 días de la semana.</p>
                <p>¡Le esperamos!</p>
            </div>
            <div class="pie">
                Atentamente,<br>
                Equipo de {{ $clinica?->nombre ?? config('app.name') }}
            </div>
        </div>
        <div class="footer-nota">
            Este es un mensaje automático, por favor no responda a este correo.
        </div>
    </div>
</body>
</html>
