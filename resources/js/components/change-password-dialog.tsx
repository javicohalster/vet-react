import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { router } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ChangePasswordDialogProps {
    abierto: boolean;
    onClose: () => void;
    /** URL PUT que recibe { password, password_confirmation }. */
    url: string;
    nombre?: string;
}

/** Restablecer la contraseña de otro usuario (Doctores, Recepcionistas, Personas). */
export function ChangePasswordDialog({ abierto, onClose, url, nombre }: ChangePasswordDialogProps) {
    const [password, setPassword] = useState('');
    const [confirmacion, setConfirmacion] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [errores, setErrores] = useState<Record<string, string>>({});

    useEffect(() => {
        if (abierto) {
            setPassword('');
            setConfirmacion('');
            setErrores({});
        }
    }, [abierto]);

    const guardar = () => {
        setEnviando(true);
        router.put(
            url,
            { password, password_confirmation: confirmacion },
            {
                preserveScroll: true,
                onError: (err) => setErrores(err),
                onSuccess: () => onClose(),
                onFinish: () => setEnviando(false),
            },
        );
    };

    return (
        <Dialog open={abierto} onOpenChange={(valor) => !valor && onClose()}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Restablecer contraseña{nombre ? ` de ${nombre}` : ''}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4">
                    <div className="grid gap-1.5">
                        <Label>Nueva contraseña</Label>
                        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                        <InputError message={errores.password} />
                    </div>
                    <div className="grid gap-1.5">
                        <Label>Confirmar contraseña</Label>
                        <Input type="password" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} />
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="button" onClick={guardar} disabled={enviando || password.length < 6}>
                        {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
                        Guardar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
