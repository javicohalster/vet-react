{{-- Estilos compartidos por los documentos PDF. Se incrustan porque dompdf no
     resuelve hojas de estilo externas de forma fiable. --}}
<style>
    * { box-sizing: border-box; }
    body {
        font-family: DejaVu Sans, sans-serif;
        font-size: 10px;
        color: #1f2937;
        margin: 0;
    }
    header {
        border-bottom: 2px solid #0f766e;
        padding-bottom: 8px;
        margin-bottom: 14px;
    }
    header table.encabezado { width: 100%; border-collapse: collapse; }
    header table.encabezado td { padding: 0; vertical-align: middle; border: none; }
    header .logo { width: 60px; }
    header .logo img { width: 50px; height: auto; border-radius: 4px; }
    h1 {
        font-size: 15px;
        letter-spacing: 1px;
        margin: 0 0 4px;
        color: #0f766e;
        text-transform: uppercase;
    }
    .subtitulo { font-size: 9px; color: #6b7280; }
    table { width: 100%; border-collapse: collapse; }
    .datos td {
        padding: 4px 6px;
        border-bottom: 1px solid #e5e7eb;
        vertical-align: top;
    }
    .datos td.etiqueta {
        width: 32%;
        font-weight: bold;
        color: #374151;
        text-transform: uppercase;
        font-size: 9px;
    }
    .bloque {
        margin-bottom: 12px;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        padding: 8px 10px;
    }
    .bloque h2 {
        font-size: 10px;
        margin: 0 0 6px;
        text-transform: uppercase;
        color: #0f766e;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 3px;
    }
    .aviso {
        margin-top: 14px;
        font-size: 8px;
        color: #4b5563;
        text-align: justify;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        padding: 8px;
        background: #f9fafb;
    }
    .firma {
        margin-top: 40px;
        text-align: center;
        font-size: 9px;
        line-height: 1.5;
    }
    .firma .linea {
        border-top: 1px solid #374151;
        width: 220px;
        margin: 0 auto 4px;
    }
    footer {
        margin-top: 16px;
        border-top: 1px solid #e5e7eb;
        padding-top: 6px;
        font-size: 8px;
        color: #6b7280;
    }
    .pie-fecha { font-size: 8px; color: #6b7280; margin-top: 6px; }
</style>
