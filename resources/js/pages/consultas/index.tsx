import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Column, DataTable } from '@/components/data-table';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { AtenderDialog } from '@/pages/consultas/atender-dialog';
import { usePermissions } from '@/hooks/use-permissions';
import { type BreadcrumbItem, type Paginated } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { FileText, Pencil, Printer, Trash2 } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Consultas Médicas', href: '/consultas' }];

interface ConsultaFila {
    id: number;
    fecha: string;
    paciente: string;
    propietario: string;
    doctor: string | null;
    especialidad: string | null;
    estado: string;
    archivos: number;
}

interface ConsultasIndexProps {
    consultas: Paginated<ConsultaFila>;
    pestana: 'pendientes' | 'atendidas';
    filtros: { buscar: string; orden: string; direccion: 'asc' | 'desc' };
    contadores: { pendientes: number; atendidas: number };
}

export default function ConsultasIndex({ consultas, pestana, filtros, contadores }: ConsultasIndexProps) {
    const { can } = usePermissions();
    const [consultaId, setConsultaId] = useState<number | null>(null);
    const [eliminarId, setEliminarId] = useState<number | null>(null);

    const cambiarPestana = (valor: string) => {
        router.get('/consultas', { pestana: valor }, { preserveState: true });
    };

    const columnas: Column<ConsultaFila>[] = [
        { key: 'fecha', label: 'Fecha', sortKey: 'fecha' },
        { key: 'paciente', label: 'Paciente', sortKey: 'paciente' },
        { key: 'propietario', label: 'Propietario', sortKey: 'propietario' },
        { key: 'doctor', label: 'Doctor', render: (f) => f.doctor ?? '—', sortKey: 'doctor' },
        { key: 'especialidad', label: 'Especialidad', render: (f) => f.especialidad ?? '—', sortKey: 'especialidad' },
        {
            key: 'acciones',
            label: 'Acciones',
            headerClassName: 'text-right',
            className: 'text-right',
            render: (fila) => (
                <div className="flex justify-end gap-1">
                    {can('editar-atender') && (
                        <Button size="icon" variant="ghost" title="Atender / Ver" onClick={() => setConsultaId(fila.id)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                    )}
                    {fila.estado === 'atendido' && (
                        <Button size="icon" variant="ghost" title="Imprimir receta" asChild>
                            <a href={`/receta/${fila.id}`} target="_blank" rel="noreferrer">
                                <Printer className="h-4 w-4" />
                            </a>
                        </Button>
                    )}
                    <Button size="icon" variant="ghost" title="Documentos" asChild>
                        <Link href={`/documentos-pacientes?consulta=${fila.id}`}>
                            <FileText className="h-4 w-4" />
                            {fila.archivos > 0 && <span className="ml-0.5 text-xs">{fila.archivos}</span>}
                        </Link>
                    </Button>
                    {can('eliminar-consultas') && (
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
            <Head title="Consultas Médicas" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold tracking-tight">Consultas Médicas</h1>
                    <Tabs value={pestana} onValueChange={cambiarPestana}>
                        <TabsList>
                            <TabsTrigger value="pendientes">
                                Pendientes <Badge variant="secondary" className="ml-2">{contadores.pendientes}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="atendidas">
                                Atendidas <Badge variant="secondary" className="ml-2">{contadores.atendidas}</Badge>
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <DataTable
                    paginacion={consultas}
                    columnas={columnas}
                    url="/consultas"
                    busqueda={filtros.buscar}
                    orden={filtros.orden}
                    direccion={filtros.direccion}
                    parametros={{ pestana }}
                    placeholderBusqueda="Buscar por paciente, propietario o CI..."
                    mensajeVacio={pestana === 'pendientes' ? 'No hay citas pendientes.' : 'No hay consultas atendidas.'}
                />
            </div>

            <AtenderDialog consultaId={consultaId} onClose={() => setConsultaId(null)} />

            <AlertDialog open={eliminarId !== null} onOpenChange={(abierto) => !abierto && setEliminarId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar esta consulta?</AlertDialogTitle>
                        <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                if (eliminarId) router.delete(`/consultas/${eliminarId}`, { preserveScroll: true });
                                setEliminarId(null);
                            }}
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
