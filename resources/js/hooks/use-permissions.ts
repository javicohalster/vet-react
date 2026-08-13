import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

/**
 * Acceso a los roles y permisos del usuario en sesión, equivalente a las
 * directivas @permission / @role de Blade del sistema anterior.
 */
export function usePermissions() {
    const { auth } = usePage<SharedData>().props;

    const permissions = auth?.permissions ?? [];
    const roles = auth?.roles ?? [];

    /** ¿Tiene al menos uno de los permisos indicados? */
    const can = (...required: string[]) => required.some((permission) => permissions.includes(permission));

    /** ¿Tiene al menos uno de los roles indicados? */
    const is = (...required: string[]) => required.some((role) => roles.includes(role));

    return { can, is, permissions, roles, user: auth?.user ?? null };
}
