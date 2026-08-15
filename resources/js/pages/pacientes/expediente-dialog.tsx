import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import axios from '@/lib/http';
import { Download, FileText, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ConsultaExpediente {
    id: number;
    fecha: string;
    hora: string;
    doctor: string | null;
    especialidad: string | null;
    sintomas: string | null;
    examenes: string | null;
    diagnostico: string | null;
    tratamiento: string | null;
    trata: string | null;
    receta: string | null;
    observaciones: string | null;
    temperatura: string | null;
    peso: string | null;
    tipovacuna: string | null;
    fechavacuna: string | null;
    fechasiguientecita: string | null;
    procedimientocirugia: string | null;
    diagnosticohospitalizar: string | null;
    archivos: number;
}

export function EspedienteDialog({ pacienteId, onClose }: { pacienteId: number | null; onClose: () => void }) {
    const [cargando, setCargando] = useState(false);
    const [paciente, setPaciente] = useState<{ id: number; nombres: string; apellidos: string } | null>(null);
    const [consultas, setConsultas] = useState<ConsultaExpediente[]>([]);

    useEffect(() => {
        if (!pacienteId) {
            setConsultas([]);
            setPaciente(null);
            return;
        }

        setCargando(true);
        axios
            .get(`/pacientes/${pacienteId}/expediente`)
            .then((res) => {
                setPaciente(res.data.paciente);
                setConsultas(res.data.consultas);
            })
            .finally(() => setCargando(false));
    }, [pacienteId]);

    return (
        <Dialog open={pacienteId !== null} onOpenChange={(abierto) => !abierto && onClose()}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        Expediente clínico {paciente ? `— N° ${paciente.id} · ${paciente.nombres} / ${paciente.apellidos}` : ''}
                    </DialogTitle>
                </DialogHeader>

                {cargando ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : consultas.length === 0 ? (
                    <p className="py-10 text-center text-muted-foreground">Este paciente no tiene consultas atendidas.</p>
                ) : (
                    <div className="space-y-3">
                        {consultas.map((c) => (
                            <div key={c.id} className="rounded-lg border p-4">
                                <div className="mb-2 flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">
                                            {c.fecha} {c.hora} — {c.doctor ?? 'Sin doctor'}
                                        </p>
                                        <p className="text-sm text-muted-foreground">{c.especialidad ?? '—'}</p>
                                    </div>
                                    <Button size="sm" variant="outline" asChild>
                                        <a href={`/pacientes/${pacienteId}/expediente/${c.id}/pdf`} target="_blank" rel="noreferrer">
                                            <Download className="h-4 w-4" /> PDF
                                        </a>
                                    </Button>
                                </div>

                                <dl className="grid grid-cols-1 gap-1.5 text-sm sm:grid-cols-2">
                                    <Campo etiqueta="Síntomas" valor={c.sintomas} />
                                    <Campo etiqueta="Diagnóstico" valor={c.diagnostico} />
                                    <Campo etiqueta="Exámenes" valor={c.examenes} />
                                    <Campo etiqueta="Tratamiento" valor={c.trata} />
                                    <Campo etiqueta="Medicamentos" valor={c.tratamiento} />
                                    <Campo etiqueta="Indicaciones" valor={c.receta} />
                                    <Campo etiqueta="Observaciones" valor={c.observaciones} />
                                    <Campo etiqueta="Peso / Temperatura" valor={[c.peso, c.temperatura].filter(Boolean).join(' / ') || null} />
                                    <Campo etiqueta="Vacuna" valor={c.tipovacuna ? `${c.tipovacuna} (${c.fechavacuna ?? '—'})` : null} />
                                    <Campo etiqueta="Cirugía" valor={c.procedimientocirugia} />
                                    <Campo etiqueta="Hospitalización" valor={c.diagnosticohospitalizar} />
                                    <Campo etiqueta="Próxima cita" valor={c.fechasiguientecita} />
                                </dl>

                                {c.archivos > 0 && (
                                    <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                                        <FileText className="h-3.5 w-3.5" /> {c.archivos} documento(s) adjunto(s)
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

function Campo({ etiqueta, valor }: { etiqueta: string; valor: string | null }) {
    if (!valor) return null;

    return (
        <div>
            <dt className="text-xs tracking-wide text-muted-foreground uppercase">{etiqueta}</dt>
            <dd>{valor}</dd>
        </div>
    );
}
