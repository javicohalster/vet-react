import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInitials } from '@/hooks/use-initials';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { Loader2 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Mis datos', href: '/settings/profile' }];

export default function Profile({ status }: { status?: string }) {
    const { auth } = usePage<SharedData>().props;
    const usuario = auth.user!;
    const getInitials = useInitials();
    const inputAvatarRef = useRef<HTMLInputElement>(null);
    const [subiendoAvatar, setSubiendoAvatar] = useState(false);
    const nombreCompleto = `${usuario.nombres} ${usuario.apellidos}`.trim();
    const avatarUrl = usuario.avatar && usuario.avatar !== 'default.jpg' ? `/assets/img/perfiles/${usuario.avatar}` : undefined;

    const subirAvatar = (archivo: File) => {
        setSubiendoAvatar(true);
        router.post(
            route('avatar.store'),
            { avatar: archivo },
            {
                forceFormData: true,
                preserveScroll: true,
                onFinish: () => {
                    setSubiendoAvatar(false);
                    if (inputAvatarRef.current) inputAvatarRef.current.value = '';
                },
            },
        );
    };

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        email: usuario.email,
        telefono: usuario.telefono ?? '',
        direccion: usuario.direccion ?? '',
        genero: usuario.genero ?? '',
        nacimiento: usuario.nacimiento ?? '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mis datos" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Mis datos" description="Actualiza tu información de contacto" />

                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={avatarUrl} alt={nombreCompleto} />
                            <AvatarFallback className="text-lg">{getInitials(nombreCompleto)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <input
                                ref={inputAvatarRef}
                                type="file"
                                accept="image/jpeg,image/png,image/bmp"
                                className="hidden"
                                onChange={(e) => e.target.files?.[0] && subirAvatar(e.target.files[0])}
                            />
                            <Button type="button" variant="outline" size="sm" disabled={subiendoAvatar} onClick={() => inputAvatarRef.current?.click()}>
                                {subiendoAvatar && <Loader2 className="h-4 w-4 animate-spin" />}
                                Cambiar foto
                            </Button>
                        </div>
                    </div>

                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="nombres">Nombres</Label>
                                <Input id="nombres" value={data.nombres} onChange={(e) => setData('nombres', e.target.value)} required />
                                <InputError message={errors.nombres} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="apellidos">Apellidos</Label>
                                <Input id="apellidos" value={data.apellidos} onChange={(e) => setData('apellidos', e.target.value)} required />
                                <InputError message={errors.apellidos} />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">Correo electrónico</Label>
                            <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} required />
                            <InputError message={errors.email} />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="telefono">Teléfono</Label>
                                <Input id="telefono" value={data.telefono} onChange={(e) => setData('telefono', e.target.value)} required />
                                <InputError message={errors.telefono} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="nacimiento">Fecha de nacimiento</Label>
                                <Input
                                    id="nacimiento"
                                    type="date"
                                    value={data.nacimiento}
                                    onChange={(e) => setData('nacimiento', e.target.value)}
                                    required
                                />
                                <InputError message={errors.nacimiento} />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="genero">Género</Label>
                                <Select value={data.genero} onValueChange={(valor) => setData('genero', valor)}>
                                    <SelectTrigger id="genero">
                                        <SelectValue placeholder="Selecciona" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Masculino">Masculino</SelectItem>
                                        <SelectItem value="Femenino">Femenino</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.genero} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="direccion">Dirección</Label>
                                <Input id="direccion" value={data.direccion} onChange={(e) => setData('direccion', e.target.value)} required />
                                <InputError message={errors.direccion} />
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <Button disabled={processing}>Guardar</Button>

                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-neutral-600">Guardado</p>
                            </Transition>
                        </div>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
