import { ArchivosAdjuntos } from '@/components/archivos-adjuntos';
import InputError from '@/components/input-error';
import { PatientPicker, type PacienteOpcion } from '@/components/patient-picker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import axios from '@/lib/http';
import { type Opcion } from '@/types';
import { router } from '@inertiajs/react';
import { FileDown, Loader2, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const TIPOS_EXAMEN = [
    'Hemograma completo',
    'Química sanguínea',
    'Uroanálisis',
    'Coproparasitológico',
    'Perfil tiroideo',
    'Citología',
    'Prueba rápida (ELISA)',
    'Otro',
];

/** Parámetros habituales por tipo de examen, para no partir de una tabla vacía. */
const PLANTILLAS_RESULTADOS: Record<string, string[]> = {
    'Hemograma completo': [
        'Eritrocitos', 'Hemoglobina', 'Hematocrito', 'VCM', 'HCM', 'CHCM', 'Plaquetas',
        'Leucocitos totales', 'Neutrófilos segmentados', 'Neutrófilos en banda', 'Linfocitos', 'Monocitos', 'Eosinófilos', 'Basófilos',
    ],
    'Química sanguínea': [
        'Glucosa', 'Urea (BUN)', 'Creatinina', 'ALT (TGP)', 'AST (TGO)', 'Fosfatasa alcalina',
        'Proteínas totales', 'Albúmina', 'Globulinas', 'Bilirrubina total',
    ],
    'Uroanálisis': ['Color', 'Aspecto', 'Densidad', 'pH', 'Proteínas', 'Glucosa', 'Cetonas', 'Sangre oculta', 'Bilirrubina', 'Sedimento'],
    'Coproparasitológico': ['Consistencia', 'Color', 'Moco', 'Sangre', 'Parásitos observados', 'Huevos / quistes'],
    'Perfil tiroideo': ['T4 total', 'TSH'],
    'Prueba rápida (ELISA)': ['Parvovirus canino', 'Moquillo canino', 'Ehrlichia canis', 'Anaplasma', 'Dirofilaria'],
};

const ESTADOS = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'en_proceso', label: 'En proceso' },
    { value: 'completado', label: 'Completado' },
];

interface ResultadoFila {
    [key: string]: string | boolean;
    parametro: string;
    resultado: string;
    unidad: string;
    valor_referencia: string;
    alterado: boolean;
}

const filaVacia = (): ResultadoFila => ({ parametro: '', resultado: '', unidad: '', valor_referencia: '', alterado: false });

interface ConsultaOpcion {
    id: number;
    fecha: string | null;
    estado: string;
    doctor: string | null;
}

interface LaboratorioDetalle {
    id: number;
    queryId: number;
    paciente: { nombres: string; apellidos: string; rut: string };
    doctorId: number | null;
    tipoExamen: string;
    fechaMuestra: string;
    fechaResultado: string | null;
    estado: string;
    observaciones: string | null;
    resultados: { parametro: string; resultado: string | null; unidad: string | null; valorReferencia: string | null; alterado: boolean }[];
}

interface LaboratorioFormDialogProps {
    abierto: boolean;
    laboratorioId: number | null;
    doctores: Opcion[];
    onClose: () => void;
}

