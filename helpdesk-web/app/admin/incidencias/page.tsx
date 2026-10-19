
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Incidencia = {
    id: number;
    titulo: string;
    descripcion: string;
    prioridad: string;
    estado: string;
    fechaCreacion: string;
    tecnicoId: number | null;
};

type RespuestaPaginada = {
    pagina: number;
    tamanoPagina: number;
    totalRegistros: number;
    totalPaginas: number;
    datos: Incidencia[];
};

export default function IncidenciasPage() {
    const router = useRouter();

    // Incidencias
    const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    // Filtros
    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("Todos");
    const [filtroPrioridad, setFiltroPrioridad] = useState("Todas");

    // Paginación
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [totalRegistros, setTotalRegistros] = useState(0);

    const tamanoPagina = 10;

    useEffect(() => {
        const controlador = new AbortController();

        async function cargarIncidencias() {
            setCargando(true);
            setError("");

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
                    `${process.env.NEXT_PUBLIC_API_URL}/api/incidencias?pagina=${pagina}&tamanoPagina=${tamanoPagina}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        cache: "no-store",
                        signal: controlador.signal,
                    }
                );

                if (respuesta.status === 401 || respuesta.status === 403) {
                    sessionStorage.removeItem("helpdesk_token");
                    sessionStorage.removeItem("helpdesk_usuario");
                    router.replace("/");
                    return;
                }

                if (!respuesta.ok) {
                    throw new Error("No se pudieron cargar las incidencias");
                }

                const resultado: RespuestaPaginada =
                    await respuesta.json();

                if (!Array.isArray(resultado.datos)) {
                    throw new Error("La API devolvió un formato inesperado");
                }

                if (!controlador.signal.aborted) {
                    setIncidencias(resultado.datos);
                    setTotalPaginas(resultado.totalPaginas);
                    setTotalRegistros(resultado.totalRegistros);
                }
            } catch (err) {
                if (!controlador.signal.aborted) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Ocurrió un error inesperado"
                    );
                }
            } finally {
                if (!controlador.signal.aborted) {
                    setCargando(false);
                }
            }
        }

        cargarIncidencias();

        return () => controlador.abort();
    }, [router, pagina]);

    // Los filtros se aplican sobre la página cargada.
    const incidenciasFiltradas = incidencias.filter((incidencia) => {
        const coincideBusqueda = incidencia.titulo
            .toLowerCase()
            .includes(busqueda.toLowerCase());

        const coincideEstado =
            filtroEstado === "Todos" ||
            incidencia.estado === filtroEstado;

        const coincidePrioridad =
            filtroPrioridad === "Todas" ||
            incidencia.prioridad === filtroPrioridad;

        return (
            coincideBusqueda &&
            coincideEstado &&
            coincidePrioridad
        );
    });

    function paginaAnterior() {
        if (pagina > 1) {
            setPagina(pagina - 1);
        }
    }

    function paginaSiguiente() {
        if (pagina < totalPaginas) {
            setPagina(pagina + 1);
        }
    }

    return (
        <main className="min-h-screen bg-slate-100 p-5 text-slate-900 md:p-10">
            <div className="mx-auto max-w-7xl">
                {/* Volver al dashboard */}
                <button
                    onClick={() => router.push("/admin")}
                    className="mb-6 text-sm font-medium text-blue-600 hover:underline"
                >
                    ← Volver al dashboard
                </button>

                {/* Encabezado */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">
                        Gestión de incidencias
                    </h1>

                    <p className="mt-2 text-slate-500">
                        Consultá y filtrá los tickets registrados en el sistema.
                    </p>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    {/* Filtros */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-5">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Todas las incidencias
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Mostrando {incidenciasFiltradas.length} de{" "}
                                {incidencias.length} incidencias de esta página
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <input
                                type="text"
                                placeholder="Buscar por título..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-blue-500"
                            />

                            <select
                                value={filtroEstado}
                                onChange={(e) => setFiltroEstado(e.target.value)}
                                className="rounded-lg border border-slate-300 bg-white px-4 py-2"
                            >
                                <option value="Todos">Todos los estados</option>
                                <option value="Abierta">Abierta</option>
                                <option value="En progreso">En progreso</option>
                                <option value="Resuelta">Resuelta</option>
                                <option value="Cerrada">Cerrada</option>
                            </select>

                            <select
                                value={filtroPrioridad}
                                onChange={(e) => setFiltroPrioridad(e.target.value)}
                                className="rounded-lg border border-slate-300 bg-white px-4 py-2"
                            >
                                <option value="Todas">Todas las prioridades</option>
                                <option value="Alta">Alta</option>
                                <option value="Media">Media</option>
                                <option value="Baja">Baja</option>
                            </select>
                        </div>
                    </div>

                    {/* Contenido */}
                    {cargando ? (
                        <p className="p-6 text-slate-500">
                            Cargando incidencias...
                        </p>
                    ) : error ? (
                        <p className="p-6 text-red-600">{error}</p>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-500">
                                        <tr>
                                            <th className="px-5 py-4">ID</th>
                                            <th className="px-5 py-4">Título</th>
                                            <th className="px-5 py-4">Prioridad</th>
                                            <th className="px-5 py-4">Estado</th>
                                            <th className="px-5 py-4">Técnico</th>
                                            <th className="px-5 py-4">Fecha</th>
                                            <th className="px-5 py-4">Acciones</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                        {incidenciasFiltradas.map((incidencia) => (
                                            <tr
                                                key={incidencia.id}
                                                className="hover:bg-slate-50"
                                            >
                                                <td className="px-5 py-4 font-semibold">
                                                    #{incidencia.id}
                                                </td>

                                                <td className="px-5 py-4 font-medium">
                                                    {incidencia.titulo}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`rounded-lg px-3 py-1 text-xs font-semibold ${incidencia.prioridad === "Alta"
                                                                ? "bg-red-100 text-red-700"
                                                                : incidencia.prioridad === "Media"
                                                                    ? "bg-amber-100 text-amber-700"
                                                                    : "bg-green-100 text-green-700"
                                                            }`}
                                                    >
                                                        {incidencia.prioridad}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`rounded-lg px-3 py-1 text-xs font-semibold ${incidencia.estado === "Abierta"
                                                                ? "bg-amber-100 text-amber-700"
                                                                : incidencia.estado === "En progreso"
                                                                    ? "bg-blue-100 text-blue-700"
                                                                    : incidencia.estado === "Resuelta"
                                                                        ? "bg-green-100 text-green-700"
                                                                        : "bg-slate-100 text-slate-700"
                                                            }`}
                                                    >
                                                        {incidencia.estado}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    {incidencia.tecnicoId
                                                        ? `Técnico #${incidencia.tecnicoId}`
                                                        : "Sin asignar"}
                                                </td>

                                                <td className="px-5 py-4 text-slate-500">
                                                    {incidencia.fechaCreacion
                                                        ? new Date(
                                                            incidencia.fechaCreacion
                                                        ).toLocaleDateString("es-UY")
                                                        : "-"}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <button
                                                        onClick={() =>
                                                            router.push(`/admin/incidencias/${incidencia.id}`)
                                                        }
                                                        className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                                                    >
                                                        Ver detalles
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {incidenciasFiltradas.length === 0 && (
                                    <p className="p-6 text-center text-slate-500">
                                        No se encontraron incidencias en esta página.
                                    </p>
                                )}
                            </div>

                            {/* Paginación */}
                            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 p-5">
                                <p className="text-sm text-slate-500">
                                    Total de registros: {totalRegistros}
                                </p>

                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={paginaAnterior}
                                        disabled={pagina === 1}
                                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Anterior
                                    </button>

                                    <span className="text-sm font-medium">
                                        Página {pagina} de {totalPaginas}
                                    </span>

                                    <button
                                        onClick={paginaSiguiente}
                                        disabled={pagina >= totalPaginas}
                                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}
