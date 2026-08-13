import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import axios from '@/lib/http';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ConsultaOpcion {
    id: number;
    fecha: string;
    estado: string;
    doctor: string | null;
    archivos: number;
}

interface ConsultasPickerDialogProps {
    pacienteId: number | null;
    onClose: () => void;
    onSeleccionar: (consultaId: number) => void;
}

/** Elige a cuál de las consultas de un paciente se le adjuntan documentos. */
export function ConsultasPickerDialog({ pacienteId, onClose, onSeleccionar }: ConsultasPickerDialogProps) {
    const [cargando, setCargando] = useState(false);
    const [paciente, setPaciente] = useState<{ nombres: string; apellidos: string } | null>(null);
    const [consultas, setConsultas] = useState<ConsultaOpcion[]>([]);

    useEffect(() => {
        if (!pacienteId) {
            setConsultas([]);
            return;
        }

        setCargando(true);
        axios
            .get(`/documentos/paciente/${pacienteId}`)
            .then((res) => {
                setPaciente(res.data.paciente);
                setConsultas(res.data.consultas);
            })
            .finally(() => setCargando(false));
    }, [pacienteId]);

    return (
        <Dialog open={pacienteId !== null} onOpenChange={(abierto) => !abierto && onClose()}>
            <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Consultas {paciente ? `de ${paciente.nombres} / ${paciente.apellidos}` : ''}</DialogTitle>
                </DialogHeader>

                {cargando ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : consultas.length === 0 ? (
                    <p className="py-10 text-center text-muted-foreground">Este paciente no tiene consultas registradas.</p>
                ) : (
                    <div className="space-y-2">
                        {consultas.map((c) => (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => onSeleccionar(c.id)}
                                className="flex w-full items-center justify-between rounded-lg border p-3 text-left text-sm hover:bg-accent"
                            >
                                <div>
                                    <p className="font-medium">Consulta #{c.id} — {c.fecha}</p>
                                    <p className="text-muted-foreground">{c.doctor ?? 'Sin doctor'} · {c.estado === 'atendido' ? 'Atendida' : 'Pendiente'}</p>
                                </div>
                                <Badge variant={c.archivos > 0 ? 'default' : 'outline'}>{c.archivos} archivo(s)</Badge>
                            </button>
                        ))}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
