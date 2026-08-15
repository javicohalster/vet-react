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
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { EspedienteDialog } from '@/pages/pacientes/expediente-dialog';
import { FichaDialog } from '@/pages/pacientes/ficha-dialog';
import { PacienteFormDialog } from '@/pages/pacientes/paciente-form-dialog';
import { usePermissions } from '@/hooks/use-permissions';
import { type BreadcrumbItem, type Opcion, type Paginated } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ClipboardList, FolderOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Pacientes', href: '/pacientes' }];

export interface PacienteFila {
    id: number;
    rut: string;
    chip: string | null;
    nombres: string;
    apellidos: string;
    telefono: string;
    raza: string | null;
    color: string | null;
    edad: string;
    nacimiento: string;
    ultima_atencion: string | null;
}

interface PacientesIndexProps {
    pacientes: Paginated<PacienteFila>;
    filtros: { buscar: string };
    razas: Opcion[];
}

export default function PacientesIndex({ pacientes, filtros, razas }: PacientesIndexProps) {
    const { can } = usePermissions();
    const [formAbierto, setFormAbierto] = useState(false);
    const [pacienteEditar, setPacienteEditar] = useState<PacienteFila | null>(null);
    const [fichaId, setFichaId] = useState<number | null>(null);
    const [expedienteId, setExpedienteId] = useState<number | null>(null);
    const [eliminarId, setEliminarId] = useState<number | null>(null);

    const columnas: Column<PacienteFila>[] = [
        { key: 'id', label: 'N° Historia Clínica' },
        { key: 'rut', label: 'CI' },
        { key: 'nombres', label: 'Paciente' },
        { key: 'apellidos', label: 'Propietario' },
        { key: 'telefono', label: 'Teléfono' },
        { key: 'raza', label: 'Raza', render: (f) => f.raza ?? '—' },
        { key: 'edad', label: 'Edad' },
        { key: 'ultima_atencion', label: 'Última atención', render: (f) => f.ultima_atencion ?? '—' },
        {
            key: 'acciones',
            label: 'Acciones',
            headerClassName: 'text-right',
            className: 'text-right',
            render: (fila) => (
                <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" title="Ficha del paciente" onClick={() => setFichaId(fila.id)}>
                        <ClipboardList className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" title="Expediente clínico" onClick={() => setExpedienteId(fila.id)}>
                        <FolderOpen className="h-4 w-4" />
                    </Button>
                    {can('editar-pacientes') && (
                        <Button size="icon" variant="ghost" title="Editar" onClick={() => { setPacienteEditar(fila); setFormAbierto(true); }}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                    )}
                    {can('eliminar-pacientes') && (
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
            <Head title="Pacientes" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold tracking-tight">Pacientes</h1>
                    {can('crear-pacientes') && (
                        <Button onClick={() => { setPacienteEditar(null); setFormAbierto(true); }}>
                            <Plus className="h-4 w-4" /> Nuevo paciente
                        </Button>
                    )}
                </div>

                <DataTable
                    paginacion={pacientes}
                    columnas={columnas}
                    url="/pacientes"
                    busqueda={filtros.buscar}
                    placeholderBusqueda="Buscar por N° historia clínica, nombre, propietario, CI o chip..."
                    mensajeVacio="No se encontraron pacientes."
                />
            </div>

            <PacienteFormDialog
                abierto={formAbierto}
                alCerrar={() => setFormAbierto(false)}
                paciente={pacienteEditar}
                razas={razas}
            />

            <FichaDialog pacienteId={fichaId} onClose={() => setFichaId(null)} />
            <EspedienteDialog pacienteId={expedienteId} onClose={() => setExpedienteId(null)} />

            <AlertDialog open={eliminarId !== null} onOpenChange={(abierto) => !abierto && setEliminarId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar este paciente?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Si el paciente tiene historial clínico, no podrá eliminarse. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                if (eliminarId) router.delete(`/pacientes/${eliminarId}`, { preserveScroll: true });
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
