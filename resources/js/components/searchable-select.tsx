import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

interface SearchableSelectProps {
    value: string;
    onChange: (valor: string) => void;
    opciones: string[];
    placeholder?: string;
    disabled?: boolean;
}

/**
 * Combo con buscador para listas largas (el `<Select>` normal no tiene
 * forma de filtrar y obliga a desplazarse). Mismo patrón que el buscador
 * de pacientes (Popover + input), incluido su arreglo de foco cuando vive
 * dentro de un Dialog modal.
 */
export function SearchableSelect({ value, onChange, opciones, placeholder = 'Selecciona...', disabled }: SearchableSelectProps) {
    const [abierto, setAbierto] = useState(false);
    const [termino, setTermino] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const filtradas = useMemo(
        () => (termino ? opciones.filter((o) => o.toLowerCase().includes(termino.toLowerCase())) : opciones),
        [opciones, termino],
    );

    return (
        <Popover
            open={abierto}
            onOpenChange={(valor) => {
                setAbierto(valor);
                if (!valor) setTermino('');
            }}
        >
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
                    <span className="truncate">{value || placeholder}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                    placeholder="Buscar..."
                    className="mb-2"
                />

                <div className="max-h-56 overflow-y-auto">
                    {filtradas.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">Sin resultados.</p>}

                    {filtradas.map((opcion) => (
                        <button
                            key={opcion}
                            type="button"
                            onClick={() => {
                                onChange(opcion);
                                setAbierto(false);
                                setTermino('');
                            }}
                            className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                        >
                            <span className="truncate">{opcion}</span>
                            {value === opcion && <Check className="ml-2 h-4 w-4 shrink-0" />}
                        </button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}
