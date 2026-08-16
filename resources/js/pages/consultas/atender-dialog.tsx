import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import axios from '@/lib/http';
import { usePermissions } from '@/hooks/use-permissions';
import { router } from '@inertiajs/react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface DetalleConsulta {
    id: number;
    estado: string;
    fecha: string;
    paciente: {
        id: number;
        nombre: string;
        propietario: string;
        edad: string;
        raza: string | null;
        especie: string | null;
        chip: string | null;
        rut: string | null;
    };
    doctor: string | null;
    especialidad: string | null;
    especialidad_id: number | null;
    visitas: number;
    atencion: Record<string, string | number | null>;
    vacunas: Array<{
        id: number | null;
        fecha_vacuna: string | null;
        tipo_vacuna: string | null;
        dias_revacunar: number | null;
        fecha_siguiente_vacuna: string | null;
    }>;
}

interface DoctorOpcion {
    id: number;
    nombre: string;
}

interface VacunaFila {
    id: number | null;
    fecha_vacuna: string;
    tipo_vacuna: string;
    dias_revacunar: string;
    fecha_siguiente_vacuna: string;
}

const VACUNA_VACIA: VacunaFila = { id: null, fecha_vacuna: '', tipo_vacuna: '', dias_revacunar: '', fecha_siguiente_vacuna: '' };

/** Suma días a una fecha sin pasar por conversiones de zona horaria. */
function calcularFechaSiguiente(fecha: string, dias: string): string {
    if (!fecha || !dias) return '';

    const [anio, mes, dia] = fecha.split('-').map(Number);
    const base = new Date(anio, mes - 1, dia);
    base.setDate(base.getDate() + Number(dias));

    const dos = (n: number) => String(n).padStart(2, '0');
    return `${base.getFullYear()}-${dos(base.getMonth() + 1)}-${dos(base.getDate())}`;
}

/** Listas fijas heredadas del formulario original (nunca vinieron de una tabla). */
// Los tipos de vacuna ya no son una lista fija: se administran en
// Mantenimiento > Vacunas y llegan como prop (tiposVacuna).

const DIAS_REVACUNAR = ['15', '18', '21', '30', '120', '365'];

const PRODUCTOS_DESPARASITANTE = [
    'ALCOBEST 25%', 'ALBEX TABLETAS', 'IVERMECTINA 1%', 'ALBENDAZOL POTENCIADO',
    'PIRANTEL + PRAZIQUANTEL', 'CESTODAN', 'CANICUR', 'FEBENDAZOL',
];

const POSOLOGIAS = ['ORAL', 'INTRAMUSCULAR', 'SUBCUTANEA'];

const MUCOSAS = ['Rosadas (normales)', 'Pálidas', 'Cianóticas', 'Ictéricas', 'Congestivas'];

const HIDRATACION = ['Normal', 'Leve (~5%)', 'Moderada (~7-9%)', 'Severa (≥10%)'];

const ESTADOS_ALTA = ['En tratamiento', 'Recuperado - alta médica', 'Remitido a especialista', 'Alta voluntaria', 'Fallecido'];

/** "tipo" nunca se muestra en el formulario: el sistema original lo fijaba en "REC" (registro). */
const CAMPOS_INICIALES: Record<string, string> = {
    sintomas: '', examenes: '', tratamiento: '', trata: '', observaciones: '', temperatura: '', peso: '',
    receta: '', diagnostico: '', tipo: 'REC', doctorConsulta: '', fecharegistra: '', fechasiguientecita: '',
    fechavacuna: '', tipovacuna: '', diasrevacuna: '', fechavacunasiguiente: '',
    fechadesparasitacion: '', pesodesparasitacion: '', descripciondesparacitacion: '', posologia: '', dosis: '',
    diasdesparacitar: '', fechasigueintedesparasitacion: '',
    fechacirugia: '', pesocirugia: '', procedimientocirugia: '', recetacirugia: '',
    fechahospitalizacion: '', pesohospitalizar: '', temperaturahospitalizar: '',
    frecuenciacardiacahospitalizar: '', frecuenciarespiratoriahospitalizar: '', mucosashospitalizar: '', hidratacionhospitalizar: '',
    diagnosticohospitalizar: '', tratamientohotpitalizar: '',
    estadoaltahospitalizacion: '', fechaaltahospitalizacion: '', recetahospitalizar: '',
};

