import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { CalendarDays, FlaskConical, FolderOpen, LayoutGrid, PawPrint, Settings, Stethoscope, Wrench } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Inicio',
        url: '/',
        icon: LayoutGrid,
    },
    {
        title: 'Pacientes',
        url: '/pacientes',
        icon: PawPrint,
        permission: 'leer-pacientes',
    },
    {
        title: 'Documentos',
        url: '/documentos-pacientes',
        icon: FolderOpen,
        permission: 'leer-pacientes',
    },
    {
        title: 'Siguientes Citas',
        url: '/revisar',
        icon: CalendarDays,
        permission: 'leer-pacientes',
    },
    {
        title: 'Consultas Médicas',
        url: '/consultas',
        icon: Stethoscope,
        permission: 'leer-citas',
    },
    {
        title: 'Laboratorio',
        url: '/laboratorio',
        icon: FlaskConical,
        permission: 'leer-laboratorio',
    },
    {
        title: 'Mantenimiento',
        url: '#',
        icon: Wrench,
        permission: 'leer-mantenimientos',
        items: [
            { title: 'Doctores', url: '/doctores', permission: 'leer-doctores' },
            { title: 'Recepcionistas', url: '/recepcionistas', permission: 'leer-recepcionistas' },
            { title: 'Especialidades', url: '/especialidades', permission: 'leer-especialidades' },
            { title: 'Vacunas', url: '/vacunas', permission: 'leer-vacunas' },
        ],
    },
    {
        title: 'Configuración',
        url: '#',
        icon: Settings,
        permission: 'leer-configuraciones',
        items: [
            { title: 'Clínica', url: '/clinica', permission: 'leer-clinicas' },
            { title: 'Personas', url: '/personas', permission: 'leer-personas' },
            { title: 'Roles', url: '/roles', permission: 'leer-roles' },
            { title: 'Permisos', url: '/permisos', permission: 'leer-permisos' },
        ],
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
