import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';

/** Traduce los mensajes flash de sesión (success/error/warning) a toasts. */
export function FlashToaster() {
    const { flash } = usePage<SharedData>().props;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
    }, [flash?.success]);

    useEffect(() => {
        if (flash?.error) toast.error(flash.error);
    }, [flash?.error]);

    useEffect(() => {
        if (flash?.warning) toast.warning(flash.warning);
    }, [flash?.warning]);

    return null;
}
