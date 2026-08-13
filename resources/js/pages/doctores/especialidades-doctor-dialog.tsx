import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { type DoctorFila } from '@/pages/doctores/index';
import { type Opcion } from '@/types';
import { router } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface EspecialidadesDoctorDialogProps {
    doctor: DoctorFila | null;
    todasLasEspecialidades: Opcion[];
    onClose: () => void;
}

export function EspecialidadesDoctorDialog({ doctor, todasLasEspecialidades, onClose }: EspecialidadesDoctorDialogProps) {
    const [seleccionadas, setSeleccionadas] = useState<number[]>([]);
    const [estudios, setEstudios] = useState('');
    const [enviando, setEnviando] = useState(false);

    useEffect(() => {
        if (doctor) {
            setSeleccionadas(doctor.especialidades.map((e) => e.id));
            setEstudios(doctor.estudios_complementarios ?? '');
        }
    }, [doctor]);

    const alternar = (id: number) => {
        setSeleccionadas((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
    };

    const guardar = () => {
        if (!doctor) return;

        setEnviando(true);
        router.put(
            `/doctores/${doctor.id}/especialidades`,
            { especialidades: seleccionadas, estudios_complementarios: estudios },
            { preserveScroll: true, onSuccess: () => onClose(), onFinish: () => setEnviando(false) },
        );
    };

    return (
        <Dialog open={doctor !== null} onOpenChange={(abierto) => !abierto && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Especialidades {doctor ? `de ${doctor.nombres} ${doctor.apellidos}` : ''}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        {todasLasEspecialidades.map((especialidad) => (
                            <label key={especialidad.id} className="flex items-center gap-2 text-sm">
                                <Checkbox
                                    checked={seleccionadas.includes(especialidad.id)}
                                    onCheckedChange={() => alternar(especialidad.id)}
                                />
                                {especialidad.nombre}
                            </label>
                        ))}
                    </div>

                    <div className="grid gap-1.5">
                        <Label>Estudios complementarios</Label>
                        <Textarea value={estudios} onChange={(e) => setEstudios(e.target.value)} rows={3} />
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="button" onClick={guardar} disabled={enviando}>
                        {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
                        Guardar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
