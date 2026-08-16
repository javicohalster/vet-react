import { Button } from '@/components/ui/button';
import { ChangePasswordDialog } from '@/components/change-password-dialog';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { Column, DataTable } from '@/components/data-table';
import AppLayout from '@/layouts/app-layout';
import { RecepcionistaFormDialog } from '@/pages/recepcionistas/recepcionista-form-dialog';
import { usePermissions } from '@/hooks/use-permissions';
import { type BreadcrumbItem, type Paginated } from '@/types';
import { Head, router } from '@inertiajs/react';
import { KeyRound, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Recepcionistas', href: '/recepcionistas' }];

export interface RecepcionistaFila {
    id: number;
    rut: string;
    username: string | null;
    nombres: string;
    apellidos: string;
    email: string;
    telefono: string;
    direccion: string;
    genero: string | null;
    nacimiento: string;
}

interface RecepcionistasIndexProps {
    recepcionistas: Paginated<RecepcionistaFila>;
    filtros: { buscar: string; orden: string; direccion: 'asc' | 'desc' };
}

export default function RecepcionistasIndex({ recepcionistas, filtros }: RecepcionistasIndexProps) {
    const { can } = usePermissions();
    const [formAbierto, setFormAbierto] = useState(false);
    const [editar, setEditar] = useState<RecepcionistaFila | null>(null);
    const [clave, setClave] = useState<RecepcionistaFila | null>(null);
    const [eliminarId, setEliminarId] = useState<number | null>(null);

    const columnas: Column<RecepcionistaFila>[] = [
        { key: 'rut', label: 'CI', sortKey: 'rut' },
        { key: 'nombres', label: 'Nombres', sortKey: 'nombres' },
        { key: 'apellidos', label: 'Apellidos', sortKey: 'apellidos' },
        { key: 'email', label: 'Email', sortKey: 'email' },
        { key: 'telefono', label: 'Teléfono', sortKey: 'telefono' },
        {
            key: 'acciones',
            label: 'Acciones',
            headerClassName: 'text-right',
            className: 'text-right',
            render: (fila) => (
                <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" title="Restablecer contraseña" onClick={() => setClave(fila)}>
                        <KeyRound className="h-4 w-4" />
                    </Button>
                    {can('editar-recepsionistas') && (
                        <Button size="icon" variant="ghost" title="Editar" onClick={() => { setEditar(fila); setFormAbierto(true); }}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                    )}
                    <Button size="icon" variant="ghost" className="text-destructive" title="Eliminar" onClick={() => setEliminarId(fila.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Recepcionistas" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold tracking-tight">Recepcionistas</h1>
                    {can('crear-recepcionistas') && (
                        <Button onClick={() => { setEditar(null); setFormAbierto(true); }}>
                            <Plus className="h-4 w-4" /> Nuevo recepcionista
                        </Button>
                    )}
                </div>

                <DataTable
                    paginacion={recepcionistas}
                    columnas={columnas}
                    url="/recepcionistas"
                    busqueda={filtros.buscar}
                    orden={filtros.orden}
                    direccion={filtros.direccion}
                    placeholderBusqueda="Buscar por nombre, CI o email..."
                    mensajeVacio="No se encontraron recepcionistas."
                />
            </div>

            <RecepcionistaFormDialog abierto={formAbierto} alCerrar={() => setFormAbierto(false)} recepcionista={editar} />

            <ChangePasswordDialog
                abierto={clave !== null}
                onClose={() => setClave(null)}
                url={clave ? `/recepcionistas/${clave.id}/clave` : ''}
                nombre={clave ? `${clave.nombres} ${clave.apellidos}` : undefined}
            />

            <ConfirmDeleteDialog
                abierto={eliminarId !== null}
                onOpenChange={(abierto) => !abierto && setEliminarId(null)}
                onConfirmar={() => {
                    if (eliminarId) router.delete(`/recepcionistas/${eliminarId}`, { preserveScroll: true });
                    setEliminarId(null);
                }}
            />
        </AppLayout>
    );
}
