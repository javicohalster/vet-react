import { Badge } from '@/components/ui/badge';
import { Column, DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Paginated } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Siguientes Citas', href: '/revisar' }];

type TipoSeguimiento = 'citas' | 'vacunas' | 'desparasitaciones';

interface FilaProxima {
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
    fecha_proxima: string | null;
    dias_restantes: number | null;
    /** Tipo de vacuna (pestaña Vacunas) o producto (pestaña Desparasitaciones). */
    detalle: string | null;
}

interface RevisarIndexProps {
    citas: Paginated<FilaProxima>;
    tipo: TipoSeguimiento;
    filtros: { buscar: string; desde: string; hasta: string; orden: string; direccion: 'asc' | 'desc' };
}

const ETIQUETAS: Record<TipoSeguimiento, { titulo: string; columna: string; fecha: string; vacio: string }> = {
    citas: { titulo: 'Citas', columna: 'Motivo', fecha: 'Próxima cita', vacio: 'No hay próximas citas en el rango seleccionado.' },
    vacunas: { titulo: 'Vacunas', columna: 'Tipo de vacuna', fecha: 'Próxima vacuna', vacio: 'No hay vacunas próximas a vencer en el rango seleccionado.' },
    desparasitaciones: {
        titulo: 'Desparasitaciones',
        columna: 'Producto',
        fecha: 'Próxima desparasitación',
        vacio: 'No hay desparasitaciones próximas en el rango seleccionado.',
    },
};

export default function RevisarIndex({ citas, tipo, filtros }: RevisarIndexProps) {
    const [desde, setDesde] = useState(filtros.desde);
    const [hasta, setHasta] = useState(filtros.hasta);
    const etiquetas = ETIQUETAS[tipo];

    const aplicarRango = () => {
        router.get('/revisar', { tipo, desde, hasta, buscar: filtros.buscar || undefined }, { preserveState: true });
    };

    const cambiarTipo = (nuevoTipo: string) => {
        router.get('/revisar', { tipo: nuevoTipo, desde, hasta }, { preserveState: true });
    };

    const columnas: Column<FilaProxima>[] = [
        { key: 'rut', label: 'CI', sortKey: 'rut' },
        { key: 'chip', label: 'Chip', render: (f) => f.chip ?? '—' },
        { key: 'nombres', label: 'Paciente', sortKey: 'nombres' },
        { key: 'apellidos', label: 'Propietario', sortKey: 'apellidos' },
        { key: 'telefono', label: 'Teléfono', sortKey: 'telefono' },
        { key: 'raza', label: 'Raza', render: (f) => f.raza ?? '—' },
        { key: 'ultima_atencion', label: 'Última atención', render: (f) => f.ultima_atencion ?? '—', sortKey: 'ultima_atencion' },
        ...(tipo !== 'citas'
            ? [{ key: 'detalle', label: etiquetas.columna, render: (f: FilaProxima) => f.detalle ?? '—', sortKey: 'detalle' }]
            : []),
        {
            key: 'fecha_proxima',
            label: etiquetas.fecha,
            sortKey: 'fecha_proxima',
            render: (f) => (
                <div className="flex items-center gap-2">
                    <span>{f.fecha_proxima ?? '—'}</span>
                    {f.dias_restantes !== null && <BadgeDias dias={f.dias_restantes} />}
                </div>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Siguientes Citas" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-semibold tracking-tight">Siguientes Citas</h1>
                    <Tabs value={tipo} onValueChange={cambiarTipo}>
                        <TabsList>
                            <TabsTrigger value="citas">Citas</TabsTrigger>
                            <TabsTrigger value="vacunas">Vacunas</TabsTrigger>
                            <TabsTrigger value="desparasitaciones">Desparasitaciones</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

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
                    orden={filtros.orden}
                    direccion={filtros.direccion}
                    parametros={{ tipo, desde, hasta }}
                    placeholderBusqueda="Buscar por nombre, propietario, CI o teléfono..."
                    mensajeVacio={etiquetas.vacio}
                    claveFila={(f) => `${tipo}-${f.id}`}
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
