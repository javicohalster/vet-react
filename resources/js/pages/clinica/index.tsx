import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { Column, DataTable } from '@/components/data-table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { usePermissions } from '@/hooks/use-permissions';
import { type BreadcrumbItem, type Paginated } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Clínica', href: '/clinica' }];

interface ClinicaFila {
    id: number;
    nombre: string;
    telefono: string;
    email: string;
    direccion: string;
    region: string;
    ciudad: string;
    consultas: number;
}

interface ClinicaIndexProps {
    clinicas: Paginated<ClinicaFila>;
    filtros: { buscar: string; orden: string; direccion: 'asc' | 'desc' };
}

const VACIO = { nombre: '', telefono: '', email: '', direccion: '', region: '', ciudad: '' };

export default function ClinicaIndex({ clinicas, filtros }: ClinicaIndexProps) {
    const { can } = usePermissions();
    const [formAbierto, setFormAbierto] = useState(false);
    const [editar, setEditar] = useState<ClinicaFila | null>(null);
    const [eliminarId, setEliminarId] = useState<number | null>(null);
    const [campos, setCampos] = useState(VACIO);
    const [enviando, setEnviando] = useState(false);
    const [errores, setErrores] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!formAbierto) return;
        setErrores({});
        setCampos(editar ? { nombre: editar.nombre, telefono: editar.telefono, email: editar.email, direccion: editar.direccion, region: editar.region, ciudad: editar.ciudad } : VACIO);
    }, [formAbierto, editar]);

    const set = (clave: keyof typeof VACIO) => (valor: string) => setCampos((prev) => ({ ...prev, [clave]: valor }));

    const guardar = () => {
        setEnviando(true);
        const opciones = {
            preserveScroll: true,
            onError: (err: Record<string, string>) => setErrores(err),
            onSuccess: () => setFormAbierto(false),
            onFinish: () => setEnviando(false),
        };

        if (editar) {
            router.put(`/clinica/${editar.id}`, campos, opciones);
        } else {
            router.post('/clinica', campos, opciones);
        }
    };

    const columnas: Column<ClinicaFila>[] = [
        { key: 'nombre', label: 'Nombre', sortKey: 'nombre' },
        { key: 'telefono', label: 'Teléfono', sortKey: 'telefono' },
        { key: 'email', label: 'Email', sortKey: 'email' },
        { key: 'ciudad', label: 'Ciudad', sortKey: 'ciudad' },
        { key: 'consultas', label: 'Consultas', render: (f) => <Badge variant="outline">{f.consultas}</Badge> },
        {
            key: 'acciones',
            label: 'Acciones',
            headerClassName: 'text-right',
            className: 'text-right',
            render: (fila) => (
                <div className="flex justify-end gap-1">
                    {can('editar-clinicas') && (
                        <Button size="icon" variant="ghost" title="Editar" onClick={() => { setEditar(fila); setFormAbierto(true); }}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                    )}
                    {can('eliminar-clinicas') && (
                        <Button size="icon" variant="ghost" className="text-destructive" title="Eliminar" onClick={() => setEliminarId(fila.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Clínica" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold tracking-tight">Clínicas</h1>
                    {can('crear-clinicas') && (
                        <Button onClick={() => { setEditar(null); setFormAbierto(true); }}>
                            <Plus className="h-4 w-4" /> Nueva clínica
                        </Button>
                    )}
                </div>

                <DataTable
                    paginacion={clinicas}
                    columnas={columnas}
                    url="/clinica"
                    busqueda={filtros.buscar}
                    orden={filtros.orden}
                    direccion={filtros.direccion}
                    placeholderBusqueda="Buscar por nombre, ciudad o email..."
                    mensajeVacio="No se encontraron clínicas."
                />
            </div>

            <Dialog open={formAbierto} onOpenChange={setFormAbierto}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editar ? 'Editar clínica' : 'Nueva clínica'}</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Campo label="Nombre" value={campos.nombre} onChange={set('nombre')} error={errores.nombre} className="sm:col-span-2" />
                        <Campo label="Teléfono" value={campos.telefono} onChange={set('telefono')} error={errores.telefono} />
                        <Campo label="Email" tipo="email" value={campos.email} onChange={set('email')} error={errores.email} />
                        <Campo label="Dirección" value={campos.direccion} onChange={set('direccion')} error={errores.direccion} className="sm:col-span-2" />
                        <Campo label="Región" value={campos.region} onChange={set('region')} error={errores.region} />
                        <Campo label="Ciudad" value={campos.ciudad} onChange={set('ciudad')} error={errores.ciudad} />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setFormAbierto(false)}>Cancelar</Button>
                        <Button type="button" onClick={guardar} disabled={enviando}>
                            {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDeleteDialog
                abierto={eliminarId !== null}
                onOpenChange={(abierto) => !abierto && setEliminarId(null)}
                onConfirmar={() => {
                    if (eliminarId) router.delete(`/clinica/${eliminarId}`, { preserveScroll: true });
                    setEliminarId(null);
                }}
            />
        </AppLayout>
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
