import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import axios from '@/lib/http';
import { type DoctorFila } from '@/pages/doctores/index';
import { router } from '@inertiajs/react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface DiaAgenda {
    id: number;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    observacion: string | null;
}

export function DiasAgendaDialog({ doctor, onClose }: { doctor: DoctorFila | null; onClose: () => void }) {
    const [cargando, setCargando] = useState(false);
    const [dias, setDias] = useState<DiaAgenda[]>([]);
    const [fecha, setFecha] = useState('');
    const [horaInicio, setHoraInicio] = useState('09:00');
    const [horaFin, setHoraFin] = useState('17:00');
    const [observacion, setObservacion] = useState('');
    const [errores, setErrores] = useState<Record<string, string>>({});
    const [enviando, setEnviando] = useState(false);

    const cargar = () => {
        if (!doctor) return;
        setCargando(true);
        axios
            .get(`/doctores/${doctor.id}/dias`)
            .then((res) => setDias(res.data.dias))
            .finally(() => setCargando(false));
    };

    useEffect(() => {
        if (doctor) {
            cargar();
            setFecha('');
            setObservacion('');
            setErrores({});
        } else {
            setDias([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [doctor]);

    const agregar = () => {
        if (!doctor) return;

        setEnviando(true);
        router.post(
            `/doctores/${doctor.id}/dias`,
            { fecha, hora_inicio: horaInicio, hora_fin: horaFin, observacion },
            {
                preserveScroll: true,
                onError: (err) => setErrores(err),
                onSuccess: () => {
                    setFecha('');
                    setObservacion('');
                    setErrores({});
                    cargar();
                },
                onFinish: () => setEnviando(false),
            },
        );
    };

    const eliminar = (dia: DiaAgenda) => {
        router.delete(`/doctores/dias/${dia.id}`, { preserveScroll: true, onSuccess: () => cargar() });
    };

    return (
        <Dialog open={doctor !== null} onOpenChange={(abierto) => !abierto && onClose()}>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Días de agenda {doctor ? `— ${doctor.nombres} ${doctor.apellidos}` : ''}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3 rounded-lg border p-3">
                        <div className="grid gap-1.5">
                            <Label>Fecha</Label>
                            <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                            <InputError message={errores.fecha} />
                        </div>
                        <div className="grid gap-1.5">
                            <Label>Hora inicio</Label>
                            <Input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
                            <InputError message={errores.hora_inicio} />
                        </div>
                        <div className="grid gap-1.5">
                            <Label>Hora fin</Label>
                            <Input type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} />
                            <InputError message={errores.hora_fin} />
                        </div>
                        <div className="col-span-3 grid gap-1.5">
                            <Label>Observación (opcional)</Label>
                            <Input value={observacion} onChange={(e) => setObservacion(e.target.value)} />
                        </div>
                        <Button type="button" className="col-span-3" onClick={agregar} disabled={enviando || !fecha}>
                            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            Agregar día
                        </Button>
                    </div>

                    <div className="space-y-2">
                        {cargando ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : dias.length === 0 ? (
                            <p className="py-6 text-center text-sm text-muted-foreground">Sin días agendados.</p>
                        ) : (
                            dias.map((dia) => (
                                <div key={dia.id} className="flex items-center justify-between rounded-lg border p-2.5 text-sm">
                                    <div>
                                        <p className="font-medium">
                                            {dia.fecha} — {dia.hora_inicio} a {dia.hora_fin}
                                        </p>
                                        {dia.observacion && <p className="text-muted-foreground">{dia.observacion}</p>}
                                    </div>
                                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => eliminar(dia)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
