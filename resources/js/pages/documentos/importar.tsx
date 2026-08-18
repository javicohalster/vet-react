import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PatientPicker, type PacienteOpcion } from '@/components/patient-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import axios from '@/lib/http';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Eye, Link2, Loader2, Wand2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Documentos', href: '/documentos-pacientes' },
    { title: 'Vincular archivos sueltos', href: '/documentos-importar' },
];

interface ArchivoSuelto {
    archivo: string;
    nombre_legible: string;
    paciente_sugerido: { id: number; etiqueta: string } | null;
}

interface ConsultaOpcion {
    id: number;
    fecha: string;
    estado: string;
    doctor: string | null;
}

export default function ImportarDocumentos({ archivos }: { archivos: ArchivoSuelto[] }) {
    const [vinculandoTodo, setVinculandoTodo] = useState(false);
    const sugeridos = archivos.filter((a) => a.paciente_sugerido).length;

    const vincularAutomaticamente = () => {
        setVinculandoTodo(true);
        router.post(
            '/documentos-importar/vincular-automaticos',
            {},
            {
                preserveScroll: true,
                onFinish: () => setVinculandoTodo(false),
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Vincular archivos sueltos" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Vincular archivos sueltos</h1>
                        <p className="text-sm text-muted-foreground">
                            Archivos que aparecieron en la carpeta de documentos pero que todavía no están vinculados a ninguna consulta
                            (por ejemplo, porque se copiaron directo por el administrador de archivos en vez de subirlos desde la app).
                            Revisa el PDF si el nombre no es suficiente para saber a quién pertenece.
                        </p>
                    </div>

                    {sugeridos > 0 && (
                        <Button type="button" onClick={vincularAutomaticamente} disabled={vinculandoTodo} className="shrink-0">
                            {vinculandoTodo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                            Vincular automáticamente ({sugeridos})
                        </Button>
                    )}
                </div>

                {archivos.length === 0 ? (
                    <p className="rounded-lg border py-10 text-center text-muted-foreground">
                        No hay archivos sueltos por vincular. Todo está en orden.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {archivos.map((a) => (
                            <FilaArchivo key={a.archivo} archivo={a} />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function FilaArchivo({ archivo }: { archivo: ArchivoSuelto }) {
    const [paciente, setPaciente] = useState<PacienteOpcion | null>(
        archivo.paciente_sugerido
            ? { id: archivo.paciente_sugerido.id, nombre: '', propietario: '', rut: '', etiqueta: archivo.paciente_sugerido.etiqueta }
            : null,
    );
    const [consultas, setConsultas] = useState<ConsultaOpcion[]>([]);
    const [consultaId, setConsultaId] = useState('');
    const [cargandoConsultas, setCargandoConsultas] = useState(false);
    const [vinculando, setVinculando] = useState(false);

    const alElegirPaciente = (p: PacienteOpcion | null) => {
        setPaciente(p);
        setConsultaId('');
        setConsultas([]);
        if (!p) return;

        setCargandoConsultas(true);
        axios
            .get(`/documentos/paciente/${p.id}`)
            .then((res) => setConsultas(res.data.consultas))
            .finally(() => setCargandoConsultas(false));
    };

    // Si ya viene un paciente sugerido, cargar sus consultas de una vez.
    useEffect(() => {
        if (!archivo.paciente_sugerido) return;

        setCargandoConsultas(true);
        axios
            .get(`/documentos/paciente/${archivo.paciente_sugerido.id}`)
            .then((res) => setConsultas(res.data.consultas))
            .finally(() => setCargandoConsultas(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const vincular = () => {
        if (!consultaId) return;
        setVinculando(true);
        router.post(
            '/documentos-importar/vincular',
            { archivo: archivo.archivo, query_id: consultaId },
            {
                preserveScroll: true,
                onFinish: () => setVinculando(false),
            },
        );
    };

    return (
        <div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
            <div className="grid gap-1.5">
                <p className="truncate text-sm font-medium" title={archivo.nombre_legible}>
                    {archivo.nombre_legible}
                </p>
                <a
                    href={`/documentos-importar/ver/${archivo.archivo}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-fit items-center gap-1 text-xs text-teal-700 hover:underline dark:text-teal-400"
                >
                    <Eye className="h-3.5 w-3.5" /> Ver archivo
                </a>
                {archivo.paciente_sugerido && !consultaId && <Badge variant="secondary" className="w-fit">Sugerido por el nombre</Badge>}
            </div>

            <div className="w-full sm:w-64">
                <PatientPicker value={paciente} onChange={alElegirPaciente} placeholder="Elegir paciente..." />
            </div>

            <div className="w-full sm:w-56">
                <Select value={consultaId} onValueChange={setConsultaId} disabled={!paciente || cargandoConsultas}>
                    <SelectTrigger>
                        <SelectValue placeholder={cargandoConsultas ? 'Cargando...' : 'Elegir consulta...'} />
                    </SelectTrigger>
                    <SelectContent>
                        {consultas.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                                {c.fecha} — {c.doctor ?? 'Sin doctor'} ({c.estado === 'atendido' ? 'Atendida' : 'Pendiente'})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Button type="button" onClick={vincular} disabled={!consultaId || vinculando}>
                {vinculando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                Vincular
            </Button>
        </div>
    );
}
