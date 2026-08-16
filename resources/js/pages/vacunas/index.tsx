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

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Vacunas', href: '/vacunas' }];

interface TipoVacunaFila {
    id: number;
    nombre: string;
    aplicaciones: number;
}

interface VacunasIndexProps {
    tiposVacuna: Paginated<TipoVacunaFila>;
    filtros: { buscar: string; orden: string; direccion: 'asc' | 'desc' };
}

export default function VacunasIndex({ tiposVacuna, filtros }: VacunasIndexProps) {
    const { can } = usePermissions();
    const [formAbierto, setFormAbierto] = useState(false);
    const [editar, setEditar] = useState<TipoVacunaFila | null>(null);
    const [eliminarId, setEliminarId] = useState<number | null>(null);

    const columnas: Column<TipoVacunaFila>[] = [
        { key: 'nombre', label: 'Nombre', sortKey: 'nombre' },
        { key: 'aplicaciones', label: 'Veces aplicada', render: (f) => <Badge variant="secondary">{f.aplicaciones}</Badge> },
        {
            key: 'acciones',
            label: 'Acciones',
            headerClassName: 'text-right',
            className: 'text-right',
            render: (fila) => (
                <div className="flex justify-end gap-1">
                    {can('editar-vacunas') && (
                        <Button size="icon" variant="ghost" title="Editar" onClick={() => { setEditar(fila); setFormAbierto(true); }}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                    )}
                    {can('eliminar-vacunas') && (
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
            <Head title="Vacunas" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold tracking-tight">Vacunas</h1>
                    {can('crear-vacunas') && (
                        <Button onClick={() => { setEditar(null); setFormAbierto(true); }}>
                            <Plus className="h-4 w-4" /> Nueva vacuna
                        </Button>
                    )}
                </div>
                <p className="text-sm text-muted-foreground">
                    Este catálogo es el que aparece en "Tipo de vacuna" al atender una consulta.
                </p>

                <DataTable
                    paginacion={tiposVacuna}
                    columnas={columnas}
                    url="/vacunas"
                    busqueda={filtros.buscar}
                    orden={filtros.orden}
                    direccion={filtros.direccion}
                    placeholderBusqueda="Buscar vacuna..."
                    mensajeVacio="No se encontraron vacunas."
                />
            </div>

            <TipoVacunaFormDialog abierto={formAbierto} alCerrar={() => setFormAbierto(false)} tipoVacuna={editar} />

            <ConfirmDeleteDialog
                abierto={eliminarId !== null}
                onOpenChange={(abierto) => !abierto && setEliminarId(null)}
                descripcion="Las consultas que ya usaron esta vacuna conservan el nombre; solo deja de aparecer en la lista para nuevas atenciones."
                onConfirmar={() => {
                    if (eliminarId) router.delete(`/vacunas/${eliminarId}`, { preserveScroll: true });
                    setEliminarId(null);
                }}
            />
        </AppLayout>
    );
}

function TipoVacunaFormDialog({
    abierto, alCerrar, tipoVacuna,
}: {
    abierto: boolean; alCerrar: () => void; tipoVacuna: TipoVacunaFila | null;
}) {
    const esEdicion = tipoVacuna !== null;
    const [nombre, setNombre] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState<string | undefined>();

    useEffect(() => {
        if (abierto) {
            setNombre(tipoVacuna?.nombre ?? '');
            setError(undefined);
        }
    }, [abierto, tipoVacuna]);

    const guardar = () => {
        setEnviando(true);
        const opciones = {
            preserveScroll: true,
            onError: (err: Record<string, string>) => setError(err.nombre),
            onSuccess: () => alCerrar(),
            onFinish: () => setEnviando(false),
        };

        if (esEdicion && tipoVacuna) {
            router.put(`/vacunas/${tipoVacuna.id}`, { nombre }, opciones);
        } else {
            router.post('/vacunas', { nombre }, opciones);
        }
    };

    return (
        <Dialog open={abierto} onOpenChange={(valor) => !valor && alCerrar()}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>{esEdicion ? 'Editar vacuna' : 'Nueva vacuna'}</DialogTitle>
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
