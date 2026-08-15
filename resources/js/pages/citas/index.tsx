import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { type DateClickArg } from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { type EventClickArg, type EventDropArg, type EventInput } from '@fullcalendar/core';
import esLocale from '@fullcalendar/core/locales/es';

import { CitaFormDialog, type CitaSeleccionada } from '@/pages/citas/cita-form-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import axios from '@/lib/http';
import AppLayout from '@/layouts/app-layout';
import { usePermissions } from '@/hooks/use-permissions';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { CalendarCheck, PawPrint, Stethoscope } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Inicio', href: '/' }];

/**
 * Formatea una fecha tal como se ve en pantalla, sin convertirla a UTC.
 * El backend manda las horas "flotantes" (sin zona horaria) a propósito,
 * así que hay que devolverlas de la misma forma; `.toISOString()` las
 * desfasaría según la zona horaria del navegador.
 */
function aLocalISO(fecha: Date): string {
    const dos = (n: number) => String(n).padStart(2, '0');
    return (
        `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}` +
        `T${dos(fecha.getHours())}:${dos(fecha.getMinutes())}:${dos(fecha.getSeconds())}`
    );
}

interface DoctorOpcion {
    id: number;
    nombre: string;
    especialidades: number[];
}

interface EspecialidadOpcion {
    id: number;
    nombre: string;
}

interface CitasIndexProps {
    doctores: DoctorOpcion[];
    especialidades: EspecialidadOpcion[];
    resumen: { pacientes: number; pendientes: number; atendidasHoy: number };
}

export default function CitasIndex({ doctores, especialidades, resumen }: CitasIndexProps) {
    const { can } = usePermissions();
    const calendarRef = useRef<FullCalendar | null>(null);
    const [dialogAbierto, setDialogAbierto] = useState(false);
    const [citaSeleccionada, setCitaSeleccionada] = useState<CitaSeleccionada | null>(null);
    const [fechaSeleccionada, setFechaSeleccionada] = useState<{ fecha: string; horaInicio: string } | null>(null);
    // En pantallas angostas la vista semanal de 7 columnas no cabe: se arranca en vista de día.
    const [vistaInicial] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 640 ? 'timeGridDay' : 'timeGridWeek'));

    const cargarEventos = useCallback(
        (info: { startStr: string; endStr: string }, exito: (eventos: EventInput[]) => void, error: (err: Error) => void) => {
            axios
                .get('/citas/eventos', { params: { desde: info.startStr, hasta: info.endStr } })
                .then((res) => exito([...res.data.citas, ...res.data.agenda]))
                .catch(error);
        },
        [],
    );

    const alHacerClicEnFecha = (info: DateClickArg) => {
        if (!can('crear-citas')) return;

        setCitaSeleccionada(null);
        setFechaSeleccionada({
            fecha: info.dateStr.slice(0, 10),
            horaInicio: info.view.type === 'dayGridMonth' ? '09:00' : (info.dateStr.slice(11, 16) || '09:00'),
        });
        setDialogAbierto(true);
    };

    const alHacerClicEnEvento = (info: EventClickArg) => {
        const props = info.event.extendedProps as Record<string, unknown>;

        // Los bloques de agenda del doctor son solo de fondo, no se editan.
        if (!info.event.start || String(info.event.id).startsWith('dia-')) return;

        setFechaSeleccionada(null);
        setCitaSeleccionada({
            id: Number(info.event.id),
            fecha: aLocalISO(info.event.start).slice(0, 10),
            horaInicio: aLocalISO(info.event.start).slice(11, 16),
            horaFin: info.event.end ? aLocalISO(info.event.end).slice(11, 16) : '',
            pacienteId: props.pacienteId as number,
            pacienteEtiqueta: `${props.paciente} / ${props.doctor ?? ''}`,
            doctorId: props.doctorId as number,
            especialidadId: props.especialidadId as number,
            descripcion: (props.descripcion as string) ?? '',
            estado: props.estado as string,
        });
        setDialogAbierto(true);
    };

    const alMoverEvento = (info: EventDropArg | { event: EventClickArg['event']; revert: () => void }) => {
        if (String(info.event.id).startsWith('dia-') || !info.event.start || !info.event.end) {
            info.revert();
            return;
        }

        router.put(
            `/citas/${info.event.id}/mover`,
            {
                fecha_inicio: aLocalISO(info.event.start),
                fecha_fin: aLocalISO(info.event.end),
            },
            {
                preserveScroll: true,
                onSuccess: () => refrescarCalendario(),
                onError: (errores) => {
                    toast.error(Object.values(errores)[0] as string);
                    info.revert();
                },
            },
        );
    };

    const refrescarCalendario = () => {
        calendarRef.current?.getApi().refetchEvents();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inicio" />

            <div className="flex flex-col gap-4 p-4">
                <div className="grid gap-4 sm:grid-cols-3">
                    <TarjetaResumen icono={PawPrint} etiqueta="Pacientes registrados" valor={resumen.pacientes} />
                    <TarjetaResumen icono={CalendarCheck} etiqueta="Citas pendientes" valor={resumen.pendientes} />
                    <TarjetaResumen icono={Stethoscope} etiqueta="Atendidas hoy" valor={resumen.atendidasHoy} />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Agenda de citas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="min-w-0 overflow-x-auto [&_.fc-toolbar]:flex-wrap [&_.fc-toolbar]:gap-2 [&_.fc-toolbar-title]:text-base sm:[&_.fc-toolbar-title]:text-xl">
                            <FullCalendar
                                ref={calendarRef}
                                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                                initialView={vistaInicial}
                                headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
                                locale={esLocale}
                                height={650}
                                slotMinTime="00:00:00"
                                slotMaxTime="24:00:00"
                                scrollTime="07:00:00"
                                allDaySlot={false}
                                selectable={can('crear-citas')}
                                editable={can('editar-citas')}
                                events={cargarEventos}
                                dateClick={alHacerClicEnFecha}
                                eventClick={alHacerClicEnEvento}
                                eventDrop={alMoverEvento}
                                eventResize={alMoverEvento}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <CitaFormDialog
                abierto={dialogAbierto}
                alCerrar={() => setDialogAbierto(false)}
                cita={citaSeleccionada}
                fechaPreseleccionada={fechaSeleccionada}
                doctores={doctores}
                especialidades={especialidades}
                alGuardar={refrescarCalendario}
            />
        </AppLayout>
    );
}

function TarjetaResumen({ icono: Icono, etiqueta, valor }: { icono: typeof PawPrint; etiqueta: string; valor: number }) {
    return (
        <Card>
            <CardContent className="flex items-center gap-4 pt-6">
                <div className="rounded-full bg-teal-50 p-3 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                    <Icono className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-2xl font-semibold">{valor.toLocaleString('es')}</p>
                    <p className="text-sm text-muted-foreground">{etiqueta}</p>
                </div>
            </CardContent>
        </Card>
    );
}
