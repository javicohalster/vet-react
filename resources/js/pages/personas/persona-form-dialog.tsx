import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type PersonaFila } from '@/pages/personas/index';
import { type Opcion } from '@/types';
import { router } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const VACIO = {
    rut: '', username: '', nombres: '', apellidos: '', nacimiento: '', email: '', telefono: '', direccion: '', genero: '',
};

interface PersonaFormDialogProps {
    abierto: boolean;
    alCerrar: () => void;
    persona: PersonaFila | null;
    roles: Opcion[];
}

export function PersonaFormDialog({ abierto, alCerrar, persona, roles }: PersonaFormDialogProps) {
    const esEdicion = persona !== null;
    const [campos, setCampos] = useState(VACIO);
    const [rolesSeleccionados, setRolesSeleccionados] = useState<number[]>([]);
    const [enviando, setEnviando] = useState(false);
    const [errores, setErrores] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!abierto) return;

        setErrores({});
        setCampos(
            persona
                ? {
                      rut: persona.rut, username: persona.username ?? '', nombres: persona.nombres, apellidos: persona.apellidos,
                      nacimiento: persona.nacimiento, email: persona.email, telefono: persona.telefono, direccion: persona.direccion,
                      genero: persona.genero ?? '',
                  }
                : VACIO,
        );
        setRolesSeleccionados(persona ? persona.roles_ids : []);
    }, [abierto, persona]);

    const set = (clave: keyof typeof VACIO) => (valor: string) => setCampos((prev) => ({ ...prev, [clave]: valor }));

    const alternarRol = (id: number) => {
        setRolesSeleccionados((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
    };

    const guardar = () => {
        setEnviando(true);
        const opciones = {
            preserveScroll: true,
            onError: (err: Record<string, string>) => setErrores(err),
            onSuccess: () => alCerrar(),
            onFinish: () => setEnviando(false),
        };

        if (esEdicion && persona) {
            router.put(`/personas/${persona.id}`, campos, opciones);
        } else {
            router.post('/personas', { ...campos, roles: rolesSeleccionados }, opciones);
        }
    };

    return (
        <Dialog open={abierto} onOpenChange={(valor) => !valor && alCerrar()}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{esEdicion ? 'Editar persona' : 'Nueva persona'}</DialogTitle>
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

                    {!esEdicion && (
                        <div className="grid gap-1.5 sm:col-span-2">
                            <Label>Roles</Label>
                            <div className="flex flex-wrap gap-3">
                                {roles.map((rol) => (
                                    <label key={rol.id} className="flex items-center gap-1.5 text-sm">
                                        <Checkbox checked={rolesSeleccionados.includes(rol.id)} onCheckedChange={() => alternarRol(rol.id)} />
                                        {rol.nombre}
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={alCerrar}>Cancelar</Button>
                    <Button type="button" onClick={guardar} disabled={enviando}>
                        {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
                        {esEdicion ? 'Guardar cambios' : 'Registrar persona'}
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
