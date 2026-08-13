import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type PersonaFila } from '@/pages/personas/index';
import { type Opcion } from '@/types';
import { router } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface RolesPersonaDialogProps {
    persona: PersonaFila | null;
    todosLosRoles: Opcion[];
    onClose: () => void;
}

export function RolesPersonaDialog({ persona, todosLosRoles, onClose }: RolesPersonaDialogProps) {
    const [seleccionados, setSeleccionados] = useState<number[]>([]);
    const [enviando, setEnviando] = useState(false);

    useEffect(() => {
        if (persona) setSeleccionados(persona.roles_ids);
    }, [persona]);

    const alternar = (id: number) => {
        setSeleccionados((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
    };

    const guardar = () => {
        if (!persona) return;

        setEnviando(true);
        router.put(
            `/personas/${persona.id}/roles`,
            { roles: seleccionados },
            { preserveScroll: true, onSuccess: () => onClose(), onFinish: () => setEnviando(false) },
        );
    };

    return (
        <Dialog open={persona !== null} onOpenChange={(abierto) => !abierto && onClose()}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Roles {persona ? `de ${persona.nombres} ${persona.apellidos}` : ''}</DialogTitle>
                </DialogHeader>

                <div className="space-y-2">
                    {todosLosRoles.map((rol) => (
                        <label key={rol.id} className="flex items-center gap-2 text-sm">
                            <Checkbox checked={seleccionados.includes(rol.id)} onCheckedChange={() => alternar(rol.id)} />
                            {rol.nombre}
                        </label>
                    ))}
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
