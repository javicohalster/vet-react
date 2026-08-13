import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User | null;
    roles: string[];
    permissions: string[];
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
    /** Permiso requerido para ver la entrada; si falta, se oculta. */
    permission?: string;
    items?: NavItem[];
}

export interface Flash {
    success?: string | null;
    error?: string | null;
    warning?: string | null;
}

export interface SharedData {
    name: string;
    auth: Auth;
    flash: Flash;
    [key: string]: unknown;
}

/** Usuario en sesión, tal como lo comparte HandleInertiaRequests. */
export interface User {
    id: number;
    username: string | null;
    nombres: string;
    apellidos: string;
    email: string;
    avatar?: string;
    telefono?: string | null;
    direccion?: string | null;
    genero?: string | null;
    nacimiento?: string | null;
    [key: string]: unknown;
}

/** Enlace de paginación de Laravel. */
export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

/** Respuesta paginada de Laravel (length aware paginator). */
export interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    from: number | null;
    to: number | null;
    total: number;
    links: PaginationLink[];
}

/** Opción simple para selects. */
export interface Opcion {
    id: number;
    nombre: string;
}
