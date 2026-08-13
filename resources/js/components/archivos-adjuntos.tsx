import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import axios from '@/lib/http';
import { router } from '@inertiajs/react';
import { Download, FileArchive, FileText, Loader2, Trash2, UploadCloud } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export interface Archivo {
    id: number;
    nombre: string;
    extension: string;
    esImagen: boolean;
    esVideo: boolean;
    esPdf: boolean;
    subido: string;
    url: string;
}

interface ArchivosAdjuntosProps {
    /** Id de la consulta (`queries.id`) a la que se adjuntan los archivos. */
    queryId: number;
    ayuda?: string;
    accept?: string;
}

/**
 * Panel de subir / previsualizar / descargar / eliminar archivos de una
 * consulta. Usa el mismo endpoint `/documentos/*` sea cual sea el módulo que
 * lo incruste (Documentos, Laboratorio, etc.), así que todo lo que se sube
 * aparece automáticamente en Documentos sin lógica adicional.
 */
export function ArchivosAdjuntos({
    queryId,
    ayuda = 'PDF, Word, imágenes o video. Tamaño máximo 50 MB.',
    accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.bmp,.mp4,.avi,.mov,.webm,.ogg',
}: ArchivosAdjuntosProps) {
    const [cargando, setCargando] = useState(false);
    const [archivos, setArchivos] = useState<Archivo[]>([]);
    const [subiendo, setSubiendo] = useState(false);
    const [error, setError] = useState<string | undefined>();
    const inputRef = useRef<HTMLInputElement>(null);

    const cargar = () => {
        setCargando(true);
        axios
            .get(`/documentos/${queryId}`)
            .then((res) => setArchivos(res.data.archivos))
            .finally(() => setCargando(false));
    };

    useEffect(() => {
        cargar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryId]);

    const subirArchivo = (archivo: File) => {
        setSubiendo(true);
        setError(undefined);

        router.post(
            `/documentos/${queryId}`,
            { archivo },
            {
                forceFormData: true,
                preserveScroll: true,
                onError: (err) => setError(err.archivo),
                onSuccess: () => {
                    toast.success('El archivo se subió correctamente.');
                    cargar();
                },
                onFinish: () => {
                    setSubiendo(false);
                    if (inputRef.current) inputRef.current.value = '';
                },
            },
        );
    };

    const eliminarArchivo = (archivo: Archivo) => {
        router.delete(`/documentos/archivo/${archivo.id}`, {
            preserveScroll: true,
            onSuccess: () => cargar(),
        });
    };

    return (
        <div className="space-y-4">
            <div className="rounded-lg border border-dashed p-4 text-center">
                <UploadCloud className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">{ayuda}</p>
                <Input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    disabled={subiendo}
                    onChange={(e) => e.target.files?.[0] && subirArchivo(e.target.files[0])}
                />
                <InputError message={error} className="mt-2" />
                {subiendo && (
                    <p className="mt-2 flex items-center justify-center gap-1 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Subiendo...
                    </p>
                )}
            </div>

            {cargando ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <>
                    {archivos.length > 0 && (
                        <div className="flex justify-end">
                            <Button size="sm" variant="outline" asChild>
                                <a href={`/documentos/${queryId}/zip`}>
                                    <FileArchive className="h-4 w-4" /> Descargar todo en ZIP
                                </a>
                            </Button>
                        </div>
                    )}

                    <div className="space-y-3">
                        {archivos.length === 0 && <p className="py-8 text-center text-muted-foreground">No hay documentos cargados.</p>}

                        {archivos.map((archivo) => (
                            <div key={archivo.id} className="rounded-lg border p-3">
                                <div className="mb-2 flex items-center justify-between gap-2">
                                    <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                                        <FileText className="h-4 w-4 shrink-0" />
                                        {archivo.nombre}
                                    </p>
                                    <div className="flex shrink-0 gap-1">
                                        <Button size="icon" variant="ghost" asChild title="Descargar">
                                            <a href={`${archivo.url}?descargar=1`}>
                                                <Download className="h-4 w-4" />
                                            </a>
                                        </Button>
                                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => eliminarArchivo(archivo)} title="Eliminar">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {archivo.esImagen && <img src={archivo.url} alt={archivo.nombre} className="max-h-64 rounded border" />}
                                {archivo.esVideo && (
                                    <video controls className="max-h-64 w-full rounded border">
                                        <source src={archivo.url} />
                                    </video>
                                )}
                                {archivo.esPdf && <iframe src={archivo.url} className="h-64 w-full rounded border" title={archivo.nombre} />}
                                {!archivo.esImagen && !archivo.esVideo && !archivo.esPdf && (
                                    <p className="text-sm text-muted-foreground">Sin vista previa disponible para este tipo de archivo.</p>
                                )}

                                <p className="mt-1 text-xs text-muted-foreground">Subido el {archivo.subido}</p>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
