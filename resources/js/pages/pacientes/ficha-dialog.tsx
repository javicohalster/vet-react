import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import axios from '@/lib/http';
import { Download, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface FichaPaciente {
    id: number;
    avatar: string;
    rut: string;
    chip: string | null;
    nombres: string;
    apellidos: string;
    nacimiento: string;
    edad: string;
    genero: string | null;
    email: string;
    telefono: string;
    direccion: string;
    raza: string | null;
    color: string | null;
    peso: number | null;
    altura: string | null;
    esterilizado: string | null;
    especie: string | null;
    observaciones: string | null;
    ultima_atencion: string | null;
}

export function FichaDialog({ pacienteId, onClose }: { pacienteId: number | null; onClose: () => void }) {
    const [cargando, setCargando] = useState(false);
    const [paciente, setPaciente] = useState<FichaPaciente | null>(null);
    const [urlQr, setUrlQr] = useState('');
    const qrRef = useRef<HTMLButtonElement>(null);

    const descargarQr = () => {
        const svg = qrRef.current?.querySelector('svg');
        if (!svg || !paciente) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const svgUrl = URL.createObjectURL(new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' }));

        const img = new Image();
        img.onload = () => {
            const escala = 8;
            const canvas = document.createElement('canvas');
            canvas.width = img.width * escala;
            canvas.height = img.height * escala;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#fff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            }
            URL.revokeObjectURL(svgUrl);

            canvas.toBlob((blob) => {
                if (!blob) return;
                const enlace = document.createElement('a');
                enlace.href = URL.createObjectURL(blob);
                enlace.download = `qr-paciente-${paciente.id}.png`;
                enlace.click();
                URL.revokeObjectURL(enlace.href);
            });
        };
        img.src = svgUrl;
    };

    useEffect(() => {
        if (!pacienteId) {
            setPaciente(null);
            return;
        }

        setCargando(true);
        axios
            .get<{ paciente: FichaPaciente; urlQr: string }>(`/pacientes/${pacienteId}/ficha`)
            .then((res) => {
                setPaciente(res.data.paciente);
                setUrlQr(res.data.urlQr);
            })
            .finally(() => setCargando(false));
    }, [pacienteId]);

    return (
        <Dialog open={pacienteId !== null} onOpenChange={(abierto) => !abierto && onClose()}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Ficha del paciente</DialogTitle>
                </DialogHeader>

                {cargando || !paciente ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="flex flex-col items-center gap-3 sm:col-span-1">
                            <img
                                src={paciente.avatar && paciente.avatar !== 'default.jpg' ? `/assets/img/perfiles/${paciente.avatar}` : '/assets/img/default-avatar-paciente.svg'}
                                alt={paciente.nombres}
                                className="h-28 w-28 rounded-full border object-cover"
                            />
                            <button
                                ref={qrRef}
                                type="button"
                                onClick={descargarQr}
                                title="Clic para descargar el código QR"
                                className="rounded border bg-white p-2 transition-opacity hover:opacity-75"
                            >
                                <QRCodeSVG value={urlQr} size={110} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:col-span-2">
                            <Dato etiqueta="N° H. Clínica" valor={String(paciente.id)} />
                            <Dato etiqueta="CI propietario" valor={paciente.rut} />
                            <Dato etiqueta="Chip" valor={paciente.chip} />
                            <Dato etiqueta="Paciente" valor={paciente.nombres} />
                            <Dato etiqueta="Propietario" valor={paciente.apellidos} />
                            <Dato etiqueta="Especie" valor={paciente.especie} />
                            <Dato etiqueta="Raza" valor={paciente.raza} />
                            <Dato etiqueta="Color" valor={paciente.color} />
                            <Dato etiqueta="Sexo" valor={paciente.genero} />
                            <Dato etiqueta="Esterilizado" valor={paciente.esterilizado} />
                            <Dato etiqueta="Nacimiento" valor={paciente.nacimiento} />
                            <Dato etiqueta="Edad" valor={paciente.edad} />
                            <Dato etiqueta="Peso" valor={paciente.peso ? `${paciente.peso} Kg.` : null} />
                            <Dato etiqueta="Teléfono" valor={paciente.telefono} />
                            <Dato etiqueta="Email" valor={paciente.email} />
                            <Dato etiqueta="Dirección" valor={paciente.direccion} />
                            <Dato etiqueta="Última atención" valor={paciente.ultima_atencion} />
                            <div className="col-span-2">
                                <Dato etiqueta="Observaciones" valor={paciente.observaciones} />
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>Cerrar</Button>
                    {paciente && (
                        <Button type="button" asChild>
                            <a href={`/pacientes/${paciente.id}/ficha/pdf`} target="_blank" rel="noreferrer">
                                <Download className="h-4 w-4" /> Descargar PDF
                            </a>
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string | null }) {
    return (
        <div>
            <p className="text-xs tracking-wide text-muted-foreground uppercase">{etiqueta}</p>
            <p className="font-medium">{valor || '—'}</p>
        </div>
    );
}
