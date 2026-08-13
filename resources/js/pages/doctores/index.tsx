import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChangePasswordDialog } from '@/components/change-password-dialog';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { Column, DataTable } from '@/components/data-table';
import AppLayout from '@/layouts/app-layout';
import { DiasAgendaDialog } from '@/pages/doctores/dias-agenda-dialog';
import { DoctorFormDialog } from '@/pages/doctores/doctor-form-dialog';
import { EspecialidadesDoctorDialog } from '@/pages/doctores/especialidades-doctor-dialog';
import { usePermissions } from '@/hooks/use-permissions';
import { type BreadcrumbItem, type Opcion, type Paginated } from '@/types';
import { Head, router } from '@inertiajs/react';
import { CalendarClock, KeyRound, Pencil, Plus, Stethoscope, Trash2 } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Doctores', href: '/doctores' }];

export interface DoctorFila {
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
    estudios_complementarios: string | null;
    especialidades: { id: number; nombre: string }[];
    dias: number;
}

interface DoctoresIndexProps {
    doctores: Paginated<DoctorFila>;
    filtros: { buscar: string };
    especialidades: Opcion[];
}

export default function DoctoresIndex({ doctores, filtros, especialidades }: DoctoresIndexProps) {
    const { can } = usePermissions();
    const [formAbierto, setFormAbierto] = useState(false);
    const [doctorEditar, setDoctorEditar] = useState<DoctorFila | null>(null);
    const [claveDoctor, setClaveDoctor] = useState<DoctorFila | null>(null);
    const [especialidadesDoctor, setEspecialidadesDoctor] = useState<DoctorFila | null>(null);
    const [diasDoctor, setDiasDoctor] = useState<DoctorFila | null>(null);
    const [eliminarId, setEliminarId] = useState<number | null>(null);

    const columnas: Column<DoctorFila>[] = [
        { key: 'rut', label: 'CI' },
        { key: 'nombres', label: 'Nombres' },
        { key: 'apellidos', label: 'Apellidos' },
        { key: 'email', label: 'Email' },
        {
            key: 'especialidades',
            label: 'Especialidades',
            render: (f) => (
                <div className="flex flex-wrap gap-1">
                    {f.especialidades.length === 0 ? '—' : f.especialidades.map((e) => <Badge key={e.id} variant="secondary">{e.nombre}</Badge>)}
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
                    <Button size="icon" variant="ghost" title="Días de agenda" onClick={() => setDiasDoctor(fila)}>
                        <CalendarClock className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" title="Especialidades" onClick={() => setEspecialidadesDoctor(fila)}>
                        <Stethoscope className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" title="Restablecer contraseña" onClick={() => setClaveDoctor(fila)}>
                        <KeyRound className="h-4 w-4" />
                    </Button>
                    {can('editar-doctores') && (
                        <Button size="icon" variant="ghost" title="Editar" onClick={() => { setDoctorEditar(fila); setFormAbierto(true); }}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                    )}
                    {can('eliminar-doctores') && (
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
            <Head title="Doctores" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold tracking-tight">Doctores</h1>
                    {can('crear-doctores') && (
                        <Button onClick={() => { setDoctorEditar(null); setFormAbierto(true); }}>
                            <Plus className="h-4 w-4" /> Nuevo doctor
                        </Button>
                    )}
                </div>

                <DataTable
                    paginacion={doctores}
                    columnas={columnas}
                    url="/doctores"
                    busqueda={filtros.buscar}
                    placeholderBusqueda="Buscar por nombre, CI o email..."
                    mensajeVacio="No se encontraron doctores."
                />
            </div>

            <DoctorFormDialog abierto={formAbierto} alCerrar={() => setFormAbierto(false)} doctor={doctorEditar} />

            <ChangePasswordDialog
                abierto={claveDoctor !== null}
                onClose={() => setClaveDoctor(null)}
                url={claveDoctor ? `/doctores/${claveDoctor.id}/clave` : ''}
                nombre={claveDoctor ? `${claveDoctor.nombres} ${claveDoctor.apellidos}` : undefined}
            />

            <EspecialidadesDoctorDialog
                doctor={especialidadesDoctor}
                todasLasEspecialidades={especialidades}
                onClose={() => setEspecialidadesDoctor(null)}
            />

            <DiasAgendaDialog doctor={diasDoctor} onClose={() => setDiasDoctor(null)} />

            <ConfirmDeleteDialog
                abierto={eliminarId !== null}
                onOpenChange={(abierto) => !abierto && setEliminarId(null)}
                descripcion="Si el doctor tiene historial clínico, no podrá eliminarse. Esta acción no se puede deshacer."
                onConfirmar={() => {
                    if (eliminarId) router.delete(`/doctores/${eliminarId}`, { preserveScroll: true });
                    setEliminarId(null);
                }}
            />
        </AppLayout>
    );
}
