import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type RolFila } from '@/pages/roles/index';
import { router } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PermisosRolDialogProps {
    rol: RolFila | null;
    todosLosPermisos: { id: number; name: string }[];
    onClose: () => void;
}

export function PermisosRolDialog({ rol, todosLosPermisos, onClose }: PermisosRolDialogProps) {
    const [seleccionados, setSeleccionados] = useState<number[]>([]);
    const [enviando, setEnviando] = useState(false);

    useEffect(() => {
        if (rol) setSeleccionados(rol.permisos_ids);
    }, [rol]);

    const alternar = (id: number) => {
        setSeleccionados((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
    };

    const guardar = () => {
        if (!rol) return;

        setEnviando(true);
        router.put(
            `/roles/${rol.id}/permisos`,
            { permisos: seleccionados },
            { preserveScroll: true, onSuccess: () => onClose(), onFinish: () => setEnviando(false) },
        );
    };

    return (
        <Dialog open={rol !== null} onOpenChange={(abierto) => !abierto && onClose()}>
            <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Permisos del rol {rol?.display_name || rol?.name}</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-2">
                    {todosLosPermisos.map((permiso) => (
                        <label key={permiso.id} className="flex items-center gap-2 text-sm">
                            <Checkbox checked={seleccionados.includes(permiso.id)} onCheckedChange={() => alternar(permiso.id)} />
                            {permiso.name}
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
