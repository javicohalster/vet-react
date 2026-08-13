import { ArchivosAdjuntos } from '@/components/archivos-adjuntos';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import axios from '@/lib/http';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ConsultaResumen {
    id: number;
    fecha: string;
    paciente: string;
    propietario: string;
}

export function DocumentosDialog({ consultaId, onClose }: { consultaId: number | null; onClose: () => void }) {
    const [cargando, setCargando] = useState(false);
    const [consulta, setConsulta] = useState<ConsultaResumen | null>(null);

    useEffect(() => {
        if (!consultaId) {
            setConsulta(null);
            return;
        }

        setCargando(true);
        axios
            .get(`/documentos/${consultaId}`)
            .then((res) => setConsulta(res.data.consulta))
            .finally(() => setCargando(false));
    }, [consultaId]);

    return (
        <Dialog open={consultaId !== null} onOpenChange={(abierto) => !abierto && onClose()}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Documentos {consulta ? `— consulta #${consulta.id} (${consulta.fecha})` : ''}</DialogTitle>
                </DialogHeader>

                {cargando || !consultaId ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <ArchivosAdjuntos queryId={consultaId} />
                )}
            </DialogContent>
        </Dialog>
    );
}