export function AtenderDialog({
    consultaId,
    onClose,
    tiposVacuna,
}: {
    consultaId: number | null;
    onClose: () => void;
    tiposVacuna: string[];
}) {
    const { can } = usePermissions();
    const [detalle, setDetalle] = useState<DetalleConsulta | null>(null);
    const [cargando, setCargando] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [errores, setErrores] = useState<Record<string, string>>({});
    const [campos, setCampos] = useState<Record<string, string>>(CAMPOS_INICIALES);
    const [vacunas, setVacunas] = useState<VacunaFila[]>([]);
    const [doctoresEspecialidad, setDoctoresEspecialidad] = useState<DoctorOpcion[]>([]);

    const soloLectura = !can('editar-atender');

    useEffect(() => {
        if (!consultaId) {
            setDetalle(null);
            setDoctoresEspecialidad([]);
            return;
        }

        setCargando(true);
        axios
            .get<DetalleConsulta>(`/consultas/${consultaId}`)
            .then((res) => {
                setDetalle(res.data);
                if (res.data.especialidad_id) {
                    axios
                        .get<DoctorOpcion[]>(`/buscar/doctores-especialidad/${res.data.especialidad_id}`)
                        .then((r) => setDoctoresEspecialidad(r.data))
                        .catch(() => setDoctoresEspecialidad([]));
                } else {
                    setDoctoresEspecialidad([]);
                }
                const valores = { ...CAMPOS_INICIALES };
                Object.entries(res.data.atencion).forEach(([clave, valor]) => {
                    if (clave === 'tipo' && (valor === null || valor === undefined)) return;
                    valores[clave] = valor === null || valor === undefined ? '' : String(valor);
                });
                setCampos(valores);
                setVacunas(
                    res.data.vacunas.map((v) => ({
                        id: v.id,
                        fecha_vacuna: v.fecha_vacuna ?? '',
                        tipo_vacuna: v.tipo_vacuna ?? '',
                        dias_revacunar: v.dias_revacunar ? String(v.dias_revacunar) : '',
                        fecha_siguiente_vacuna: v.fecha_siguiente_vacuna ?? '',
                    })),
                );
                setErrores({});
            })
            .finally(() => setCargando(false));
    }, [consultaId]);

    const set = (clave: string) => (valor: string) => setCampos((prev) => ({ ...prev, [clave]: valor }));

    /** Igual que `set`, pero además recalcula la fecha siguiente de desparasitación. */
    const setDesparasitacion = (clave: 'fechadesparasitacion' | 'diasdesparacitar') => (valor: string) =>
        setCampos((prev) => {
            const actualizado = { ...prev, [clave]: valor };
            actualizado.fechasigueintedesparasitacion = calcularFechaSiguiente(actualizado.fechadesparasitacion, actualizado.diasdesparacitar);
            return actualizado;
        });

    const agregarVacuna = () => setVacunas((prev) => [...prev, { ...VACUNA_VACIA }]);

    const quitarVacuna = (indice: number) => setVacunas((prev) => prev.filter((_, i) => i !== indice));

    const actualizarVacuna = (indice: number, campo: keyof VacunaFila, valor: string) => {
        setVacunas((prev) =>
            prev.map((v, i) => {
                if (i !== indice) return v;
                const actualizada = { ...v, [campo]: valor };
                if (campo === 'fecha_vacuna' || campo === 'dias_revacunar') {
                    actualizada.fecha_siguiente_vacuna = calcularFechaSiguiente(actualizada.fecha_vacuna, actualizada.dias_revacunar);
                }
                return actualizada;
            }),
        );
    };

    const guardar = () => {
        if (!consultaId) return;

        setEnviando(true);
        router.put(`/consultas/${consultaId}/atender`, { ...campos, vacunas }, {
            preserveScroll: true,
            onError: (err) => setErrores(err),
            onSuccess: () => onClose(),
            onFinish: () => setEnviando(false),
        });
    };

    return (
        <Dialog open={consultaId !== null} onOpenChange={(abierto) => !abierto && onClose()}>
            <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] min-w-0 overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Atención médica</DialogTitle>
                </DialogHeader>

                {cargando || !detalle ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="min-w-0 space-y-5">
                        <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3 text-sm sm:grid-cols-4">
                            <Info etiqueta="Paciente" valor={detalle.paciente.nombre} />
                            <Info etiqueta="Propietario" valor={detalle.paciente.propietario} />
                            <Info etiqueta="Edad" valor={detalle.paciente.edad} />
                            <Info etiqueta="Visitas atendidas" valor={String(detalle.visitas)} />
                            <Info etiqueta="Especie / Raza" valor={`${detalle.paciente.especie ?? '—'} / ${detalle.paciente.raza ?? '—'}`} />
                            <Info etiqueta="Doctor" valor={detalle.doctor ?? '—'} />
                            <Info etiqueta="Especialidad" valor={detalle.especialidad ?? '—'} />
                            <Info etiqueta="Fecha" valor={detalle.fecha} />
                        </div>

                        <Tabs defaultValue="consulta">
                            <TabsList className="flex-nowrap overflow-x-auto justify-start w-full">
                                <TabsTrigger value="consulta" className="shrink-0">Consulta</TabsTrigger>
                                <TabsTrigger value="vacunacion" className="shrink-0">Vacunación</TabsTrigger>
                                <TabsTrigger value="desparasitacion" className="shrink-0">Desparasitación</TabsTrigger>
                                <TabsTrigger value="cirugia" className="shrink-0">Cirugía</TabsTrigger>
                                <TabsTrigger value="hospitalizacion" className="shrink-0">Hospitalización</TabsTrigger>
                            </TabsList>

                            <TabsContent value="consulta" className="grid gap-4 sm:grid-cols-2">
                                <Campo label="Síntomas / Anamnesis" area value={campos.sintomas} onChange={set('sintomas')} error={errores.sintomas} disabled={soloLectura} className="sm:col-span-2" />
                                <Campo label="Exámenes / pruebas realizadas" area value={campos.examenes} onChange={set('examenes')} error={errores.examenes} disabled={soloLectura} className="sm:col-span-2" />
                                <Campo label="Diagnóstico" area value={campos.diagnostico} onChange={set('diagnostico')} error={errores.diagnostico} disabled={soloLectura} className="sm:col-span-2" />
                                <Campo label="Tratamiento" value={campos.trata} onChange={set('trata')} error={errores.trata} disabled={soloLectura} />
                                <Campo label="Medicamentos" area value={campos.tratamiento} onChange={set('tratamiento')} error={errores.tratamiento} disabled={soloLectura} />
                                <Campo label="Indicaciones" area value={campos.receta} onChange={set('receta')} error={errores.receta} disabled={soloLectura} className="sm:col-span-2" />
                                <Campo label="Observaciones" area value={campos.observaciones} onChange={set('observaciones')} error={errores.observaciones} disabled={soloLectura} className="sm:col-span-2" />
                                <Campo label="Temperatura" value={campos.temperatura} onChange={set('temperatura')} error={errores.temperatura} disabled={soloLectura} />
                                <Campo label="Peso" value={campos.peso} onChange={set('peso')} error={errores.peso} disabled={soloLectura} />
                                <div className="grid gap-1.5">
                                    <Label>Doctor que atendió</Label>
                                    <Select value={campos.doctorConsulta} onValueChange={set('doctorConsulta')} disabled={soloLectura}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={doctoresEspecialidad.length ? 'Selecciona' : 'Sin doctores en esta especialidad'} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {doctoresEspecialidad.map((d) => (
                                                <SelectItem key={d.id} value={String(d.id)}>{d.nombre}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errores.doctorConsulta} />
                                </div>
                                <Campo label="Fecha que registra" tipo="date" value={campos.fecharegistra} onChange={set('fecharegistra')} error={errores.fecharegistra} disabled={soloLectura} />
                                <Campo label="Fecha siguiente cita" tipo="date" value={campos.fechasiguientecita} onChange={set('fechasiguientecita')} error={errores.fechasiguientecita} disabled={soloLectura} />
                            </TabsContent>

                            <TabsContent value="vacunacion" className="space-y-4">
                                {vacunas.length === 0 && (
                                    <p className="text-sm text-muted-foreground">Este paciente no tiene vacunas registradas en esta consulta.</p>
                                )}

                                {vacunas.map((vacuna, indice) => (
                                    <div key={indice} className="grid gap-4 rounded-lg border p-3 sm:grid-cols-2">
                                        <div className="flex items-center justify-between sm:col-span-2">
                                            <p className="text-sm font-medium text-muted-foreground">Vacuna {indice + 1}</p>
                                            {!soloLectura && (
                                                <Button type="button" size="icon" variant="ghost" className="text-destructive" onClick={() => quitarVacuna(indice)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>

                                        <Campo
                                            label="Fecha de vacuna"
                                            tipo="date"
                                            value={vacuna.fecha_vacuna}
                                            onChange={(v) => actualizarVacuna(indice, 'fecha_vacuna', v)}
                                            error={errores[`vacunas.${indice}.fecha_vacuna`]}
                                            disabled={soloLectura}
                                        />
                                        <CampoSelect
                                            label="Tipo de vacuna"
                                            value={vacuna.tipo_vacuna}
                                            onChange={(v) => actualizarVacuna(indice, 'tipo_vacuna', v)}
                                            error={errores[`vacunas.${indice}.tipo_vacuna`]}
                                            disabled={soloLectura}
                                            opciones={tiposVacuna}
                                        />
                                        <CampoSelect
                                            label="Días para revacunar"
                                            value={vacuna.dias_revacunar}
                                            onChange={(v) => actualizarVacuna(indice, 'dias_revacunar', v)}
                                            error={errores[`vacunas.${indice}.dias_revacunar`]}
                                            disabled={soloLectura}
                                            opciones={DIAS_REVACUNAR}
                                        />
                                        <div className="grid gap-1.5">
                                            <Label>Fecha siguiente vacuna</Label>
                                            <Input type="date" value={vacuna.fecha_siguiente_vacuna} disabled className="bg-muted/40" />
                                            <p className="text-xs text-muted-foreground">Se calcula sola a partir de la fecha y los días para revacunar.</p>
                                        </div>
                                    </div>
                                ))}

                                {!soloLectura && (
                                    <Button type="button" variant="outline" onClick={agregarVacuna}>
                                        <Plus className="h-4 w-4" /> Agregar vacuna
                                    </Button>
                                )}
                            </TabsContent>

                            <TabsContent value="desparasitacion" className="grid gap-4 sm:grid-cols-2">
                                <Campo label="Fecha de desparasitación" tipo="date" value={campos.fechadesparasitacion} onChange={setDesparasitacion('fechadesparasitacion')} error={errores.fechadesparasitacion} disabled={soloLectura} />
                                <Campo label="Peso (Kg.)" value={campos.pesodesparasitacion} onChange={set('pesodesparasitacion')} error={errores.pesodesparasitacion} disabled={soloLectura} />
                                <CampoSelect label="Descripción" value={campos.descripciondesparacitacion} onChange={set('descripciondesparacitacion')} error={errores.descripciondesparacitacion} disabled={soloLectura} opciones={PRODUCTOS_DESPARASITANTE} />
                                <CampoSelect label="Posología" value={campos.posologia} onChange={set('posologia')} error={errores.posologia} disabled={soloLectura} opciones={POSOLOGIAS} />
                                <Campo label="Dosis" value={campos.dosis} onChange={set('dosis')} error={errores.dosis} disabled={soloLectura} />
                                <CampoSelect label="Días a desparasitar" value={campos.diasdesparacitar} onChange={setDesparasitacion('diasdesparacitar')} error={errores.diasdesparacitar} disabled={soloLectura} opciones={DIAS_REVACUNAR} />
                                <div className="grid gap-1.5">
                                    <Label>Fecha siguiente desparasitación</Label>
                                    <Input type="date" value={campos.fechasigueintedesparasitacion} disabled className="bg-muted/40" />
                                    <p className="text-xs text-muted-foreground">Se calcula sola a partir de la fecha y los días a desparasitar.</p>
                                </div>
                            </TabsContent>

                            <TabsContent value="cirugia" className="grid gap-4 sm:grid-cols-2">
                                <Campo label="Fecha de cirugía" tipo="date" value={campos.fechacirugia} onChange={set('fechacirugia')} error={errores.fechacirugia} disabled={soloLectura} />
                                <Campo label="Peso" value={campos.pesocirugia} onChange={set('pesocirugia')} error={errores.pesocirugia} disabled={soloLectura} />
                                <Campo label="Procedimiento" area value={campos.procedimientocirugia} onChange={set('procedimientocirugia')} error={errores.procedimientocirugia} disabled={soloLectura} className="sm:col-span-2" />
                                <Campo label="Receta" area value={campos.recetacirugia} onChange={set('recetacirugia')} error={errores.recetacirugia} disabled={soloLectura} className="sm:col-span-2" />
                            </TabsContent>

                            <TabsContent value="hospitalizacion" className="grid gap-4 sm:grid-cols-2">
                                <Campo label="Fecha de ingreso" tipo="date" value={campos.fechahospitalizacion} onChange={set('fechahospitalizacion')} error={errores.fechahospitalizacion} disabled={soloLectura} />
                                <Campo label="Motivo / diagnóstico de ingreso" area value={campos.diagnosticohospitalizar} onChange={set('diagnosticohospitalizar')} error={errores.diagnosticohospitalizar} disabled={soloLectura} />

                                <Campo label="Peso" value={campos.pesohospitalizar} onChange={set('pesohospitalizar')} error={errores.pesohospitalizar} disabled={soloLectura} />
                                <Campo label="Temperatura" value={campos.temperaturahospitalizar} onChange={set('temperaturahospitalizar')} error={errores.temperaturahospitalizar} disabled={soloLectura} />
                                <Campo label="Frecuencia cardíaca" value={campos.frecuenciacardiacahospitalizar} onChange={set('frecuenciacardiacahospitalizar')} error={errores.frecuenciacardiacahospitalizar} disabled={soloLectura} />
                                <Campo label="Frecuencia respiratoria" value={campos.frecuenciarespiratoriahospitalizar} onChange={set('frecuenciarespiratoriahospitalizar')} error={errores.frecuenciarespiratoriahospitalizar} disabled={soloLectura} />
                                <CampoSelect label="Mucosas" value={campos.mucosashospitalizar} onChange={set('mucosashospitalizar')} error={errores.mucosashospitalizar} disabled={soloLectura} opciones={MUCOSAS} />
                                <CampoSelect label="Grado de hidratación" value={campos.hidratacionhospitalizar} onChange={set('hidratacionhospitalizar')} error={errores.hidratacionhospitalizar} disabled={soloLectura} opciones={HIDRATACION} />

                                <Campo label="Tratamiento" area value={campos.tratamientohotpitalizar} onChange={set('tratamientohotpitalizar')} error={errores.tratamientohotpitalizar} disabled={soloLectura} className="sm:col-span-2" />

                                <CampoSelect label="Estado al alta" value={campos.estadoaltahospitalizacion} onChange={set('estadoaltahospitalizacion')} error={errores.estadoaltahospitalizacion} disabled={soloLectura} opciones={ESTADOS_ALTA} />
                                <Campo label="Fecha de alta" tipo="date" value={campos.fechaaltahospitalizacion} onChange={set('fechaaltahospitalizacion')} error={errores.fechaaltahospitalizacion} disabled={soloLectura} />
                                <Campo label="Indicaciones al alta" area value={campos.recetahospitalizar} onChange={set('recetahospitalizar')} error={errores.recetahospitalizar} disabled={soloLectura} className="sm:col-span-2" />
                            </TabsContent>
                        </Tabs>
                    </div>
                )}

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cerrar
                    </Button>
                    {!soloLectura && (
                        <Button type="button" onClick={guardar} disabled={enviando || cargando}>
                            {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
                            Guardar atención
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function Info({ etiqueta, valor }: { etiqueta: string; valor: string }) {
    return (
        <div>
            <p className="text-xs tracking-wide text-muted-foreground uppercase">{etiqueta}</p>
            <p className="font-medium">{valor || '—'}</p>
        </div>
    );
}

function CampoSelect({
    label,
    value,
    onChange,
    error,
    disabled,
    opciones,
    className,
}: {
    label: string;
    value: string;
    onChange: (valor: string) => void;
    error?: string;
    disabled?: boolean;
    opciones: string[];
    className?: string;
}) {
    return (
        <div className={`grid gap-1.5 ${className ?? ''}`}>
            <Label>{label}</Label>
            <Select value={value} onValueChange={onChange} disabled={disabled}>
                <SelectTrigger>
                    <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                    {opciones.map((opcion) => (
                        <SelectItem key={opcion} value={opcion}>
                            {opcion}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <InputError message={error} />
        </div>
    );
}

function Campo({
    label,
    value,
    onChange,
    error,
    area,
    tipo = 'text',
    disabled,
    className,
}: {
    label: string;
    value: string;
    onChange: (valor: string) => void;
    error?: string;
    area?: boolean;
    tipo?: string;
    disabled?: boolean;
    className?: string;
}) {
    return (
        <div className={`grid gap-1.5 ${className ?? ''}`}>
            <Label>{label}</Label>
            {area ? (
                <Textarea value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} rows={3} />
            ) : (
                <Input type={tipo} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
            )}
            <InputError message={error} />
        </div>
    );
}
