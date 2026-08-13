import { PatientPicker, type PacienteOpcion } from '@/components/patient-picker';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { usePermissions } from '@/hooks/use-permissions';
import { router } from '@inertiajs/react';
import { Loader2, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface CitaSeleccionada {
    id: number;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    pacienteId: number;
    pacienteEtiqueta: string;
    doctorId: number;
    especialidadId: number;
    descripcion: string;
    estado: string;
}

interface DoctorOpcion {
    id: number;
    nombre: string;
    especialidades: number[];
}

interface EspecialidadOpcion {
    id: number;
    nombre: string;
}

interface CitaFormDialogProps {
    abierto: boolean;
    alCerrar: () => void;
    cita: CitaSeleccionada | null;
    fechaPreseleccionada: { fecha: string; horaInicio: string } | null;
    doctores: DoctorOpcion[];
    especialidades: EspecialidadOpcion[];
    alGuardar: () => void;
}

/** Alta/edición de una cita, reutilizado desde el calendario de Inicio. */
export function CitaFormDialog({ abierto, alCerrar, cita, fechaPreseleccionada, doctores, especialidades, alGuardar }: CitaFormDialogProps) {
    const { can } = usePermissions();
    const esEdicion = cita !== null;

    const [paciente, setPaciente] = useState<PacienteOpcion | null>(null);
    const [doctorId, setDoctorId] = useState('');
    const [especialidadId, setEspecialidadId] = useState('');
    const [fecha, setFecha] = useState('');
    const [horaInicio, setHoraInicio] = useState('');
    const [horaFin, setHoraFin] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [errores, setErrores] = useState<Record<string, string>>({});
    const [confirmarEliminar, setConfirmarEliminar] = useState(false);

    useEffect(() => {
        if (!abierto) return;

        setErrores({});

        if (cita) {
            setPaciente({ id: cita.pacienteId, nombre: cita.pacienteEtiqueta, propietario: '', rut: '', etiqueta: cita.pacienteEtiqueta });
            setDoctorId(String(cita.doctorId));
            setEspecialidadId(String(cita.especialidadId));
            setFecha(cita.fecha);
            setHoraInicio(cita.horaInicio);
            setHoraFin(cita.horaFin);
            setDescripcion(cita.descripcion);
        } else {
            setPaciente(null);
            setDoctorId('');
            setEspecialidadId('');
            setFecha(fechaPreseleccionada?.fecha ?? '');
            setHoraInicio(fechaPreseleccionada?.horaInicio ?? '');
            setHoraFin('');
            setDescripcion('');
        }
    }, [abierto, cita, fechaPreseleccionada]);

    const especialidadesDelDoctor = doctorId
        ? especialidades.filter((e) => doctores.find((d) => String(d.id) === doctorId)?.especialidades.includes(e.id))
        : especialidades;

    const guardar = () => {
        setEnviando(true);
        setErrores({});

        const datos = {
            paciente_id: paciente?.id,
            doctor_id: doctorId ? Number(doctorId) : undefined,
            speciality_id: especialidadId ? Number(especialidadId) : undefined,
            fecha,
            hora_inicio: horaInicio,
            hora_fin: horaFin,
            descripcion,
        };

        const opciones = {
            preserveScroll: true,
            onSuccess: () => {
                alGuardar();
                alCerrar();
            },
            onError: (err: Record<string, string>) => setErrores(err),
            onFinish: () => setEnviando(false),
        };

        if (esEdicion && cita) {
            router.put(`/citas/${cita.id}`, datos, opciones);
        } else {
            router.post('/citas', datos, opciones);
        }
    };

    const eliminar = () => {
        if (!cita) return;

        router.delete(`/citas/${cita.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                alGuardar();
                setConfirmarEliminar(false);
                alCerrar();
            },
        });
    };

    return (
        <>
            <Dialog open={abierto} onOpenChange={(valor) => !valor && alCerrar()}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{esEdicion ? 'Editar cita' : 'Nueva cita'}</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label>Paciente</Label>
                            <PatientPicker value={paciente} onChange={setPaciente} disabled={esEdicion} />
                            <InputError message={errores.paciente_id} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Doctor</Label>
                                <Select value={doctorId} onValueChange={setDoctorId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona un doctor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {doctores.map((d) => (
                                            <SelectItem key={d.id} value={String(d.id)}>
                                                {d.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errores.doctor_id} />
                            </div>

                            <div className="grid gap-2">
                                <Label>Especialidad</Label>
                                <Select value={especialidadId} onValueChange={setEspecialidadId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {especialidadesDelDoctor.map((e) => (
                                            <SelectItem key={e.id} value={String(e.id)}>
                                                {e.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errores.speciality_id} />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <Label>Fecha</Label>
                                <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                                <InputError message={errores.fecha} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Hora inicio</Label>
                                <Input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
                                <InputError message={errores.hora_inicio} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Hora fin</Label>
                                <Input type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} />
                                <InputError message={errores.hora_fin} />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label>Motivo de la consulta (opcional)</Label>
                            <Textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} />
                        </div>
                    </div>

                    <DialogFooter className="items-center justify-between sm:justify-between">
                        {esEdicion && can('eliminar-citas') ? (
                            <Button type="button" variant="ghost" className="text-destructive" onClick={() => setConfirmarEliminar(true)}>
                                <Trash2 className="h-4 w-4" /> Eliminar
                            </Button>
                        ) : (
                            <span />
                        )}

                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={alCerrar}>
                                Cancelar
                            </Button>
                            <Button type="button" onClick={guardar} disabled={enviando || !paciente || !doctorId || !especialidadId}>
                                {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
                                {esEdicion ? 'Guardar cambios' : 'Reservar cita'}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={confirmarEliminar} onOpenChange={setConfirmarEliminar}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar esta cita?</AlertDialogTitle>
                        <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={eliminar} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
