import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import axios from '@/lib/http';
import { Check, Loader2, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export interface PacienteOpcion {
    id: number;
    nombre: string;
    propietario: string;
    rut: string;
    etiqueta: string;
}

interface PatientPickerProps {
    value: PacienteOpcion | null;
    onChange: (paciente: PacienteOpcion | null) => void;
    placeholder?: string;
    disabled?: boolean;
}

/**
 * Buscador de pacientes con autocompletado. La base tiene miles de registros,
 * así que en vez de un <select> con todos, se consulta `/buscar/pacientes`
 * a medida que el usuario escribe.
 */
export function PatientPicker({ value, onChange, placeholder = 'Buscar paciente por nombre, propietario o CI...', disabled }: PatientPickerProps) {
    const [abierto, setAbierto] = useState(false);
    const [termino, setTermino] = useState('');
    const [opciones, setOpciones] = useState<PacienteOpcion[]>([]);
    const [cargando, setCargando] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!abierto) return;

        setCargando(true);
        const controlador = new AbortController();
        const temporizador = setTimeout(() => {
            axios
                .get<PacienteOpcion[]>('/buscar/pacientes', { params: { q: termino }, signal: controlador.signal })
                .then((res) => setOpciones(res.data))
                .catch(() => {})
                .finally(() => setCargando(false));
        }, 250);

        return () => {
            clearTimeout(temporizador);
            controlador.abort();
        };
    }, [termino, abierto]);

    return (
        <Popover open={abierto} onOpenChange={setAbierto}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    disabled={disabled}
                    className={cn(
                        'flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        !value && 'text-muted-foreground',
                    )}
                >
                    <span className="truncate">{value ? value.etiqueta : 'Seleccionar paciente...'}</span>
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                className="w-(--radix-popover-trigger-width) p-2"
                align="start"
                onOpenAutoFocus={(e) => {
                    e.preventDefault();
                    inputRef.current?.focus();
                }}
            >
                <Input
                    ref={inputRef}
                    value={termino}
                    onChange={(e) => setTermino(e.target.value)}
                    placeholder={placeholder}
                    className="mb-2"
                />

                <div className="max-h-64 overflow-y-auto">
                    {cargando && (
                        <div className="flex items-center justify-center py-4 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                    )}

                    {!cargando && opciones.length === 0 && (
                        <p className="py-4 text-center text-sm text-muted-foreground">
                            {termino ? 'Sin resultados.' : 'Escribe para buscar un paciente.'}
                        </p>
                    )}

                    {!cargando &&
                        opciones.map((opcion) => (
                            <button
                                key={opcion.id}
                                type="button"
                                onClick={() => {
                                    onChange(opcion);
                                    setAbierto(false);
                                }}
                                className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                            >
                                <span className="truncate">
                                    {opcion.nombre} <span className="text-muted-foreground">/ {opcion.propietario}</span>
                                </span>
                                {value?.id === opcion.id && <Check className="ml-2 h-4 w-4 shrink-0" />}
                            </button>
                        ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}
