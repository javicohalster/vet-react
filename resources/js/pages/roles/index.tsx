import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { Column, DataTable } from '@/components/data-table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { PermisosRolDialog } from '@/pages/roles/permisos-rol-dialog';
import { usePermissions } from '@/hooks/use-permissions';
import { type BreadcrumbItem, type Paginated } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Loader2, Lock, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Roles', href: '/roles' }];

export interface RolFila {
    id: number;
    name: string;
    display_name: string | null;
    description: string | null;
    usuarios: number;
    permisos: string[];
    permisos_ids: number[];
}

interface PermisoOpcion {
    id: number;
    name: string;
}

interface RolesIndexProps {
    roles: Paginated<RolFila>;
    filtros: { buscar: string };
    permisos: PermisoOpcion[];
}

const VACIO = { name: '', display_name: '', description: '' };

export default function RolesIndex({ roles, filtros, permisos }: RolesIndexProps) {
    const { can } = usePermissions();
    const [formAbierto, setFormAbierto] = useState(false);
    const [editar, setEditar] = useState<RolFila | null>(null);
    const [permisosRol, setPermisosRol] = useState<RolFila | null>(null);
    const [eliminarId, setEliminarId] = useState<number | null>(null);
    const [campos, setCampos] = useState(VACIO);
    const [enviando, setEnviando] = useState(false);
    const [errores, setErrores] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!formAbierto) return;
        setErrores({});
        setCampos(editar ? { name: editar.name, display_name: editar.display_name ?? '', description: editar.description ?? '' } : VACIO);
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
            router.put(`/roles/${editar.id}`, campos, opciones);
        } else {
            router.post('/roles', campos, opciones);
        }
    };

    const columnas: Column<RolFila>[] = [
        { key: 'name', label: 'Nombre', render: (f) => f.display_name || f.name },
        { key: 'usuarios', label: 'Personas', render: (f) => <Badge variant="secondary">{f.usuarios}</Badge> },
        {
            key: 'permisos',
            label: 'Permisos',
            render: (f) => (
                <div className="flex max-w-md flex-wrap gap-1">
                    {f.permisos.length === 0 ? '—' : f.permisos.slice(0, 4).map((p) => <Badge key={p} variant="outline">{p}</Badge>)}
                    {f.permisos.length > 4 && <Badge variant="outline">+{f.permisos.length - 4}</Badge>}
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
                    <Button size="icon" variant="ghost" title="Permisos" onClick={() => setPermisosRol(fila)}>
                        <Lock className="h-4 w-4" />
                    </Button>
                    {can('editar-roles') && (
                        <Button size="icon" variant="ghost" title="Editar" onClick={() => { setEditar(fila); setFormAbierto(true); }}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                    )}
                    {can('eliminar-roles') && (
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
            <Head title="Roles" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold tracking-tight">Roles</h1>
                    {can('crear-roles') && (
                        <Button onClick={() => { setEditar(null); setFormAbierto(true); }}>
                            <Plus className="h-4 w-4" /> Nuevo rol
                        </Button>
                    )}
                </div>

                <DataTable
                    paginacion={roles}
                    columnas={columnas}
                    url="/roles"
                    busqueda={filtros.buscar}
                    placeholderBusqueda="Buscar rol..."
                    mensajeVacio="No se encontraron roles."
                />
            </div>

            <Dialog open={formAbierto} onOpenChange={setFormAbierto}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>{editar ? 'Editar rol' : 'Nuevo rol'}</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4">
                        <div className="grid gap-1.5">
                            <Label>Nombre (identificador)</Label>
                            <Input value={campos.name} onChange={(e) => set('name')(e.target.value)} />
                            <InputError message={errores.name} />
                        </div>
                        <div className="grid gap-1.5">
                            <Label>Nombre visible</Label>
                            <Input value={campos.display_name} onChange={(e) => set('display_name')(e.target.value)} />
                            <InputError message={errores.display_name} />
                        </div>
                        <div className="grid gap-1.5">
                            <Label>Descripción</Label>
                            <Textarea value={campos.description} onChange={(e) => set('description')(e.target.value)} rows={2} />
                            <InputError message={errores.description} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setFormAbierto(false)}>Cancelar</Button>
                        <Button type="button" onClick={guardar} disabled={enviando || !campos.name}>
                            {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <PermisosRolDialog rol={permisosRol} todosLosPermisos={permisos} onClose={() => setPermisosRol(null)} />

            <ConfirmDeleteDialog
                abierto={eliminarId !== null}
                onOpenChange={(abierto) => !abierto && setEliminarId(null)}
                descripcion="Si el rol está asignado a una persona, no podrá eliminarse. Esta acción no se puede deshacer."
                onConfirmar={() => {
                    if (eliminarId) router.delete(`/roles/${eliminarId}`, { preserveScroll: true });
                    setEliminarId(null);
                }}
            />
        </AppLayout>
    );
}
