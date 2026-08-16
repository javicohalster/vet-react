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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Column, DataTable } from '@/components/data-table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { usePermissions } from '@/hooks/use-permissions';
import { LaboratorioFormDialog } from '@/pages/laboratorio/laboratorio-form-dialog';
import { type BreadcrumbItem, type Opcion, type Paginated } from '@/types';
import { Head, router } from '@inertiajs/react';
import { FileDown, FlaskConical, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Laboratorio', href: '/laboratorio' }];

export interface LaboratorioFila {
    id: number;
    paciente: string | null;
    propietario: string | null;
    tipo_examen: string;
    fecha_muestra: string;
    estado: 'pendiente' | 'en_proceso' | 'completado';
    doctor: string | null;
}

interface LaboratorioIndexProps {
    laboratorios: Paginated<LaboratorioFila>;
    filtros: { buscar: string; estado: string; orden: string; direccion: 'asc' | 'desc' };
    contadores: { pendiente: number; en_proceso: number; completado: number };
    doctores: Opcion[];
}

const ESTADO_LABEL: Record<string, string> = {
    pendiente: 'Pendiente',
    en_proceso: 'En proceso',
    completado: 'Completado',
};

const ESTADO_BADGE: Record<string, 'outline' | 'secondary' | 'default'> = {
    pendiente: 'outline',
    en_proceso: 'secondary',
    completado: 'default',
};

export default function LaboratorioIndex({ laboratorios, filtros, contadores, doctores }: LaboratorioIndexProps) {
    const { can } = usePermissions();
    const [formAbierto, setFormAbierto] = useState(false);
    const [laboratorioId, setLaboratorioId] = useState<number | null>(null);
    const [eliminarId, setEliminarId] = useState<number | null>(null);

    const cambiarPestana = (valor: string) => {
        router.get('/laboratorio', { estado: valor }, { preserveState: true });
    };

    const columnas: Column<LaboratorioFila>[] = [
        { key: 'fecha_muestra', label: 'Fecha de muestra', sortKey: 'fecha_muestra' },
        { key: 'paciente', label: 'Paciente', render: (f) => f.paciente ?? '—', sortKey: 'paciente' },
        { key: 'propietario', label: 'Propietario', render: (f) => f.propietario ?? '—', sortKey: 'propietario' },
        { key: 'tipo_examen', label: 'Examen', sortKey: 'tipo_examen' },
        { key: 'doctor', label: 'Doctor', render: (f) => f.doctor ?? '—', sortKey: 'doctor' },
        {
            key: 'estado',
            label: 'Estado',
            render: (f) => <Badge variant={ESTADO_BADGE[f.estado]}>{ESTADO_LABEL[f.estado]}</Badge>,
            sortKey: 'estado',
        },
        {
            key: 'acciones',
            label: 'Acciones',
            headerClassName: 'text-right',
            className: 'text-right',
            render: (fila) => (
                <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" title="Ver / editar" onClick={() => setLaboratorioId(fila.id)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    {fila.estado === 'completado' && (
                        <Button size="icon" variant="ghost" title="Generar / descargar informe" asChild>
                            <a href={`/laboratorio/${fila.id}/informe`} target="_blank" rel="noreferrer">
                                <FileDown className="h-4 w-4" />
                            </a>
                        </Button>
                    )}
                    {can('eliminar-laboratorio') && (
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
            <Head title="Laboratorio" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                        <FlaskConical className="h-6 w-6 text-primary" /> Laboratorio
                    </h1>
                    <div className="flex flex-wrap items-center gap-3">
                        <Tabs value={filtros.estado || 'pendiente'} onValueChange={cambiarPestana}>
                            <TabsList>
                                <TabsTrigger value="pendiente">
                                    Pendientes <Badge variant="secondary" className="ml-2">{contadores.pendiente}</Badge>
                                </TabsTrigger>
                                <TabsTrigger value="en_proceso">
                                    En proceso <Badge variant="secondary" className="ml-2">{contadores.en_proceso}</Badge>
                                </TabsTrigger>
                                <TabsTrigger value="completado">
                                    Completados <Badge variant="secondary" className="ml-2">{contadores.completado}</Badge>
                                </TabsTrigger>
                                <TabsTrigger value="todos">Todos</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        {can('crear-laboratorio') && (
                            <Button onClick={() => setFormAbierto(true)}>
                                <Plus className="h-4 w-4" /> Nuevo examen
                            </Button>
                        )}
                    </div>
                </div>

                <DataTable
                    paginacion={laboratorios}
                    columnas={columnas}
                    url="/laboratorio"
                    busqueda={filtros.buscar}
                    orden={filtros.orden}
                    direccion={filtros.direccion}
                    parametros={{ estado: filtros.estado }}
                    placeholderBusqueda="Buscar por paciente, propietario, CI o tipo de examen..."
                    mensajeVacio="No se encontraron exámenes de laboratorio."
                />
            </div>

            <LaboratorioFormDialog
                abierto={formAbierto || laboratorioId !== null}
                laboratorioId={laboratorioId}
                doctores={doctores}
                onClose={() => {
                    setFormAbierto(false);
                    setLaboratorioId(null);
                }}
            />

            <AlertDialog open={eliminarId !== null} onOpenChange={(abierto) => !abierto && setEliminarId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar este examen de laboratorio?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se eliminarán también sus resultados. Los archivos ya subidos a Documentos no se borran. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                if (eliminarId) router.delete(`/laboratorio/${eliminarId}`, { preserveScroll: true });
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
