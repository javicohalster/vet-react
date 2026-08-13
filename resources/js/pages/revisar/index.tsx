import { Badge } from '@/components/ui/badge';
import { Column, DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Paginated } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Siguientes Citas', href: '/revisar' }];

interface CitaProxima {
    id: number;
    paciente_id: number;
    rut: string;
    chip: string | null;
    nombres: string;
    apellidos: string;
    telefono: string;
    email: string;
    raza: string | null;
    edad: string;
    ultima_atencion: string | null;
    proxima_cita: string | null;
    dias_restantes: number | null;
}

interface RevisarIndexProps {
    citas: Paginated<CitaProxima>;
    filtros: { buscar: string; desde: string; hasta: string };
}

export default function RevisarIndex({ citas, filtros }: RevisarIndexProps) {
    const [desde, setDesde] = useState(filtros.desde);
    const [hasta, setHasta] = useState(filtros.hasta);

    const aplicarRango = () => {
        router.get('/revisar', { desde, hasta, buscar: filtros.buscar || undefined }, { preserveState: true });
    };

    const columnas: Column<CitaProxima>[] = [
        { key: 'rut', label: 'CI' },
        { key: 'chip', label: 'Chip', render: (f) => f.chip ?? '—' },
        { key: 'nombres', label: 'Paciente' },
        { key: 'apellidos', label: 'Propietario' },
        { key: 'telefono', label: 'Teléfono' },
        { key: 'raza', label: 'Raza', render: (f) => f.raza ?? '—' },
        { key: 'ultima_atencion', label: 'Última atención', render: (f) => f.ultima_atencion ?? '—' },
        {
            key: 'proxima_cita',
            label: 'Próxima cita',
            render: (f) => (
                <div className="flex items-center gap-2">
                    <span>{f.proxima_cita ?? '—'}</span>
                    {f.dias_restantes !== null && <BadgeDias dias={f.dias_restantes} />}
                </div>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Siguientes Citas" />

            <div className="flex flex-col gap-4 p-4">
                <h1 className="text-2xl font-semibold tracking-tight">Siguientes Citas</h1>

                <div className="flex flex-wrap items-end gap-3 rounded-lg border p-3">
                    <div className="grid gap-1.5">
                        <Label>Desde</Label>
                        <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
                    </div>
                    <div className="grid gap-1.5">
                        <Label>Hasta</Label>
                        <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
                    </div>
                    <Button onClick={aplicarRango}>Aplicar rango</Button>
                </div>

                <DataTable
                    paginacion={citas}
                    columnas={columnas}
                    url="/revisar"
                    busqueda={filtros.buscar}
                    parametros={{ desde, hasta }}
                    placeholderBusqueda="Buscar por nombre, propietario, CI o teléfono..."
                    mensajeVacio="No hay próximas citas en el rango seleccionado."
                />
            </div>
        </AppLayout>
    );
}

function BadgeDias({ dias }: { dias: number }) {
    if (dias < 0) return <Badge variant="destructive">Vencida</Badge>;
    if (dias === 0) return <Badge variant="destructive">Hoy</Badge>;
    if (dias <= 3) return <Badge className="bg-amber-500 text-white hover:bg-amber-500">{dias} día(s)</Badge>;
    return <Badge variant="secondary">{dias} días</Badge>;
}
