import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { usePermissions } from '@/hooks/use-permissions';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';

/** Menú principal, equivalente a layouts/sidebar.blade.php del sistema anterior. */
export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage();
    const { can } = usePermissions();

    const visibles = items.filter((item) => !item.permission || can(item.permission));

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Gevets</SidebarGroupLabel>
            <SidebarMenu>
                {visibles.map((item) =>
                    item.items && item.items.length > 0 ? (
                        <GrupoDesplegable key={item.title} item={item} currentUrl={page.url} />
                    ) : (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild isActive={esActivo(item.url, page.url)}>
                                <Link href={item.url} prefetch>
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ),
                )}
            </SidebarMenu>
        </SidebarGroup>
    );
}

function GrupoDesplegable({ item, currentUrl }: { item: NavItem; currentUrl: string }) {
    const { can } = usePermissions();
    const subItems = (item.items ?? []).filter((sub) => !sub.permission || can(sub.permission));

    if (subItems.length === 0) {
        return null;
    }

    const activo = subItems.some((sub) => esActivo(sub.url, currentUrl));

    return (
        <Collapsible asChild defaultOpen={activo} className="group/collapsible">
            <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title} isActive={activo}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <SidebarMenuSub>
                        {subItems.map((sub) => (
                            <SidebarMenuSubItem key={sub.title}>
                                <SidebarMenuSubButton asChild isActive={esActivo(sub.url, currentUrl)}>
                                    <Link href={sub.url} prefetch>
                                        <span>{sub.title}</span>
                                    </Link>
                                </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                        ))}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </SidebarMenuItem>
        </Collapsible>
    );
}

function esActivo(url: string, currentUrl: string): boolean {
    return url !== '/' && currentUrl.startsWith(url);
}
