import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Column, DataTable } from '@/components/data-table';
import AppLayout from '@/layouts/app-layout';
import { ConsultasPickerDialog } from '@/pages/documentos/consultas-picker-dialog';
import { DocumentosDialog } from '@/pages/documentos/documentos-dialog';
import { type BreadcrumbItem, type Paginated } from '@/types';
import { Head } from '@inertiajs/react';
import { FolderOpen } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Documentos', href: '/documentos-pacientes' }];

interface PacienteDocumentos {
    id: number;
    rut: string;
    chip: string | null;
    nombres: string;
    apellidos: string;
    telefono: string;
    consultas: number;
    documentos: number;
}

interface DocumentosIndexProps {
    pacientes: Paginated<PacienteDocumentos>;
    filtros: { buscar: string };
}

export default function DocumentosIndex({ pacientes, filtros }: DocumentosIndexProps) {
    const [pacienteId, setPacienteId] = useState<number | null>(null);
    const [consultaId, setConsultaId] = useState<number | null>(null);

    const columnas: Column<PacienteDocumentos>[] = [
        { key: 'rut', label: 'CI' },
        { key: 'chip', label: 'Chip', render: (f) => f.chip ?? '—' },
        { key: 'nombres', label: 'Paciente' },
        { key: 'apellidos', label: 'Propietario' },
        { key: 'telefono', label: 'Teléfono' },
        { key: 'consultas', label: 'Consultas', render: (f) => <Badge variant="secondary">{f.consultas}</Badge> },
        { key: 'documentos', label: 'Documentos', render: (f) => <Badge variant={f.documentos > 0 ? 'default' : 'outline'}>{f.documentos}</Badge> },
        {
            key: 'acciones',
            label: 'Acciones',
            headerClassName: 'text-right',
            className: 'text-right',
            render: (fila) => (
                <Button size="sm" variant="outline" onClick={() => setPacienteId(fila.id)}>
                    <FolderOpen className="h-4 w-4" /> Ver documentos
                </Button>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Documentos" />

            <div className="flex flex-col gap-4 p-4">
                <h1 className="text-2xl font-semibold tracking-tight">Documentos por paciente</h1>

                <DataTable
                    paginacion={pacientes}
                    columnas={columnas}
                    url="/documentos-pacientes"
                    busqueda={filtros.buscar}
                    placeholderBusqueda="Buscar por nombre, propietario, CI o chip..."
                    mensajeVacio="No se encontraron pacientes."
                />
            </div>

            <ConsultasPickerDialog
                pacienteId={pacienteId}
                onClose={() => setPacienteId(null)}
                onSeleccionar={(id) => {
                    setConsultaId(id);
                    setPacienteId(null);
                }}
            />

            <DocumentosDialog consultaId={consultaId} onClose={() => setConsultaId(null)} />
        </AppLayout>
    );
}
