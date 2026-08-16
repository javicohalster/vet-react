import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { type Paginated } from '@/types';
import { router } from '@inertiajs/react';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
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
    /** Columna (del backend) por la que ordenar al hacer clic en el encabezado. Si se omite, no es ordenable. */
    sortKey?: string;
}

interface DataTableProps<T> {
    /** Página de resultados devuelta por el paginador de Laravel. */
    paginacion: Paginated<T>;
    columnas: Column<T>[];
    /** URL a la que se envían la búsqueda, el orden y el cambio de página. */
    url: string;
    /** Término de búsqueda actual (viene del servidor). */
    busqueda?: string;
    placeholderBusqueda?: string;
    /** Parámetros adicionales que deben conservarse al buscar, ordenar o paginar. */
    parametros?: Record<string, string | number | undefined>;
    mensajeVacio?: string;
    /** Clave de React para cada fila; por defecto `id`. */
    claveFila?: (fila: T) => React.Key;
    /** Columna y dirección de orden actuales (vienen del servidor). */
    orden?: string;
    direccion?: 'asc' | 'desc';
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
    orden,
    direccion,
}: DataTableProps<T>) {
    const [termino, setTermino] = useState(busqueda);
    const primeraCarga = useRef(true);

    // Mantiene el input sincronizado si el servidor devuelve otra búsqueda.
    useEffect(() => {
        setTermino(busqueda);
    }, [busqueda]);

    const buscar = (valor: string) => {
        router.get(url, { ...limpiar(parametros), buscar: valor || undefined, orden, direccion }, { preserveState: true, replace: true });
    };

    const ordenarPor = (columna: Column<T>) => {
        if (!columna.sortKey) return;

        const mismaColumna = orden === columna.sortKey;
        const siguienteDireccion = mismaColumna && direccion === 'asc' ? 'desc' : 'asc';

        router.get(
            url,
            { ...limpiar(parametros), buscar: termino || undefined, orden: columna.sortKey, direccion: siguienteDireccion },
            { preserveState: true, replace: true },
        );
    };

    useEffect(() => {
        if (primeraCarga.current) {
            primeraCarga.current = false;
            return;
        }

        if (termino === busqueda) {
            return;
        }

        // Espera a que el usuario haga una pausa real al escribir antes de
        // buscar, para no lanzar una consulta por cada letra.
        const temporizador = setTimeout(() => buscar(termino), 600);

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
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            buscar(termino);
                        }
                    }}
                    placeholder={placeholderBusqueda}
                    className="pl-8"
                    aria-label="Buscar"
                />
            </div>

            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/40">
                            {columnas.map((columna) =>
                                columna.sortKey ? (
                                    <TableHead key={columna.key} className={columna.headerClassName}>
                                        <button
                                            type="button"
                                            onClick={() => ordenarPor(columna)}
                                            className="inline-flex items-center gap-1 font-medium hover:text-foreground"
                                        >
                                            {columna.label}
                                            {orden === columna.sortKey ? (
                                                direccion === 'asc' ? (
                                                    <ArrowUp className="h-3.5 w-3.5" />
                                                ) : (
                                                    <ArrowDown className="h-3.5 w-3.5" />
                                                )
                                            ) : (
                                                <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                                            )}
                                        </button>
                                    </TableHead>
                                ) : (
                                    <TableHead key={columna.key} className={columna.headerClassName}>
                                        {columna.label}
                                    </TableHead>
                                ),
                            )}
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
