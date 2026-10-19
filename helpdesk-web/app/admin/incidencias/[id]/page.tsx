
"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

// Datos de la incidencia
type IncidenciaDetalle = {
    id: number;
    titulo: string;
    descripcion: string;
    prioridad: string;
    estado: string;
    fechaCreacion: string;
    tecnicoId: number | null;
    tecnicoNombre: string | null;
    usuarioCreadorId: number;
    usuarioCreadorNombre: string;
};

// Datos del historial
type HistorialEstado = {
    id: number;
    incidenciaId: number;
    usuarioNombre: string;
    estadoAnterior: string;
    estadoNuevo: string;
    fechaCambio: string;
};

type Comentario = {
    id: number;
    incidenciaId: number;
    usuarioId: number;
    usuarioNombre: string;
    mensaje: string;
    fechaCreacion: string;
};

type Tecnico = {
    id: number;
    nombre: string;
    email: string;
    especialidad: string | null;
};

function DetalleIncidenciaContenido() {
    const router = useRouter();
    const params = useParams<{ id: string }>();

    const [estadoSeleccionado, setEstadoSeleccionado] = useState("");
    const [guardandoEstado, setGuardandoEstado] = useState(false);
    const [errorEstado, setErrorEstado] = useState("");
    const [mensajeEstado, setMensajeEstado] = useState("");

    const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
    const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState("");
    const [cargandoTecnicos, setCargandoTecnicos] = useState(true);
    const [guardandoTecnico, setGuardandoTecnico] = useState(false);
    const [errorTecnico, setErrorTecnico] = useState("");
    const [mensajeTecnico, setMensajeTecnico] = useState("");

    // Estados de la incidencia
    const [incidencia, setIncidencia] =
        useState<IncidenciaDetalle | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    // Estados del historial
    const [historial, setHistorial] = useState<HistorialEstado[]>([]);
    const [cargandoHistorial, setCargandoHistorial] = useState(true);
    const [errorHistorial, setErrorHistorial] = useState("");

    const [comentarios, setComentarios] = useState<Comentario[]>([]);
    const [cargandoComentarios, setCargandoComentarios] = useState(true);
    const [errorComentarios, setErrorComentarios] = useState("");
    const [nuevoComentario, setNuevoComentario] = useState("");
    const [enviandoComentario, setEnviandoComentario] = useState(false);
    const [errorEnvio, setErrorEnvio] = useState("");

    // 1. Cargar detalles de la incidencia
    useEffect(() => {
        const controlador = new AbortController();

        async function cargarDetalle() {
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
                    `${process.env.NEXT_PUBLIC_API_URL}/api/incidencias/${params.id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        cache: "no-store",
                        signal: controlador.signal,
                    }
                );

                if (respuesta.status === 401 || respuesta.status === 403) {
                    router.replace("/");
                    return;
                }

                if (respuesta.status === 404) {
                    throw new Error("La incidencia no existe");
                }

                if (!respuesta.ok) {
                    throw new Error("No se pudo cargar la incidencia");
                }

                const datos: IncidenciaDetalle = await respuesta.json();

                if (!controlador.signal.aborted) {
                    setIncidencia(datos);
                    setEstadoSeleccionado(datos.estado);
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

        cargarDetalle();

        return () => controlador.abort();
    }, [params.id, router]);

    // 2. Cargar historial de estados
    useEffect(() => {
        const controlador = new AbortController();

        async function cargarHistorial() {
            const token = sessionStorage.getItem("helpdesk_token");

            if (!token) {
                setCargandoHistorial(false);
                return;
            }

            try {
                const respuesta = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/incidencias/${params.id}/historial`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        cache: "no-store",
                        signal: controlador.signal,
                    }
                );

                if (!respuesta.ok) {
                    throw new Error("No se pudo cargar el historial");
                }

                const datos: HistorialEstado[] = await respuesta.json();

                if (!Array.isArray(datos)) {
                    throw new Error("El historial tiene un formato inesperado");
                }

                if (!controlador.signal.aborted) {
                    setHistorial(datos);
                }
            } catch (err) {
                if (!controlador.signal.aborted) {
                    setErrorHistorial(
                        err instanceof Error
                            ? err.message
                            : "Error al consultar el historial"
                    );
                }
            } finally {
                if (!controlador.signal.aborted) {
                    setCargandoHistorial(false);
                }
            }
        }

        cargarHistorial();

        return () => controlador.abort();
    }, [params.id]);


    useEffect(() => {
        const controlador = new AbortController();

        async function cargarComentarios() {
            const token = sessionStorage.getItem("helpdesk_token");

            if (!token) {
                setCargandoComentarios(false);
                return;
            }

            try {
                const respuesta = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/incidencias/${params.id}/comentarios`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        cache: "no-store",
                        signal: controlador.signal,
                    }
                );

                if (!respuesta.ok) {
                    throw new Error("No se pudieron cargar los comentarios");
                }

                const datos: Comentario[] = await respuesta.json();

                if (!Array.isArray(datos)) {
                    throw new Error("Formato de comentarios inesperado");
                }

                if (!controlador.signal.aborted) {
                    setComentarios(datos);
                }
            } catch (err) {
                if (!controlador.signal.aborted) {
                    setErrorComentarios(
                        err instanceof Error
                            ? err.message
                            : "Error al cargar comentarios"
                    );
                }
            } finally {
                if (!controlador.signal.aborted) {
                    setCargandoComentarios(false);
                }
            }
        }

        cargarComentarios();

        return () => controlador.abort();
    }, [params.id]);


    useEffect(() => {
        const controlador = new AbortController();

        async function cargarTecnicos() {
            const token = sessionStorage.getItem("helpdesk_token");

            if (!token) {
                setCargandoTecnicos(false);
                return;
            }

            try {
                const respuesta = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/tecnicos`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        cache: "no-store",
                        signal: controlador.signal,
                    }
                );

                if (!respuesta.ok) {
                    throw new Error("No se pudieron cargar los técnicos");
                }

                const datos: Tecnico[] = await respuesta.json();

                if (!Array.isArray(datos)) {
                    throw new Error("Formato de técnicos inesperado");
                }

                if (!controlador.signal.aborted) {
                    setTecnicos(datos);
                }
            } catch (err) {
                if (!controlador.signal.aborted) {
                    setErrorTecnico(
                        err instanceof Error
                            ? err.message
                            : "Error al cargar los técnicos"
                    );
                }
            } finally {
                if (!controlador.signal.aborted) {
                    setCargandoTecnicos(false);
                }
            }
        }

        cargarTecnicos();

        return () => controlador.abort();
    }, []);


    async function asignarTecnico() {
        if (!tecnicoSeleccionado || guardandoTecnico) return;

        const token = sessionStorage.getItem("helpdesk_token");

        if (!token) {
            router.replace("/");
            return;
        }

        setGuardandoTecnico(true);
        setErrorTecnico("");
        setMensajeTecnico("");

        try {
            const respuesta = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/incidencias/${params.id}/asignar`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        tecnicoId: Number(tecnicoSeleccionado),
                    }),
                }
            );

            if (respuesta.status === 401 || respuesta.status === 403) {
                router.replace("/");
                return;
            }

            if (!respuesta.ok) {
                throw new Error("No se pudo asignar el técnico");
            }

            const resultado = await respuesta.json();

            setIncidencia((actual) =>
                actual
                    ? {
                        ...actual,
                        tecnicoId: resultado.tecnicoId,
                        tecnicoNombre: resultado.tecnicoNombre,
                    }
                    : actual
            );

            setMensajeTecnico("Técnico asignado correctamente");
        } catch (err) {
            setErrorTecnico(
                err instanceof Error
                    ? err.message
                    : "Error al asignar el técnico"
            );
        } finally {
            setGuardandoTecnico(false);
        }
    }


    async function desasignarTecnico() {
        if (guardandoTecnico || incidencia?.tecnicoId == null) {
            return;
        }

        const confirmar = window.confirm(
            "¿Querés desasignar al técnico de esta incidencia?"
        );

        if (!confirmar) return;

        const token = sessionStorage.getItem("helpdesk_token");

        if (!token) {
            router.replace("/");
            return;
        }

        setGuardandoTecnico(true);
        setErrorTecnico("");
        setMensajeTecnico("");

        try {
            const respuesta = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/incidencias/${params.id}/desasignar`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (respuesta.status === 401 || respuesta.status === 403) {
                router.replace("/");
                return;
            }

            if (!respuesta.ok) {
                throw new Error("No se pudo desasignar el técnico");
            }

            setIncidencia((actual) =>
                actual
                    ? {
                        ...actual,
                        tecnicoId: null,
                        tecnicoNombre: null,
                    }
                    : actual
            );

            setTecnicoSeleccionado("");
            setMensajeTecnico("Técnico desasignado correctamente");
        } catch (err) {
            setErrorTecnico(
                err instanceof Error
                    ? err.message
                    : "Error al desasignar el técnico"
            );
        } finally {
            setGuardandoTecnico(false);
        }
    }


    async function cambiarEstado() {
        if (!incidencia || !estadoSeleccionado || guardandoEstado) {
            return;
        }

        if (estadoSeleccionado === incidencia.estado) {
            return;
        }

        const token = sessionStorage.getItem("helpdesk_token");

        if (!token) {
            router.replace("/");
            return;
        }

        setGuardandoEstado(true);
        setErrorEstado("");
        setMensajeEstado("");

        try {
            const respuesta = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/incidencias/${incidencia.id}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        titulo: incidencia.titulo,
                        descripcion: incidencia.descripcion,
                        prioridad: incidencia.prioridad,
                        estado: estadoSeleccionado,
                    }),
                }
            );

            if (respuesta.status === 401 || respuesta.status === 403) {
                router.replace("/");
                return;
            }

            if (!respuesta.ok) {
                throw new Error("No se pudo actualizar el estado");
            }

            const datosActualizados: IncidenciaDetalle =
                await respuesta.json();

            setIncidencia(datosActualizados);
            setEstadoSeleccionado(datosActualizados.estado);
            setMensajeEstado("Estado actualizado correctamente");

            // Recargar el historial de estados
            const respuestaHistorial = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/incidencias/${incidencia.id}/historial`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    cache: "no-store",
                }
            );

            if (respuestaHistorial.ok) {
                const historialActualizado: HistorialEstado[] =
                    await respuestaHistorial.json();

                setHistorial(historialActualizado);
            } else {
                setErrorHistorial(
                    "El estado se guardó, pero no se pudo actualizar el historial."
                );
            }
        } catch (err) {
            setErrorEstado(
                err instanceof Error
                    ? err.message
                    : "Error al actualizar el estado"
            );
        } finally {
            setGuardandoEstado(false);
        }
    }


    async function publicarComentario(
        e: React.FormEvent<HTMLFormElement>
    ) {
        e.preventDefault();

        const mensaje = nuevoComentario.trim();

        if (!mensaje || enviandoComentario) return;

        const token = sessionStorage.getItem("helpdesk_token");

        if (!token) {
            router.replace("/");
            return;
        }

        setEnviandoComentario(true);
        setErrorEnvio("");

        try {
            const respuesta = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/incidencias/${params.id}/comentarios`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ mensaje }),
                }
            );

            if (respuesta.status === 401 || respuesta.status === 403) {
                router.replace("/");
                return;
            }

            if (!respuesta.ok) {
                throw new Error("No se pudo publicar el comentario");
            }

            const comentarioCreado: Comentario = await respuesta.json();

            setComentarios((actuales) => [...actuales, comentarioCreado]);
            setNuevoComentario("");
        } catch (err) {
            setErrorEnvio(
                err instanceof Error
                    ? err.message
                    : "Error al publicar el comentario"
            );
        } finally {
            setEnviandoComentario(false);
        }
    }



    // 3. Interfaz
    return (
        <main className="min-h-screen bg-slate-100 p-5 text-slate-900 md:p-10">
            <div className="mx-auto max-w-5xl">

                {/* Volver al listado */}
                <button
                    onClick={() => router.push("/admin/incidencias")}
                    className="mb-6 text-sm font-medium text-blue-600 hover:underline"
                >
                    ← Volver a incidencias
                </button>

                {cargando ? (
                    <p className="text-slate-500">
                        Cargando detalle de la incidencia...
                    </p>
                ) : error ? (
                    <div className="rounded-xl bg-red-50 p-6 text-red-700">
                        {error}
                    </div>
                ) : incidencia ? (
                    <>
                        {/* Encabezado */}
                        <div className="mb-8">
                            <p className="text-sm font-medium text-blue-600">
                                Incidencia #{incidencia.id}
                            </p>

                            <h1 className="mt-2 text-3xl font-bold">
                                {incidencia.titulo}
                            </h1>

                            <p className="mt-2 text-slate-500">
                                Información general del ticket
                            </p>
                        </div>

                        {/* Información principal */}
                        <div className="grid gap-6 md:grid-cols-3">

                            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2">
                                <h2 className="mb-5 text-xl font-semibold">
                                    Detalles de la incidencia
                                </h2>

                                <div className="space-y-6">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">
                                            Descripción
                                        </p>

                                        <p className="mt-2 whitespace-pre-wrap">
                                            {incidencia.descripcion}
                                        </p>
                                    </div>

                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <div>
                                            <p className="text-sm text-slate-500">
                                                Estado
                                            </p>

                                            <p className="mt-1 font-semibold">
                                                {incidencia.estado}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-sm text-slate-500">
                                                Prioridad
                                            </p>

                                            <p className="mt-1 font-semibold">
                                                {incidencia.prioridad}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-sm text-slate-500">
                                                Fecha de creación
                                            </p>

                                            <p className="mt-1 font-semibold">
                                                {new Date(
                                                    incidencia.fechaCreacion
                                                ).toLocaleString("es-UY")}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-sm text-slate-500">
                                                Número de ticket
                                            </p>

                                            <p className="mt-1 font-semibold">
                                                #{incidencia.id}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Personas relacionadas */}
                            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h2 className="mb-5 text-xl font-semibold">
                                    Personas relacionadas
                                </h2>

                                <div className="space-y-6">
                                    <div>
                                        <p className="text-sm text-slate-500">
                                            Creado por
                                        </p>

                                        <p className="mt-1 font-semibold">
                                            {incidencia.usuarioCreadorNombre}
                                        </p>

                                        <p className="text-xs text-slate-400">
                                            Usuario #{incidencia.usuarioCreadorId}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-slate-500">
                                            Técnico asignado
                                        </p>

                                        <p className="mt-1 font-semibold">
                                            {incidencia.tecnicoNombre ?? "Sin asignar"}
                                        </p>

                                        {incidencia.tecnicoId !== null && (
                                            <p className="text-xs text-slate-400">
                                                Técnico #{incidencia.tecnicoId}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Gestión de técnicos */}
                        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-5 text-xl font-semibold text-slate-900">
                                Gestión del técnico
                            </h2>

                            <div className="mb-5">
                                <p className="text-sm text-slate-500">
                                    Técnico asignado actualmente
                                </p>

                                <p className="mt-1 font-semibold text-slate-900">
                                    {incidencia.tecnicoNombre ?? "Sin asignar"}
                                </p>
                            </div>

                            {cargandoTecnicos ? (
                                <p className="text-slate-500">Cargando técnicos...</p>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label
                                            htmlFor="tecnico"
                                            className="mb-2 block text-sm font-medium text-slate-700"
                                        >
                                            Seleccionar técnico
                                        </label>

                                        <select
                                            id="tecnico"
                                            value={tecnicoSeleccionado}
                                            onChange={(e) => {
                                                setTecnicoSeleccionado(e.target.value);
                                                setMensajeTecnico("");
                                            }}
                                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 md:w-96"
                                        >
                                            <option value="">Seleccionar un técnico...</option>

                                            {tecnicos.map((tecnico) => (
                                                <option key={tecnico.id} value={tecnico.id}>
                                                    {tecnico.nombre} — {tecnico.especialidad ?? "General"}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            type="button"
                                            onClick={asignarTecnico}
                                            disabled={
                                                guardandoTecnico ||
                                                !tecnicoSeleccionado ||
                                                Number(tecnicoSeleccionado) === incidencia.tecnicoId
                                            }
                                            className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {guardandoTecnico ? "Guardando..." : "Asignar técnico"}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={desasignarTecnico}
                                            disabled={
                                                guardandoTecnico ||
                                                incidencia.tecnicoId === null
                                            }
                                            className="rounded-lg border border-red-300 px-5 py-2 font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Desasignar técnico
                                        </button>
                                    </div>
                                </div>
                            )}

                            {errorTecnico && (
                                <p className="mt-4 text-sm text-red-600">
                                    {errorTecnico}
                                </p>
                            )}

                            {mensajeTecnico && (
                                <p className="mt-4 text-sm font-medium text-green-700">
                                    {mensajeTecnico}
                                </p>
                            )}
                        </section>

                        {/* Gestión del estado */}
                        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-5 text-xl font-semibold text-slate-900">
                                Gestión del estado
                            </h2>

                            <div className="mb-5">
                                <p className="text-sm text-slate-500">
                                    Estado actual
                                </p>

                                <p className="mt-1 font-semibold text-slate-900">
                                    {incidencia.estado}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label
                                        htmlFor="estado"
                                        className="mb-2 block text-sm font-medium text-slate-700"
                                    >
                                        Seleccionar nuevo estado
                                    </label>

                                    <select
                                        id="estado"
                                        value={estadoSeleccionado}
                                        onChange={(e) => {
                                            setEstadoSeleccionado(e.target.value);
                                            setMensajeEstado("");
                                            setErrorEstado("");
                                        }}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 md:w-96"
                                    >
                                        <option value="Abierta">Abierta</option>
                                        <option value="En progreso">En progreso</option>
                                        <option value="Resuelta">Resuelta</option>
                                        <option value="Cerrada">Cerrada</option>
                                    </select>
                                </div>

                                <button
                                    type="button"
                                    onClick={cambiarEstado}
                                    disabled={
                                        guardandoEstado ||
                                        !estadoSeleccionado ||
                                        estadoSeleccionado === incidencia.estado
                                    }
                                    className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {guardandoEstado
                                        ? "Guardando..."
                                        : "Guardar nuevo estado"}
                                </button>
                            </div>

                            {errorEstado && (
                                <p className="mt-4 text-sm text-red-600">
                                    {errorEstado}
                                </p>
                            )}

                            {mensajeEstado && (
                                <p className="mt-4 text-sm font-medium text-green-700">
                                    {mensajeEstado}
                                </p>
                            )}
                        </section>
                        {/* Historial de estados */}
                        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-6 text-xl font-semibold">
                                Historial de estados
                            </h2>

                            {cargandoHistorial ? (
                                <p className="text-slate-500">
                                    Cargando historial...
                                </p>
                            ) : errorHistorial ? (
                                <p className="text-red-600">
                                    {errorHistorial}
                                </p>
                            ) : historial.length === 0 ? (
                                <p className="text-slate-500">
                                    Esta incidencia todavía no tiene cambios
                                    de estado registrados.
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {[...historial]
                                        .sort(
                                            (a, b) =>
                                                new Date(b.fechaCambio).getTime() -
                                                new Date(a.fechaCambio).getTime()
                                        )
                                        .map((cambio) => (
                                            <div
                                                key={cambio.id}
                                                className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                                            >
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <span className="rounded-lg bg-slate-200 px-3 py-1 text-sm font-medium">
                                                        {cambio.estadoAnterior}
                                                    </span>

                                                    <span className="text-slate-400">
                                                        →
                                                    </span>

                                                    <span className="rounded-lg bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                                                        {cambio.estadoNuevo}
                                                    </span>
                                                </div>

                                                <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm text-slate-500">
                                                    <p>
                                                        Modificado por:{" "}
                                                        <span className="font-medium text-slate-700">
                                                            {cambio.usuarioNombre}
                                                        </span>
                                                    </p>

                                                    <p>
                                                        {new Date(
                                                            cambio.fechaCambio
                                                        ).toLocaleString("es-UY", {
                                                            dateStyle: "short",
                                                            timeStyle: "short",
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </section>

                        {/* Comentarios */}
                        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-6 text-xl font-semibold">
                                Comentarios
                            </h2>

                            {cargandoComentarios ? (
                                <p className="text-slate-500">
                                    Cargando comentarios...
                                </p>
                            ) : errorComentarios ? (
                                <p className="text-red-600">
                                    {errorComentarios}
                                </p>
                            ) : comentarios.length === 0 ? (
                                <p className="mb-6 text-slate-500">
                                    Esta incidencia todavía no tiene comentarios.
                                </p>
                            ) : (
                                <div className="mb-6 space-y-4">
                                    {comentarios.map((comentario) => (
                                        <div
                                            key={comentario.id}
                                            className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <p className="font-semibold">
                                                    {comentario.usuarioNombre}
                                                </p>

                                                <p className="text-xs text-slate-500">
                                                    {new Date(
                                                        comentario.fechaCreacion
                                                    ).toLocaleString("es-UY", {
                                                        dateStyle: "short",
                                                        timeStyle: "short",
                                                    })}
                                                </p>
                                            </div>

                                            <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
                                                {comentario.mensaje}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Formulario */}
                            <form
                                onSubmit={publicarComentario}
                                className="border-t border-slate-200 pt-6"
                            >
                                <label
                                    htmlFor="nuevoComentario"
                                    className="mb-2 block text-sm font-semibold"
                                >
                                    Agregar comentario
                                </label>

                                <textarea
                                    id="nuevoComentario"
                                    value={nuevoComentario}
                                    onChange={(e) => setNuevoComentario(e.target.value)}
                                    placeholder="Escribí un comentario sobre esta incidencia..."
                                    rows={4}
                                    maxLength={2000}
                                    className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500"
                                />

                                {errorEnvio && (
                                    <p className="mt-2 text-sm text-red-600">
                                        {errorEnvio}
                                    </p>
                                )}

                                <div className="mt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={
                                            enviandoComentario || !nuevoComentario.trim()
                                        }
                                        className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {enviandoComentario
                                            ? "Publicando..."
                                            : "Publicar comentario"}
                                    </button>
                                </div>
                            </form>
                        </section>
                    </>
                ) : (
                    <p>No se encontró información de la incidencia.</p>
                )}
            </div>
        </main>
    );
}


export default function DetalleIncidenciaPage() {
    return (
        <Suspense
            fallback={
                <main className="min-h-screen bg-slate-100 p-10">
                    <p className="text-slate-500">
                        Cargando página de incidencia...
                    </p>
                </main>
            }
        >
            <DetalleIncidenciaContenido />
        </Suspense>
    );
}