export function LaboratorioFormDialog({ abierto, laboratorioId, doctores, onClose }: LaboratorioFormDialogProps) {
    const esEdicion = laboratorioId !== null;
    const [paso, setPaso] = useState<'paciente' | 'consulta' | 'formulario'>('paciente');
    const [cargando, setCargando] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [errores, setErrores] = useState<Record<string, string>>({});

    const [paciente, setPaciente] = useState<PacienteOpcion | null>(null);
    const [consultas, setConsultas] = useState<ConsultaOpcion[]>([]);
    const [pacienteResumen, setPacienteResumen] = useState<{ nombres: string; apellidos: string; rut: string } | null>(null);
    const [queryId, setQueryId] = useState<number | null>(null);

    const [doctorId, setDoctorId] = useState('');
    const [tipoExamen, setTipoExamen] = useState('');
    const [fechaMuestra, setFechaMuestra] = useState(() => new Date().toISOString().slice(0, 10));
    const [fechaResultado, setFechaResultado] = useState('');
    const [estado, setEstado] = useState('pendiente');
    const [observaciones, setObservaciones] = useState('');
    const [resultados, setResultados] = useState<ResultadoFila[]>([]);

    useEffect(() => {
        if (!abierto) return;

        setErrores({});

        if (laboratorioId) {
            setCargando(true);
            axios
                .get<LaboratorioDetalle>(`/laboratorio/${laboratorioId}`)
                .then((res) => {
                    const d = res.data;
                    setPacienteResumen(d.paciente);
                    setQueryId(d.queryId);
                    setDoctorId(d.doctorId ? String(d.doctorId) : '');
                    setTipoExamen(d.tipoExamen);
                    setFechaMuestra(d.fechaMuestra);
                    setFechaResultado(d.fechaResultado ?? '');
                    setEstado(d.estado);
                    setObservaciones(d.observaciones ?? '');
                    setResultados(
                        d.resultados.map((r) => ({
                            parametro: r.parametro,
                            resultado: r.resultado ?? '',
                            unidad: r.unidad ?? '',
                            valor_referencia: r.valorReferencia ?? '',
                            alterado: r.alterado,
                        })),
                    );
                    setPaso('formulario');
                })
                .finally(() => setCargando(false));
        } else {
            setPaso('paciente');
            setPaciente(null);
            setConsultas([]);
            setPacienteResumen(null);
            setQueryId(null);
            setDoctorId('');
            setTipoExamen('');
            setFechaMuestra(new Date().toISOString().slice(0, 10));
            setFechaResultado('');
            setEstado('pendiente');
            setObservaciones('');
            setResultados([]);
        }
    }, [abierto, laboratorioId]);

    const elegirPaciente = (opcion: PacienteOpcion | null) => {
        setPaciente(opcion);
        if (!opcion) return;

        setCargando(true);
        axios
            .get(`/laboratorio/paciente/${opcion.id}`)
            .then((res) => {
                setConsultas(res.data.consultas);
                setPaso('consulta');
            })
            .finally(() => setCargando(false));
    };

    const elegirConsulta = (consulta: ConsultaOpcion) => {
        setQueryId(consulta.id);
        setPacienteResumen(paciente ? { nombres: paciente.nombre, apellidos: paciente.propietario, rut: paciente.rut } : null);
        setPaso('formulario');
    };

    const cargarPlantilla = () => {
        const plantilla = PLANTILLAS_RESULTADOS[tipoExamen] ?? [];
        setResultados((prev) => {
            const existentes = new Set(prev.map((r) => r.parametro));
            const nuevas = plantilla.filter((p) => !existentes.has(p)).map((p) => ({ ...filaVacia(), parametro: p }));
            return [...prev, ...nuevas];
        });
    };

    const actualizarResultado = (indice: number, campo: keyof ResultadoFila, valor: string | boolean) => {
        setResultados((prev) => prev.map((r, i) => (i === indice ? { ...r, [campo]: valor } : r)));
    };

    const eliminarFila = (indice: number) => {
        setResultados((prev) => prev.filter((_, i) => i !== indice));
    };

    const guardar = () => {
        if (!queryId) return;

        setEnviando(true);
        const datos = {
            query_id: queryId,
            doctor_id: doctorId || null,
            tipo_examen: tipoExamen,
            fecha_muestra: fechaMuestra,
            fecha_resultado: fechaResultado || null,
            estado,
            observaciones,
            resultados: resultados.filter((r) => r.parametro.trim() !== ''),
        };

        const opciones = {
            preserveScroll: true,
            onError: (err: Record<string, string>) => setErrores(err),
            onSuccess: () => onClose(),
            onFinish: () => setEnviando(false),
        };

        if (esEdicion && laboratorioId) {
            router.put(`/laboratorio/${laboratorioId}`, datos, opciones);
        } else {
            router.post('/laboratorio', datos, opciones);
        }
    };

    const titulo = pacienteResumen
        ? `${esEdicion ? 'Examen' : 'Nuevo examen'} — ${pacienteResumen.nombres} / ${pacienteResumen.apellidos}`
        : 'Nuevo examen de laboratorio';

    return (
        <Dialog open={abierto} onOpenChange={(valor) => !valor && onClose()} modal={paso !== 'paciente'}>
            <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] min-w-0 overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{titulo}</DialogTitle>
                </DialogHeader>

                {cargando ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : paso === 'paciente' ? (
                    <div className="space-y-2 py-4">
                        <Label>Selecciona el paciente</Label>
                        <PatientPicker value={paciente} onChange={elegirPaciente} />
                    </div>
                ) : paso === 'consulta' ? (
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">¿A cuál consulta de {paciente?.nombre} se asocia este examen?</p>
                        {consultas.length === 0 ? (
                            <p className="py-10 text-center text-muted-foreground">
                                Este paciente no tiene consultas registradas. Primero crea una cita / atención para poder adjuntar el examen.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {consultas.map((c) => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => elegirConsulta(c)}
                                        className="flex w-full items-center justify-between rounded-lg border p-3 text-left text-sm hover:bg-accent"
                                    >
                                        <div>
                                            <p className="font-medium">Consulta #{c.id} — {c.fecha}</p>
                                            <p className="text-muted-foreground">{c.doctor ?? 'Sin doctor'}</p>
                                        </div>
                                        <Badge variant={c.estado === 'atendido' ? 'default' : 'outline'}>
                                            {c.estado === 'atendido' ? 'Atendida' : 'Pendiente'}
                                        </Badge>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-1.5">
                                <Label>Tipo de examen</Label>
                                <div className="flex gap-2">
                                    <Select value={tipoExamen} onValueChange={setTipoExamen}>
                                        <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                                        <SelectContent>
                                            {TIPOS_EXAMEN.map((t) => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {PLANTILLAS_RESULTADOS[tipoExamen] && (
                                        <Button type="button" variant="outline" size="icon" title="Cargar parámetros habituales" onClick={cargarPlantilla}>
                                            <Sparkles className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                                <InputError message={errores.tipo_examen} />
                            </div>

                            <div className="grid gap-1.5">
                                <Label>Doctor responsable</Label>
                                <Select value={doctorId} onValueChange={setDoctorId}>
                                    <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                                    <SelectContent>
                                        {doctores.map((d) => (
                                            <SelectItem key={d.id} value={String(d.id)}>{d.nombre}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errores.doctor_id} />
                            </div>

                            <div className="grid gap-1.5">
                                <Label>Fecha de la muestra</Label>
                                <Input type="date" value={fechaMuestra} onChange={(e) => setFechaMuestra(e.target.value)} />
                                <InputError message={errores.fecha_muestra} />
                            </div>

                            <div className="grid gap-1.5">
                                <Label>Fecha del resultado</Label>
                                <Input type="date" value={fechaResultado} onChange={(e) => setFechaResultado(e.target.value)} />
                                <InputError message={errores.fecha_resultado} />
                            </div>

                            <div className="grid gap-1.5">
                                <Label>Estado</Label>
                                <Select value={estado} onValueChange={setEstado}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {ESTADOS.map((e) => (
                                            <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errores.estado} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Resultados</Label>
                                <Button type="button" variant="outline" size="sm" onClick={() => setResultados((prev) => [...prev, filaVacia()])}>
                                    <Plus className="h-4 w-4" /> Agregar fila
                                </Button>
                            </div>

                            {resultados.length > 0 && (
                                <div className="rounded-lg border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Parámetro</TableHead>
                                                <TableHead>Resultado</TableHead>
                                                <TableHead>Unidad</TableHead>
                                                <TableHead>Valor de referencia</TableHead>
                                                <TableHead className="text-center">Alterado</TableHead>
                                                <TableHead />
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {resultados.map((r, indice) => (
                                                <TableRow key={indice}>
                                                    <TableCell>
                                                        <Input value={r.parametro} onChange={(e) => actualizarResultado(indice, 'parametro', e.target.value)} className="h-8" />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input value={r.resultado} onChange={(e) => actualizarResultado(indice, 'resultado', e.target.value)} className="h-8" />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input value={r.unidad} onChange={(e) => actualizarResultado(indice, 'unidad', e.target.value)} className="h-8 w-20" />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input value={r.valor_referencia} onChange={(e) => actualizarResultado(indice, 'valor_referencia', e.target.value)} className="h-8" />
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Checkbox checked={r.alterado} onCheckedChange={(v) => actualizarResultado(indice, 'alterado', v === true)} />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => eliminarFila(indice)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </div>

                        <div className="grid gap-1.5">
                            <Label>Observaciones / interpretación</Label>
                            <Textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={3} />
                            <InputError message={errores.observaciones} />
                        </div>

                        {queryId && (
                            <div className="space-y-2">
                                <Label>Imágenes e informes adjuntos</Label>
                                <ArchivosAdjuntos
                                    queryId={queryId}
                                    ayuda="Fotos de microscopía, radiografías, informes escaneados, etc. Tamaño máximo 50 MB."
                                    accept=".jpg,.jpeg,.png,.gif,.webp,.bmp,.pdf"
                                />
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>Cerrar</Button>
                    {esEdicion && laboratorioId && (
                        <Button type="button" variant="outline" asChild>
                            <a href={`/laboratorio/${laboratorioId}/informe`} target="_blank" rel="noreferrer">
                                <FileDown className="h-4 w-4" /> Generar informe PDF
                            </a>
                        </Button>
                    )}
                    {paso === 'formulario' && (
                        <Button type="button" onClick={guardar} disabled={enviando || !tipoExamen || !fechaMuestra}>
                            {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
                            {esEdicion ? 'Guardar cambios' : 'Registrar examen'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
