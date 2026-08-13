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
import { usePermissions } from '@/hooks/use-permissions';
import { type BreadcrumbItem, type Paginated } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Permisos', href: '/permisos' }];

interface PermisoFila {
    id: number;
    name: string;
    display_name: string | null;
    description: string | null;
    roles: string[];
}

interface PermisosIndexProps {
    permisos: Paginated<PermisoFila>;
    filtros: { buscar: string };
}

const VACIO = { name: '', display_name: '', description: '' };

export default function PermisosIndex({ permisos, filtros }: PermisosIndexProps) {
    const { can } = usePermissions();
    const [formAbierto, setFormAbierto] = useState(false);
    const [editar, setEditar] = useState<PermisoFila | null>(null);
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
            router.put(`/permisos/${editar.id}`, campos, opciones);
        } else {
            router.post('/permisos', campos, opciones);
        }
    };

    const columnas: Column<PermisoFila>[] = [
        { key: 'name', label: 'Nombre' },
        {
            key: 'roles',
            label: 'Roles asignados',
            render: (f) => (
                <div className="flex flex-wrap gap-1">
                    {f.roles.length === 0 ? '—' : f.roles.map((r) => <Badge key={r} variant="secondary">{r}</Badge>)}
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
                    {can('editar-permisos') && (
                        <Button size="icon" variant="ghost" title="Editar" onClick={() => { setEditar(fila); setFormAbierto(true); }}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                    )}
                    {can('eliminar-permisos') && (
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
            <Head title="Permisos" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold tracking-tight">Permisos</h1>
                    {can('crear-permisos') && (
                        <Button onClick={() => { setEditar(null); setFormAbierto(true); }}>
                            <Plus className="h-4 w-4" /> Nuevo permiso
                        </Button>
                    )}
                </div>

                <DataTable
                    paginacion={permisos}
                    columnas={columnas}
                    url="/permisos"
                    busqueda={filtros.buscar}
                    placeholderBusqueda="Buscar permiso..."
                    mensajeVacio="No se encontraron permisos."
                />
            </div>

            <Dialog open={formAbierto} onOpenChange={setFormAbierto}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>{editar ? 'Editar permiso' : 'Nuevo permiso'}</DialogTitle>
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

            <ConfirmDeleteDialog
                abierto={eliminarId !== null}
                onOpenChange={(abierto) => !abierto && setEliminarId(null)}
                descripcion="Si el permiso está asignado a un rol, no podrá eliminarse. Esta acción no se puede deshacer."
                onConfirmar={() => {
                    if (eliminarId) router.delete(`/permisos/${eliminarId}`, { preserveScroll: true });
                    setEliminarId(null);
                }}
            />
        </AppLayout>
    );
}
