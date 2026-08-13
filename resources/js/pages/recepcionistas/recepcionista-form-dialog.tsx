import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type RecepcionistaFila } from '@/pages/recepcionistas/index';
import { router } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const VACIO = {
    rut: '', username: '', nombres: '', apellidos: '', nacimiento: '', email: '', telefono: '', direccion: '', genero: '',
};

interface RecepcionistaFormDialogProps {
    abierto: boolean;
    alCerrar: () => void;
    recepcionista: RecepcionistaFila | null;
}

export function RecepcionistaFormDialog({ abierto, alCerrar, recepcionista }: RecepcionistaFormDialogProps) {
    const esEdicion = recepcionista !== null;
    const [campos, setCampos] = useState(VACIO);
    const [enviando, setEnviando] = useState(false);
    const [errores, setErrores] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!abierto) return;

        setErrores({});
        setCampos(
            recepcionista
                ? {
                      rut: recepcionista.rut, username: recepcionista.username ?? '', nombres: recepcionista.nombres,
                      apellidos: recepcionista.apellidos, nacimiento: recepcionista.nacimiento, email: recepcionista.email,
                      telefono: recepcionista.telefono, direccion: recepcionista.direccion, genero: recepcionista.genero ?? '',
                  }
                : VACIO,
        );
    }, [abierto, recepcionista]);

    const set = (clave: keyof typeof VACIO) => (valor: string) => setCampos((prev) => ({ ...prev, [clave]: valor }));

    const guardar = () => {
        setEnviando(true);
        const opciones = {
            preserveScroll: true,
            onError: (err: Record<string, string>) => setErrores(err),
            onSuccess: () => alCerrar(),
            onFinish: () => setEnviando(false),
        };

        if (esEdicion && recepcionista) {
            router.put(`/recepcionistas/${recepcionista.id}`, campos, opciones);
        } else {
            router.post('/recepcionistas', campos, opciones);
        }
    };

    return (
        <Dialog open={abierto} onOpenChange={(valor) => !valor && alCerrar()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{esEdicion ? 'Editar recepcionista' : 'Nuevo recepcionista'}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 sm:grid-cols-2">
                    <Campo label="CI" value={campos.rut} onChange={set('rut')} error={errores.rut} />
                    <Campo label="Usuario" value={campos.username} onChange={set('username')} error={errores.username} />
                    <Campo label="Nombres" value={campos.nombres} onChange={set('nombres')} error={errores.nombres} />
                    <Campo label="Apellidos" value={campos.apellidos} onChange={set('apellidos')} error={errores.apellidos} />
                    <Campo label="Fecha de nacimiento" tipo="date" value={campos.nacimiento} onChange={set('nacimiento')} error={errores.nacimiento} />

                    <div className="grid gap-1.5">
                        <Label>Género</Label>
                        <Select value={campos.genero} onValueChange={set('genero')}>
                            <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Masculino">Masculino</SelectItem>
                                <SelectItem value="Femenino">Femenino</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errores.genero} />
                    </div>

                    <Campo label="Email" tipo="email" value={campos.email} onChange={set('email')} error={errores.email} />
                    <Campo label="Teléfono" value={campos.telefono} onChange={set('telefono')} error={errores.telefono} />
                    <Campo label="Dirección" value={campos.direccion} onChange={set('direccion')} error={errores.direccion} className="sm:col-span-2" />
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={alCerrar}>Cancelar</Button>
                    <Button type="button" onClick={guardar} disabled={enviando}>
                        {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
                        {esEdicion ? 'Guardar cambios' : 'Registrar recepcionista'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function Campo({
    label, value, onChange, error, tipo = 'text', className,
}: {
    label: string; value: string; onChange: (valor: string) => void; error?: string; tipo?: string; className?: string;
}) {
    return (
        <div className={`grid gap-1.5 ${className ?? ''}`}>
            <Label>{label}</Label>
            <Input type={tipo} value={value} onChange={(e) => onChange(e.target.value)} />
            <InputError message={error} />
        </div>
    );
}
