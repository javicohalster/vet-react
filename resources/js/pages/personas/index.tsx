import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChangePasswordDialog } from '@/components/change-password-dialog';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { Column, DataTable } from '@/components/data-table';
import AppLayout from '@/layouts/app-layout';
import { PersonaFormDialog } from '@/pages/personas/persona-form-dialog';
import { RolesPersonaDialog } from '@/pages/personas/roles-persona-dialog';
import { usePermissions } from '@/hooks/use-permissions';
import { type BreadcrumbItem, type Opcion, type Paginated } from '@/types';
import { Head, router } from '@inertiajs/react';
import { KeyRound, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Personas', href: '/personas' }];

export interface PersonaFila {
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
    roles: { id: number; nombre: string }[];
    roles_ids: number[];
}

interface PersonasIndexProps {
    personas: Paginated<PersonaFila>;
    filtros: { buscar: string };
    roles: Opcion[];
}

export default function PersonasIndex({ personas, filtros, roles }: PersonasIndexProps) {
    const { can } = usePermissions();
    const [formAbierto, setFormAbierto] = useState(false);
    const [editar, setEditar] = useState<PersonaFila | null>(null);
    const [clave, setClave] = useState<PersonaFila | null>(null);
    const [rolesPersona, setRolesPersona] = useState<PersonaFila | null>(null);
    const [eliminarId, setEliminarId] = useState<number | null>(null);

    const columnas: Column<PersonaFila>[] = [
        { key: 'rut', label: 'CI' },
        { key: 'nombres', label: 'Nombres' },
        { key: 'apellidos', label: 'Apellidos' },
        { key: 'email', label: 'Email' },
        {
            key: 'roles',
            label: 'Roles',
            render: (f) => (
                <div className="flex flex-wrap gap-1">
                    {f.roles.length === 0 ? '—' : f.roles.map((r) => <Badge key={r.id} variant="secondary">{r.nombre}</Badge>)}
                </div>
            ),
        },
        {
            key: 'acciones',
            label: 'Acciones',
            headerClassName: 'text-right',
            className: 'text-right',
            render: (fila) => (
                <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" title="Roles" onClick={() => setRolesPersona(fila)}>
                        <ShieldCheck className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" title="Restablecer contraseña" onClick={() => setClave(fila)}>
                        <KeyRound className="h-4 w-4" />
                    </Button>
                    {can('editar-personas') && (
                        <Button size="icon" variant="ghost" title="Editar" onClick={() => { setEditar(fila); setFormAbierto(true); }}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                    )}
                    {can('eliminar-personas') && (
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
            <Head title="Personas" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold tracking-tight">Personas</h1>
                    {can('crear-personas') && (
                        <Button onClick={() => { setEditar(null); setFormAbierto(true); }}>
                            <Plus className="h-4 w-4" /> Nueva persona
                        </Button>
                    )}
                </div>

                <DataTable
                    paginacion={personas}
                    columnas={columnas}
                    url="/personas"
                    busqueda={filtros.buscar}
                    placeholderBusqueda="Buscar por nombre, usuario, CI o email..."
                    mensajeVacio="No se encontraron personas."
                />
            </div>

            <PersonaFormDialog abierto={formAbierto} alCerrar={() => setFormAbierto(false)} persona={editar} roles={roles} />

            <RolesPersonaDialog persona={rolesPersona} todosLosRoles={roles} onClose={() => setRolesPersona(null)} />

            <ChangePasswordDialog
                abierto={clave !== null}
                onClose={() => setClave(null)}
                url={clave ? `/personas/${clave.id}/clave` : ''}
                nombre={clave ? `${clave.nombres} ${clave.apellidos}` : undefined}
            />

            <ConfirmDeleteDialog
                abierto={eliminarId !== null}
                onOpenChange={(abierto) => !abierto && setEliminarId(null)}
                descripcion="Si la persona tiene historial clínico, no podrá eliminarse. Esta acción no se puede deshacer."
                onConfirmar={() => {
                    if (eliminarId) router.delete(`/personas/${eliminarId}`, { preserveScroll: true });
                    setEliminarId(null);
                }}
            />
        </AppLayout>
    );
}
