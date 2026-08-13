import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmDeleteDialogProps {
    abierto: boolean;
    onOpenChange: (abierto: boolean) => void;
    titulo?: string;
    descripcion?: string;
    onConfirmar: () => void;
}

/** Diálogo de confirmación reutilizado en todos los módulos con "Eliminar". */
export function ConfirmDeleteDialog({
    abierto,
    onOpenChange,
    titulo = '¿Eliminar este registro?',
    descripcion = 'Esta acción no se puede deshacer.',
    onConfirmar,
}: ConfirmDeleteDialogProps) {
    return (
        <AlertDialog open={abierto} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{titulo}</AlertDialogTitle>
                    <AlertDialogDescription>{descripcion}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={onConfirmar}
                    >
                        Eliminar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
