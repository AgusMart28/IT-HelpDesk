
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Estadisticas = {
    totalIncidencias: number;
    abiertas: number;
    enProgreso: number;
    resueltas: number;
    cerradas: number;
    sinAsignar: number;
    totalTecnicos: number;
    totalUsuarios: number;
};

export default function AdminPage() {
    const router = useRouter();

    const [estadisticas, setEstadisticas] =
        useState<Estadisticas | null>(null);

    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function cargarEstadisticas() {
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

                const respuesta = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/estadisticas/resumen`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        cache: "no-store",
                    }
                );

                if (respuesta.status === 401 || respuesta.status === 403) {
                    sessionStorage.removeItem("helpdesk_token");
                    sessionStorage.removeItem("helpdesk_usuario");
                    router.replace("/");
                    return;
                }

                if (!respuesta.ok) {
                    throw new Error("No se pudieron cargar las estadísticas");
                }

                const datos: Estadisticas = await respuesta.json();

                setEstadisticas(datos);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Ocurrió un error inesperado"
                );
            } finally {
                setCargando(false);
            }
        }

        cargarEstadisticas();
    }, [router]);

    function cerrarSesion() {
        sessionStorage.removeItem("helpdesk_token");
        sessionStorage.removeItem("helpdesk_usuario");
        router.replace("/");
    }

    const tarjetas = estadisticas
        ? [
            {
                titulo: "Total de incidencias",
                valor: estadisticas.totalIncidencias,
                color: "bg-blue-100 text-blue-700",
            },
            {
                titulo: "Abiertas",
                valor: estadisticas.abiertas,
                color: "bg-amber-100 text-amber-700",
            },
            {
                titulo: "En progreso",
                valor: estadisticas.enProgreso,
                color: "bg-indigo-100 text-indigo-700",
            },
            {
                titulo: "Resueltas",
                valor: estadisticas.resueltas,
                color: "bg-green-100 text-green-700",
            },
            {
                titulo: "Cerradas",
                valor: estadisticas.cerradas,
                color: "bg-slate-200 text-slate-700",
            },
            {
                titulo: "Sin asignar",
                valor: estadisticas.sinAsignar,
                color: "bg-red-100 text-red-700",
            },
            {
                titulo: "Técnicos",
                valor: estadisticas.totalTecnicos,
                color: "bg-cyan-100 text-cyan-700",
            },
            {
                titulo: "Usuarios",
                valor: estadisticas.totalUsuarios,
                color: "bg-violet-100 text-violet-700",
            },
        ]
        : [];

    return (
        <div className="flex min-h-screen bg-slate-100 text-slate-900">
            {/* Menú lateral */}
            <aside className="hidden w-64 shrink-0 bg-slate-900 p-6 text-white md:flex md:flex-col">
                <div className="mb-10">
                    <h1 className="text-2xl font-bold">IT Help Desk</h1>
                    <p className="mt-1 text-sm text-slate-400">
                        Panel administrativo
                    </p>
                </div>

                <nav className="space-y-2">
                    <div className="rounded-lg bg-blue-600 px-4 py-3 font-medium">
                        Dashboard
                    </div>
                    <p className="px-4 pt-4 text-xs uppercase text-slate-500">
                        Próximamente
                    </p>
                    <button
                        onClick={() => router.push("/admin/incidencias")}
                        className="w-full rounded-lg px-4 py-2 text-left text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                        Incidencias
                    </button>
                    <button
                        onClick={() => router.push("/admin/tecnicos")}
                        className="w-full rounded-lg px-4 py-2 text-left text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                        Técnicos
                    </button>

                    <p className="px-4 py-2 text-slate-400">
                        Usuarios
                    </p>
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

            {/* Contenido principal */}
            <main className="min-w-0 flex-1 p-5 md:p-10">
                <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-sm text-slate-500">
                            Administración / Dashboard
                        </p>
                        <h2 className="mt-1 text-3xl font-bold">
                            Panel de administración
                        </h2>
                        <p className="mt-2 text-slate-500">
                            Resumen general de las incidencias del sistema.
                        </p>
                    </div>

                    <button
                        onClick={cerrarSesion}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50 md:hidden"
                    >
                        Cerrar sesión
                    </button>
                </header>

                {cargando && (
                    <p className="text-slate-500">
                        Cargando estadísticas...
                    </p>
                )}

                {error && (
                    <div className="rounded-lg bg-red-50 p-4 text-red-700">
                        {error}
                    </div>
                )}

                {estadisticas && (
                    <>
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                            {tarjetas.map((tarjeta) => (
                                <div
                                    key={tarjeta.titulo}
                                    className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                                >
                                    <p className="text-sm font-medium text-slate-500">
                                        {tarjeta.titulo}
                                    </p>

                                    <div className="mt-4 flex items-center justify-between">
                                        <p className="text-4xl font-bold">
                                            {tarjeta.valor}
                                        </p>

                                        <span
                                            className={`rounded-lg px-3 py-2 text-sm font-semibold ${tarjeta.color}`}
                                        >
                                            {tarjeta.valor}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h3 className="text-xl font-semibold">
                                Estado general del servicio
                            </h3>

                            <p className="mt-2 text-slate-500">
                                Distribución de incidencias según su estado.
                            </p>

                            <div className="mt-6 space-y-5">
                                {[
                                    {
                                        nombre: "Abiertas",
                                        valor: estadisticas.abiertas,
                                        color: "bg-amber-500",
                                    },
                                    {
                                        nombre: "En progreso",
                                        valor: estadisticas.enProgreso,
                                        color: "bg-blue-500",
                                    },
                                    {
                                        nombre: "Resueltas",
                                        valor: estadisticas.resueltas,
                                        color: "bg-green-500",
                                    },
                                    {
                                        nombre: "Cerradas",
                                        valor: estadisticas.cerradas,
                                        color: "bg-slate-500",
                                    },
                                ].map((estado) => {
                                    const porcentaje =
                                        estadisticas.totalIncidencias > 0
                                            ? (estado.valor /
                                                estadisticas.totalIncidencias) *
                                            100
                                            : 0;

                                    return (
                                        <div key={estado.nombre}>
                                            <div className="mb-2 flex justify-between text-sm">
                                                <span className="font-medium">
                                                    {estado.nombre}
                                                </span>
                                                <span className="text-slate-500">
                                                    {estado.valor} ({porcentaje.toFixed(1)}%)
                                                </span>
                                            </div>

                                            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                                                <div
                                                    className={`h-full rounded-full ${estado.color}`}
                                                    style={{ width: `${porcentaje}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
