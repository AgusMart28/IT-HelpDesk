"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Tecnico = {
    id: number;
    nombre: string;
    email: string;
    especialidad: string;
};

export default function TecnicosAdminPage() {
    const router = useRouter();

    const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");

    const [nombre, setNombre] = useState("");
    const [email, setEmail] = useState("");
    const [especialidad, setEspecialidad] = useState("");
    const [tecnicoEditando, setTecnicoEditando] = useState<number | null>(null);
    const [tecnicoCuenta, setTecnicoCuenta] = useState<Tecnico | null>(null);
    const [passwordCuenta, setPasswordCuenta] = useState("");
    const [creandoCuenta, setCreandoCuenta] = useState(false);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    useEffect(() => {
        async function cargarTecnicos() {
            const token = sessionStorage.getItem("helpdesk_token");
            const usuario = sessionStorage.getItem("helpdesk_usuario");

            if (!token || !usuario) {
                router.replace("/");
                return;
            }

            try {
                const perfil = JSON.parse(usuario);

                if ((perfil.rol ?? perfil.role) !== "Administrador") {
                    router.replace("/");
                    return;
                }

                const respuesta = await fetch(`${apiUrl}/api/tecnicos`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    cache: "no-store",
                });

                if (respuesta.status === 401 || respuesta.status === 403) {
                    router.replace("/");
                    return;
                }

                if (!respuesta.ok) {
                    throw new Error("No se pudieron cargar los técnicos");
                }

                const datos: Tecnico[] = await respuesta.json();
                setTecnicos(datos);
            } catch {
                setError("Ocurrió un error al cargar los técnicos");
            } finally {
                setCargando(false);
            }
        }

        cargarTecnicos();
    }, [router, apiUrl]);

    async function crearTecnico(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        setError("");
        setMensaje("");
        setGuardando(true);

        try {
            const token = sessionStorage.getItem("helpdesk_token");

            if (!token) {
                router.replace("/");
                return;
            }

            const esEdicion = tecnicoEditando !== null;
            const respuesta = await fetch(
                esEdicion
                    ? `${apiUrl}/api/tecnicos/${tecnicoEditando}`
                    : `${apiUrl}/api/tecnicos`,
                {
                    method: esEdicion ? "PUT" : "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        nombre: nombre.trim(),
                        email: email.trim(),
                        especialidad: especialidad.trim(),
                    }),
                }
            );

            if (respuesta.status === 401 || respuesta.status === 403) {
                throw new Error("Tu sesión no tiene permisos. Volvé a iniciar sesión.");
            }
            if (respuesta.status === 409) {
                throw new Error("Ya existe otro técnico con ese correo");
            }
            if (!respuesta.ok) {
                throw new Error("No se pudo guardar el técnico");
            }

            const tecnicoGuardado: Tecnico = await respuesta.json();
            setTecnicos((actuales) => {
                const lista = esEdicion
                    ? actuales.map((tecnico) =>
                        tecnico.id === tecnicoEditando ? tecnicoGuardado : tecnico
                    )
                    : [...actuales, tecnicoGuardado];
                return lista.sort((a, b) => a.nombre.localeCompare(b.nombre));
            });

            setNombre("");
            setEmail("");
            setEspecialidad("");
            setTecnicoEditando(null);
            setMensaje(esEdicion ? "Técnico actualizado correctamente" : "Técnico registrado correctamente");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Ocurrió un error inesperado"
            );
        } finally {
            setGuardando(false);
        }
    }
    function seleccionarTecnico(tecnico: Tecnico) {
        setTecnicoEditando(tecnico.id);
        setNombre(tecnico.nombre);
        setEmail(tecnico.email);
        setEspecialidad(tecnico.especialidad);
        setError("");
        setMensaje("");

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function cancelarEdicion() {
        setTecnicoEditando(null);
        setNombre("");
        setEmail("");
        setEspecialidad("");
    }

    async function eliminarTecnico(tecnico: Tecnico) {
        const confirmado = window.confirm(
            `¿Estás seguro de que querés eliminar a ${tecnico.nombre}?`
        );

        if (!confirmado) return;

        setError("");
        setMensaje("");

        try {
            const token = sessionStorage.getItem("helpdesk_token");

            if (!token) {
                router.replace("/");
                return;
            }

            const respuesta = await fetch(
                `${apiUrl}/api/tecnicos/${tecnico.id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (respuesta.status === 409) {
                throw new Error(
                    "No se puede eliminar el técnico porque tiene incidencias asignadas."
                );
            }

            if (!respuesta.ok) {
                throw new Error("No se pudo eliminar el técnico");
            }

            setTecnicos((actuales) =>
                actuales.filter((t) => t.id !== tecnico.id)
            );

            if (tecnicoEditando === tecnico.id) {
                cancelarEdicion();
            }

            setMensaje("Técnico eliminado correctamente");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Ocurrió un error inesperado"
            );
        }
    }

    async function crearCuentaTecnico(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!tecnicoCuenta) return;

        setError("");
        setMensaje("");
        setCreandoCuenta(true);

        try {
            const token = sessionStorage.getItem("helpdesk_token");

            if (!token) {
                router.replace("/");
                return;
            }

            const respuesta = await fetch(
                `${apiUrl}/api/admin/usuarios/crear-cuenta-tecnico`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        tecnicoId: tecnicoCuenta.id,
                        password: passwordCuenta,
                    }),
                }
            );

            if (!respuesta.ok) {
                if (respuesta.status === 409) {
                    throw new Error(
                        "El técnico ya tiene una cuenta vinculada o existe un usuario con ese correo."
                    );
                }

                if (respuesta.status === 400) {
                    throw new Error("Revisá los datos de la cuenta.");
                }

                throw new Error("No se pudo crear la cuenta del técnico.");
            }

            setMensaje(
                `Cuenta creada correctamente para ${tecnicoCuenta.nombre}.`
            );

            setTecnicoCuenta(null);
            setPasswordCuenta("");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Ocurrió un error inesperado"
            );
        } finally {
            setCreandoCuenta(false);
        }
    }

    function cerrarSesion() {
        sessionStorage.removeItem("helpdesk_token");
        sessionStorage.removeItem("helpdesk_usuario");
        router.replace("/");
    }

    return (
        <div className="flex min-h-screen bg-slate-100 text-slate-900">
            <aside className="hidden w-64 shrink-0 bg-slate-900 p-6 text-white md:flex md:flex-col">
                <div className="mb-10">
                    <h1 className="text-2xl font-bold">IT Help Desk</h1>
                    <p className="mt-1 text-sm text-slate-400">
                        Panel administrativo
                    </p>
                </div>

                <nav className="space-y-2">
                    <button
                        onClick={() => router.push("/admin")}
                        className="w-full rounded-lg px-4 py-2 text-left text-slate-300 hover:bg-slate-800"
                    >
                        Dashboard
                    </button>

                    <button
                        onClick={() => router.push("/admin/incidencias")}
                        className="w-full rounded-lg px-4 py-2 text-left text-slate-300 hover:bg-slate-800"
                    >
                        Incidencias
                    </button>

                    <div className="rounded-lg bg-blue-600 px-4 py-3 font-medium">
                        Técnicos
                    </div>
                </nav>

                <div className="mt-auto pt-10">
                    <button
                        onClick={cerrarSesion}
                        className="w-full rounded-lg bg-slate-800 px-4 py-3 text-left hover:bg-slate-700"
                    >
                        Cerrar sesión
                    </button>
                </div>
            </aside>

            <main className="min-w-0 flex-1 p-5 md:p-10">
                <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-sm text-slate-500">
                            Administración / Técnicos
                        </p>
                        <h2 className="mt-1 text-3xl font-bold">
                            Gestión de técnicos
                        </h2>
                        <p className="mt-2 text-slate-500">
                            Registrá y consultá los técnicos del sistema.
                        </p>
                    </div>

                    <button
                        onClick={() => router.push("/admin")}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50"
                    >
                        Volver al panel
                    </button>
                </header>

                {error && (
                    <div className="mb-5 rounded-lg bg-red-50 p-4 text-red-700">
                        {error}
                    </div>
                )}

                {mensaje && (
                    <div className="mb-5 rounded-lg bg-green-50 p-4 text-green-700">
                        {mensaje}
                    </div>
                )}
                {tecnicoCuenta && (
                    <section className="mb-8 rounded-xl border border-green-200 bg-white p-6 shadow-sm">
                        <h3 className="text-xl font-semibold">
                            Crear cuenta para {tecnicoCuenta.nombre}
                        </h3>

                        <p className="mt-2 text-sm text-slate-500">
                            Correo: {tecnicoCuenta.email}
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                            Esta cuenta tendrá el rol Técnico y quedará vinculada
                            automáticamente.
                        </p>

                        <form
                            onSubmit={crearCuentaTecnico}
                            className="mt-5 space-y-4"
                        >
                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Contraseña inicial
                                </label>

                                <input
                                    type="password"
                                    value={passwordCuenta}
                                    onChange={(e) => setPasswordCuenta(e.target.value)}
                                    required
                                    minLength={8}
                                    maxLength={128}
                                    autoComplete="new-password"
                                    className="w-full max-w-md rounded-lg border border-slate-300 px-4 py-3"
                                    placeholder="Mínimo 8 caracteres"
                                />
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="submit"
                                    disabled={creandoCuenta}
                                    className="rounded-lg bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700 disabled:opacity-50"
                                >
                                    {creandoCuenta
                                        ? "Creando cuenta..."
                                        : "Confirmar creación"}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setTecnicoCuenta(null);
                                        setPasswordCuenta("");
                                    }}
                                    className="rounded-lg border border-slate-300 px-6 py-3 hover:bg-slate-50"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </section>
                )}
                <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-5 text-xl font-semibold">
                        {tecnicoEditando === null ? "Registrar nuevo técnico" : "Editar técnico"}
                    </h3>

                    <form
                        onSubmit={crearTecnico}
                        className="grid grid-cols-1 gap-4 md:grid-cols-3"
                    >
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Nombre completo
                            </label>
                            <input
                                type="text"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                required
                                minLength={3}
                                maxLength={100}
                                className="w-full rounded-lg border border-slate-300 px-4 py-3"
                                placeholder="Ej: Juan Pérez"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Correo electrónico
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full rounded-lg border border-slate-300 px-4 py-3"
                                placeholder="juan@empresa.com"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Especialidad
                            </label>
                            <input
                                type="text"
                                value={especialidad}
                                onChange={(e) => setEspecialidad(e.target.value)}
                                required
                                minLength={3}
                                maxLength={100}
                                className="w-full rounded-lg border border-slate-300 px-4 py-3"
                                placeholder="Ej: Redes y servidores"
                            />
                        </div>

                        <div className="md:col-span-3">
                            <button
                                type="submit"
                                disabled={guardando}
                                className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                                {guardando
                                    ? "Guardando..."
                                    : tecnicoEditando === null
                                        ? "Registrar técnico"
                                        : "Guardar cambios"}
                            </button>
                            {tecnicoEditando !== null && (
                                <button
                                    type="button"
                                    onClick={cancelarEdicion}
                                    disabled={guardando}
                                    className="ml-3 rounded-lg border border-slate-300 px-6 py-3 hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                            )}
                        </div>
                    </form>
                </section>

                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 p-6">
                        <h3 className="text-xl font-semibold">
                            Técnicos registrados
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                            Total: {tecnicos.length}
                        </p>
                    </div>

                    {cargando ? (
                        <p className="p-6 text-slate-500">
                            Cargando técnicos...
                        </p>
                    ) : tecnicos.length === 0 ? (
                        <p className="p-6 text-slate-500">
                            Todavía no hay técnicos registrados.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-600">
                                    <tr>
                                        <th className="px-6 py-4">ID</th>
                                        <th className="px-6 py-4">Nombre</th>
                                        <th className="px-6 py-4">Email</th>
                                        <th className="px-6 py-4">Especialidad</th>
                                        <th className="px-6 py-4">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tecnicos.map((tecnico) => (
                                        <tr
                                            key={tecnico.id}
                                            className="border-t border-slate-100"
                                        >
                                            <td className="px-6 py-4">{tecnico.id}</td>
                                            <td className="px-6 py-4 font-medium">
                                                {tecnico.nombre}
                                            </td>
                                            <td className="px-6 py-4">{tecnico.email}</td>
                                            <td className="px-6 py-4">
                                                {tecnico.especialidad}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    type="button"
                                                    onClick={() => seleccionarTecnico(tecnico)}
                                                    className="rounded-lg bg-blue-50 px-4 py-2 font-medium text-blue-700 hover:bg-blue-100"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => eliminarTecnico(tecnico)}
                                                    className="ml-2 rounded-lg bg-red-50 px-4 py-2 font-medium text-red-700 hover:bg-red-100"
                                                >
                                                    Eliminar
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setTecnicoCuenta(tecnico);
                                                        setPasswordCuenta("");
                                                        setError("");
                                                        setMensaje("");
                                                    }}
                                                    className="ml-2 rounded-lg bg-green-50 px-4 py-2 font-medium text-green-700 hover:bg-green-100"
                                                >
                                                    Crear cuenta
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}