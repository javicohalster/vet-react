import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import axios from '@/lib/http';
import { type PacienteFila } from '@/pages/pacientes/index';
import { type Opcion } from '@/types';
import { router } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface PacienteDetalle {
    id: number;
    avatar: string | null;
    rut: string;
    chip: string | null;
    nombres: string;
    apellidos: string;
    nacimiento: string;
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
}

const VACIO = {
    rut: '', chip: '', nombres: '', apellidos: '', nacimiento: '', email: '', telefono: '', direccion: '',
    genero: '', raza: '', color: '', peso: '', altura: '', esterilizado: '', especie: '', observaciones: '',
};

interface PacienteFormDialogProps {
    abierto: boolean;
    alCerrar: () => void;
    paciente: PacienteFila | null;
    razas: Opcion[];
}

export function PacienteFormDialog({ abierto, alCerrar, paciente, razas }: PacienteFormDialogProps) {
    const esEdicion = paciente !== null;
    const [campos, setCampos] = useState(VACIO);
    const [cargando, setCargando] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [errores, setErrores] = useState<Record<string, string>>({});
    const [avatarActual, setAvatarActual] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const inputAvatarRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!abierto) return;

        setErrores({});
        setAvatarFile(null);
        setAvatarPreview(null);
        if (inputAvatarRef.current) inputAvatarRef.current.value = '';

        if (paciente) {
            setCargando(true);
            axios
                .get<{ paciente: PacienteDetalle }>(`/pacientes/${paciente.id}/ficha`)
                .then((res) => {
                    const p = res.data.paciente;
                    setCampos({
                        rut: p.rut, chip: p.chip ?? '', nombres: p.nombres, apellidos: p.apellidos, nacimiento: p.nacimiento,
                        email: p.email, telefono: p.telefono, direccion: p.direccion, genero: p.genero ?? '',
                        raza: p.raza ?? '', color: p.color ?? '', peso: p.peso ? String(p.peso) : '', altura: p.altura ?? '',
                        esterilizado: p.esterilizado ?? '', especie: p.especie ?? '', observaciones: p.observaciones ?? '',
                    });
                    setAvatarActual(p.avatar && p.avatar !== 'default.jpg' ? p.avatar : null);
                })
                .finally(() => setCargando(false));
        } else {
            setCampos(VACIO);
            setAvatarActual(null);
        }
    }, [abierto, paciente]);

    useEffect(() => {
        if (!avatarFile) return;
        const url = URL.createObjectURL(avatarFile);
        setAvatarPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [avatarFile]);

    const set = (clave: keyof typeof VACIO) => (valor: string) => setCampos((prev) => ({ ...prev, [clave]: valor }));

    const fotoSrc = avatarPreview ?? (avatarActual ? `/assets/img/perfiles/${avatarActual}` : '/assets/img/default-avatar-paciente.svg');

    const guardar = () => {
        setEnviando(true);
        const datos: Record<string, string | File> = { ...campos };
        if (avatarFile) datos.avatar = avatarFile;

        const opciones = {
            forceFormData: true,
            preserveScroll: true,
            onError: (err: Record<string, string>) => setErrores(err),
            onSuccess: () => alCerrar(),
            onFinish: () => setEnviando(false),
        };

        if (esEdicion && paciente) {
            router.put(`/pacientes/${paciente.id}`, datos, opciones);
        } else {
            router.post('/pacientes', datos, opciones);
        }
    };

    return (
        <Dialog open={abierto} onOpenChange={(valor) => !valor && alCerrar()}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{esEdicion ? 'Editar paciente' : 'Nuevo paciente'}</DialogTitle>
                </DialogHeader>

                {cargando ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <img src={fotoSrc} alt="Foto del paciente" className="h-16 w-16 rounded-full border object-cover" />
                            <div>
                                <input
                                    ref={inputAvatarRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/bmp"
                                    className="hidden"
                                    onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
                                />
                                <Button type="button" variant="outline" size="sm" onClick={() => inputAvatarRef.current?.click()}>
                                    Subir foto
                                </Button>
                                <InputError message={errores.avatar} />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                        <Campo label="CI del propietario" value={campos.rut} onChange={set('rut')} error={errores.rut} />
                        <Campo label="Chip" value={campos.chip} onChange={set('chip')} error={errores.chip} />
                        <Campo label="Nombre del paciente" value={campos.nombres} onChange={set('nombres')} error={errores.nombres} />
                        <Campo label="Propietario (apellidos)" value={campos.apellidos} onChange={set('apellidos')} error={errores.apellidos} />
                        <Campo label="Fecha de nacimiento" tipo="date" value={campos.nacimiento} onChange={set('nacimiento')} error={errores.nacimiento} />

                        <div className="grid gap-1.5">
                            <Label>Sexo</Label>
                            <Select value={campos.genero} onValueChange={set('genero')}>
                                <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Macho">Macho</SelectItem>
                                    <SelectItem value="Hembra">Hembra</SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={errores.genero} />
                        </div>

                        <Campo label="Email" tipo="email" value={campos.email} onChange={set('email')} error={errores.email} />
                        <Campo label="Teléfono" value={campos.telefono} onChange={set('telefono')} error={errores.telefono} />
                        <Campo label="Dirección" value={campos.direccion} onChange={set('direccion')} error={errores.direccion} />

                        <div className="grid gap-1.5">
                            <Label>Raza</Label>
                            <Select value={campos.raza} onValueChange={set('raza')}>
                                <SelectTrigger><SelectValue placeholder="Selecciona una raza" /></SelectTrigger>
                                <SelectContent>
                                    {razas.map((r) => (
                                        <SelectItem key={r.id} value={r.nombre}>{r.nombre}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errores.raza} />
                        </div>

                        <Campo label="Color" value={campos.color} onChange={set('color')} error={errores.color} />
                        <Campo label="Especie" value={campos.especie} onChange={set('especie')} error={errores.especie} />

                        <div className="grid gap-1.5">
                            <Label>Esterilizado</Label>
                            <Select value={campos.esterilizado} onValueChange={set('esterilizado')}>
                                <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Sí">Sí</SelectItem>
                                    <SelectItem value="No">No</SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={errores.esterilizado} />
                        </div>

                        <Campo label="Peso (Kg.)" tipo="number" step="0.01" value={campos.peso} onChange={set('peso')} error={errores.peso} />
                        <Campo label="Altura" value={campos.altura} onChange={set('altura')} error={errores.altura} />

                        <div className="grid gap-1.5 sm:col-span-2">
                            <Label>Observaciones</Label>
                            <Textarea value={campos.observaciones} onChange={(e) => set('observaciones')(e.target.value)} rows={3} />
                            <InputError message={errores.observaciones} />
                        </div>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={alCerrar}>Cancelar</Button>
                    <Button type="button" onClick={guardar} disabled={enviando || cargando}>
                        {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
                        {esEdicion ? 'Guardar cambios' : 'Registrar paciente'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function Campo({
    label, value, onChange, error, tipo = 'text', step,
}: {
    label: string; value: string; onChange: (valor: string) => void; error?: string; tipo?: string; step?: string;
}) {
    return (
        <div className="grid gap-1.5">
            <Label>{label}</Label>
            <Input
                type={tipo}
                inputMode={tipo === 'number' ? 'decimal' : undefined}
                step={step}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
            <InputError message={error} />
        </div>
    );
}
