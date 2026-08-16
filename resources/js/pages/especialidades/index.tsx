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

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Especialidades', href: '/especialidades' }];

interface EspecialidadFila {
    id: number;
    nombre: string;
    doctores: number;
    consultas: number;
}

interface EspecialidadesIndexProps {
    especialidades: Paginated<EspecialidadFila>;
    filtros: { buscar: string; orden: string; direccion: 'asc' | 'desc' };
}

export default function EspecialidadesIndex({ especialidades, filtros }: EspecialidadesIndexProps) {
    const { can } = usePermissions();
    const [formAbierto, setFormAbierto] = useState(false);
    const [editar, setEditar] = useState<EspecialidadFila | null>(null);
    const [eliminarId, setEliminarId] = useState<number | null>(null);

    const columnas: Column<EspecialidadFila>[] = [
        { key: 'nombre', label: 'Nombre', sortKey: 'nombre' },
        { key: 'doctores', label: 'Doctores', render: (f) => <Badge variant="secondary">{f.doctores}</Badge>, sortKey: 'doctores' },
        { key: 'consultas', label: 'Consultas', render: (f) => <Badge variant="outline">{f.consultas}</Badge> },
        {
            key: 'acciones',
            label: 'Acciones',
            headerClassName: 'text-right',
            className: 'text-right',
            render: (fila) => (
                <div className="flex justify-end gap-1">
                    {can('editar-especialidades') && (
                        <Button size="icon" variant="ghost" title="Editar" onClick={() => { setEditar(fila); setFormAbierto(true); }}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                    )}
                    {can('eliminar-especialidades') && (
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
            <Head title="Especialidades" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold tracking-tight">Especialidades</h1>
                    {can('crear-especialidades') && (
                        <Button onClick={() => { setEditar(null); setFormAbierto(true); }}>
                            <Plus className="h-4 w-4" /> Nueva especialidad
                        </Button>
                    )}
                </div>

                <DataTable
                    paginacion={especialidades}
                    columnas={columnas}
                    url="/especialidades"
                    busqueda={filtros.buscar}
                    orden={filtros.orden}
                    direccion={filtros.direccion}
                    placeholderBusqueda="Buscar especialidad..."
                    mensajeVacio="No se encontraron especialidades."
                />
            </div>

            <EspecialidadFormDialog abierto={formAbierto} alCerrar={() => setFormAbierto(false)} especialidad={editar} />

            <ConfirmDeleteDialog
                abierto={eliminarId !== null}
                onOpenChange={(abierto) => !abierto && setEliminarId(null)}
                descripcion="Si la especialidad tiene historial clínico, no podrá eliminarse. Esta acción no se puede deshacer."
                onConfirmar={() => {
                    if (eliminarId) router.delete(`/especialidades/${eliminarId}`, { preserveScroll: true });
                    setEliminarId(null);
                }}
            />
        </AppLayout>
    );
}

function EspecialidadFormDialog({
    abierto, alCerrar, especialidad,
}: {
    abierto: boolean; alCerrar: () => void; especialidad: EspecialidadFila | null;
}) {
    const esEdicion = especialidad !== null;
    const [nombre, setNombre] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState<string | undefined>();

    useEffect(() => {
        if (abierto) {
            setNombre(especialidad?.nombre ?? '');
            setError(undefined);
        }
    }, [abierto, especialidad]);

    const guardar = () => {
        setEnviando(true);
        const opciones = {
            preserveScroll: true,
            onError: (err: Record<string, string>) => setError(err.nombre),
            onSuccess: () => alCerrar(),
            onFinish: () => setEnviando(false),
        };

        if (esEdicion && especialidad) {
            router.put(`/especialidades/${especialidad.id}`, { nombre }, opciones);
        } else {
            router.post('/especialidades', { nombre }, opciones);
        }
    };

    return (
        <Dialog open={abierto} onOpenChange={(valor) => !valor && alCerrar()}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>{esEdicion ? 'Editar especialidad' : 'Nueva especialidad'}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-1.5">
                    <Label>Nombre</Label>
                    <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
                    <InputError message={error} />
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={alCerrar}>Cancelar</Button>
                    <Button type="button" onClick={guardar} disabled={enviando || !nombre}>
                        {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
                        Guardar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
