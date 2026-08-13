import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { type Paginated } from '@/types';
import { router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export interface Column<T> {
    /** Clave única de la columna. */
    key: string;
    /** Encabezado visible. */
    label: string;
    /** Contenido de la celda. Por defecto muestra `fila[key]`. */
    render?: (fila: T) => React.ReactNode;
    className?: string;
    headerClassName?: string;
}

interface DataTableProps<T> {
    /** Página de resultados devuelta por el paginador de Laravel. */
    paginacion: Paginated<T>;
    columnas: Column<T>[];
    /** URL a la que se envían la búsqueda y el cambio de página. */
    url: string;
    /** Término de búsqueda actual (viene del servidor). */
    busqueda?: string;
    placeholderBusqueda?: string;
    /** Parámetros adicionales que deben conservarse al buscar o paginar. */
    parametros?: Record<string, string | number | undefined>;
    mensajeVacio?: string;
    /** Clave de React para cada fila; por defecto `id`. */
    claveFila?: (fila: T) => React.Key;
}

/**
 * Tabla con búsqueda y paginación en servidor. Sustituye a DataTables.js del
 * sistema anterior: la búsqueda se envía al backend (debounce de 350 ms) para
 * no traer miles de registros al navegador.
 */
export function DataTable<T extends { id: number }>({
    paginacion,
    columnas,
    url,
    busqueda = '',
    placeholderBusqueda = 'Buscar...',
    parametros = {},
    mensajeVacio = 'No se encontraron registros.',
    claveFila,
}: DataTableProps<T>) {
    const [termino, setTermino] = useState(busqueda);
    const primeraCarga = useRef(true);

    // Mantiene el input sincronizado si el servidor devuelve otra búsqueda.
    useEffect(() => {
        setTermino(busqueda);
    }, [busqueda]);

    useEffect(() => {
        if (primeraCarga.current) {
            primeraCarga.current = false;
            return;
        }

        if (termino === busqueda) {
            return;
        }

        const temporizador = setTimeout(() => {
            router.get(url, { ...limpiar(parametros), buscar: termino || undefined }, { preserveState: true, replace: true });
        }, 350);

        return () => clearTimeout(temporizador);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [termino]);

    const irA = (destino: string | null) => {
        if (destino) {
            router.get(destino, {}, { preserveState: true, preserveScroll: true });
        }
    };

    const { data, from, to, total, current_page: paginaActual, last_page: ultimaPagina, links } = paginacion;

    return (
        <div className="space-y-3">
            <div className="relative max-w-sm">
                <Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={termino}
                    onChange={(e) => setTermino(e.target.value)}
                    placeholder={placeholderBusqueda}
                    className="pl-8"
                    aria-label="Buscar"
                />
            </div>

            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/40">
                            {columnas.map((columna) => (
                                <TableHead key={columna.key} className={columna.headerClassName}>
                                    {columna.label}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columnas.length} className="py-10 text-center text-muted-foreground">
                                    {mensajeVacio}
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((fila, indice) => (
                                <TableRow key={claveFila ? claveFila(fila) : ((fila.id as React.Key) ?? indice)}>
                                    {columnas.map((columna) => (
                                        <TableCell key={columna.key} className={columna.className}>
                                            {columna.render
                                                ? columna.render(fila)
                                                : String((fila as Record<string, unknown>)[columna.key] ?? '')}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                <p>
                    {total > 0 ? (
                        <>
                            Mostrando <span className="font-medium text-foreground">{from}</span>–
                            <span className="font-medium text-foreground">{to}</span> de{' '}
                            <span className="font-medium text-foreground">{total.toLocaleString('es')}</span> registros
                        </>
                    ) : (
                        'Sin registros'
                    )}
                </p>

                {ultimaPagina > 1 && (
                    <nav className="flex items-center gap-1" aria-label="Paginación">
                        <button
                            type="button"
                            onClick={() => irA(links[0]?.url ?? null)}
                            disabled={paginaActual === 1}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-40"
                            aria-label="Página anterior"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>

                        <span className="px-2">
                            Página <span className="font-medium text-foreground">{paginaActual}</span> de{' '}
                            <span className="font-medium text-foreground">{ultimaPagina}</span>
                        </span>

                        <button
                            type="button"
                            onClick={() => irA(links[links.length - 1]?.url ?? null)}
                            disabled={paginaActual === ultimaPagina}
                            className={cn(
                                'inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors hover:bg-accent',
                                'disabled:pointer-events-none disabled:opacity-40',
                            )}
                            aria-label="Página siguiente"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </nav>
                )}
            </div>
        </div>
    );
}

/** Elimina claves sin valor para no ensuciar la URL. */
function limpiar(parametros: Record<string, string | number | undefined>) {
    return Object.fromEntries(Object.entries(parametros).filter(([, valor]) => valor !== undefined && valor !== ''));
}
