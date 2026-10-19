
"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Incidencia = {
  id: number;
  titulo: string;
  descripcion: string;
  prioridad: string;
  estado: string;
  fechaCreacion: string;
  tecnicoId: number | null;
  tecnicoNombre: string | null;
  usuarioCreadorId: number;
  usuarioCreadorNombre: string | null;
};

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

const API = process.env.NEXT_PUBLIC_API_URL;

function DetalleTecnicoContenido() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [incidencia, setIncidencia] = useState<Incidencia | null>(null);
  const [historial, setHistorial] = useState<HistorialEstado[]>([]);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [estadoSeleccionado, setEstadoSeleccionado] = useState("");
  const [guardandoEstado, setGuardandoEstado] = useState(false);
  const [mensajeEstado, setMensajeEstado] = useState("");
  const [errorEstado, setErrorEstado] = useState("");

  const [nuevoComentario, setNuevoComentario] = useState("");
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [errorComentario, setErrorComentario] = useState("");

  useEffect(() => {
    const controlador = new AbortController();

    async function cargarDatos() {
      const token = sessionStorage.getItem("helpdesk_token");
      const usuario = sessionStorage.getItem("helpdesk_usuario");

      if (!token || !usuario) {
        router.replace("/");
        return;
      }

      try {
        const perfil = JSON.parse(usuario);

        if ((perfil.rol ?? perfil.role) !== "Tecnico") {
          router.replace("/");
          return;
        }

        const cabeceras = {
          Authorization: `Bearer ${token}`,
        };

        // Verificar que la incidencia esté asignada al técnico.
        const respuestaAsignadas = await fetch(
          `${API}/api/tecnicos/mis-incidencias`,
          {
            headers: cabeceras,
            cache: "no-store",
            signal: controlador.signal,
          }
        );

        if (
          respuestaAsignadas.status === 401 ||
          respuestaAsignadas.status === 403
        ) {
          router.replace("/");
          return;
        }

        if (!respuestaAsignadas.ok) {
          throw new Error("No se pudieron consultar tus incidencias");
        }

        const datosAsignadas = await respuestaAsignadas.json();

        const encontrada: Incidencia | undefined =
          datosAsignadas.incidencias?.find(
            (item: Incidencia) => item.id === Number(params.id)
          );

        if (!encontrada) {
          throw new Error(
            "Esta incidencia no está asignada a tu cuenta"
          );
        }

        setIncidencia(encontrada);
        setEstadoSeleccionado(encontrada.estado);

        // Cargar historial y comentarios.
        const [respuestaHistorial, respuestaComentarios] =
          await Promise.all([
            fetch(
              `${API}/api/incidencias/${params.id}/historial`,
              {
                headers: cabeceras,
                cache: "no-store",
                signal: controlador.signal,
              }
            ),
            fetch(
              `${API}/api/incidencias/${params.id}/comentarios`,
              {
                headers: cabeceras,
                cache: "no-store",
                signal: controlador.signal,
              }
            ),
          ]);

        if (
          respuestaHistorial.status === 401 ||
          respuestaComentarios.status === 401
        ) {
          router.replace("/");
          return;
        }

        if (!respuestaHistorial.ok) {
          throw new Error("No se pudo cargar el historial");
        }

        if (!respuestaComentarios.ok) {
          throw new Error("No se pudieron cargar los comentarios");
        }

        const datosHistorial: HistorialEstado[] =
          await respuestaHistorial.json();

        const datosComentarios: Comentario[] =
          await respuestaComentarios.json();

        if (!controlador.signal.aborted) {
          setHistorial(datosHistorial);
          setComentarios(datosComentarios);
        }
      } catch (err) {
        if (!controlador.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo cargar la incidencia"
          );
        }
      } finally {
        if (!controlador.signal.aborted) {
          setCargando(false);
        }
      }
    }

    cargarDatos();

    return () => controlador.abort();
  }, [params.id, router]);

  async function cambiarEstado() {
    if (
      !incidencia ||
      !estadoSeleccionado ||
      estadoSeleccionado === incidencia.estado ||
      guardandoEstado
    ) {
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
        `${API}/api/incidencias/${incidencia.id}/estado`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            estado: estadoSeleccionado,
          }),
        }
      );

      if (respuesta.status === 401 || respuesta.status === 403) {
        router.replace("/");
        return;
      }

      if (!respuesta.ok) {
        const mensaje = await respuesta.text();
        throw new Error(mensaje || "No se pudo cambiar el estado");
      }

      const resultado = await respuesta.json();

      setIncidencia((actual) =>
        actual ? { ...actual, estado: resultado.estado } : actual
      );
      setEstadoSeleccionado(resultado.estado);
      setMensajeEstado("Estado actualizado correctamente");

      // Actualizar el historial.
      const respuestaHistorial = await fetch(
        `${API}/api/incidencias/${incidencia.id}/historial`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }
      );

      if (respuestaHistorial.ok) {
        setHistorial(await respuestaHistorial.json());
      }
    } catch (err) {
      setErrorEstado(
        err instanceof Error ? err.message : "Error al cambiar el estado"
      );
    } finally {
      setGuardandoEstado(false);
    }
  }

  async function publicarComentario(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!incidencia || !nuevoComentario.trim() || enviandoComentario) {
      return;
    }

    const token = sessionStorage.getItem("helpdesk_token");

    if (!token) {
      router.replace("/");
      return;
    }

    setEnviandoComentario(true);
    setErrorComentario("");

    try {
      const respuesta = await fetch(
        `${API}/api/incidencias/${incidencia.id}/comentarios`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mensaje: nuevoComentario.trim(),
          }),
        }
      );

      if (respuesta.status === 401 || respuesta.status === 403) {
        router.replace("/");
        return;
      }

      if (!respuesta.ok) {
        throw new Error("No se pudo publicar el comentario");
      }

      const comentario: Comentario = await respuesta.json();

      setComentarios((actuales) => [...actuales, comentario]);
      setNuevoComentario("");
    } catch (err) {
      setErrorComentario(
        err instanceof Error
          ? err.message
          : "Error al publicar el comentario"
      );
    } finally {
      setEnviandoComentario(false);
    }
  }

  if (cargando) {
    return (
      <main className="min-h-screen bg-slate-100 p-10">
        Cargando incidencia...
      </main>
    );
  }

  if (error || !incidencia) {
    return (
      <main className="min-h-screen bg-slate-100 p-10">
        <p className="text-red-600">
          {error || "No se encontró la incidencia"}
        </p>

        <button
          onClick={() => router.push("/tecnico")}
          className="mt-4 text-blue-600 hover:underline"
        >
          Volver al panel
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900 md:p-10">
      <div className="mx-auto max-w-5xl space-y-6">

        <button
          onClick={() => router.push("/tecnico")}
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          ← Volver a mis incidencias
        </button>

        {/* Detalles */}
        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold">
            Incidencia #{incidencia.id}
          </h1>

          <h2 className="mt-3 text-xl font-semibold">
            {incidencia.titulo}
          </h2>

          <p className="mt-3 whitespace-pre-wrap text-slate-600">
            {incidencia.descripcion}
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-slate-500">Prioridad</p>
              <p className="font-medium">{incidencia.prioridad}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Estado</p>
              <p className="font-medium">{incidencia.estado}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Reportado por</p>
              <p className="font-medium">
                {incidencia.usuarioCreadorNombre ?? "Sin información"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Fecha de creación</p>
              <p className="font-medium">
                {new Date(incidencia.fechaCreacion).toLocaleString("es-UY")}
              </p>
            </div>
          </div>
        </section>

        {/* Cambiar estado */}
        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">
            Gestión del estado
          </h2>

          <label
            htmlFor="estado"
            className="mb-2 block text-sm font-medium"
          >
            Seleccionar nuevo estado
          </label>

          <select
            id="estado"
            value={estadoSeleccionado}
            onChange={(e) => {
              setEstadoSeleccionado(e.target.value);
              setErrorEstado("");
              setMensajeEstado("");
            }}
            className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 md:w-96"
          >
            <option value="Abierta">Abierta</option>
            <option value="En progreso">En progreso</option>
            <option value="Resuelta">Resuelta</option>
            <option value="Cerrada">Cerrada</option>
          </select>

          <button
            onClick={cambiarEstado}
            disabled={
              guardandoEstado ||
              !estadoSeleccionado ||
              estadoSeleccionado === incidencia.estado
            }
            className="mt-4 rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {guardandoEstado ? "Guardando..." : "Guardar estado"}
          </button>

          {mensajeEstado && (
            <p className="mt-3 text-sm text-green-700">
              {mensajeEstado}
            </p>
          )}

          {errorEstado && (
            <p className="mt-3 text-sm text-red-600">
              {errorEstado}
            </p>
          )}
        </section>

        {/* Historial */}
        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">
            Historial de estados
          </h2>

          {historial.length === 0 ? (
            <p className="text-slate-500">
              Todavía no hay cambios de estado.
            </p>
          ) : (
            <div className="space-y-3">
              {[...historial]
                .sort(
                  (a, b) =>
                    new Date(b.fechaCambio).getTime() -
                    new Date(a.fechaCambio).getTime()
                )
                .map((registro) => (
                  <div
                    key={registro.id}
                    className="rounded-lg border border-slate-200 p-4"
                  >
                    <p className="font-medium">
                      {registro.estadoAnterior} → {registro.estadoNuevo}
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                      Por: {registro.usuarioNombre}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(registro.fechaCambio).toLocaleString("es-UY")}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </section>

        {/* Comentarios */}
        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">
            Comentarios
          </h2>

          {comentarios.length === 0 ? (
            <p className="mb-4 text-slate-500">
              Todavía no hay comentarios.
            </p>
          ) : (
            <div className="mb-6 space-y-3">
              {comentarios.map((comentario) => (
                <div
                  key={comentario.id}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <p className="font-semibold">
                    {comentario.usuarioNombre}
                  </p>

                  <p className="mt-2 whitespace-pre-wrap">
                    {comentario.mensaje}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    {new Date(comentario.fechaCreacion).toLocaleString("es-UY")}
                  </p>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={publicarComentario}>
            <label
              htmlFor="comentario"
              className="mb-2 block text-sm font-medium"
            >
              Agregar comentario
            </label>

            <textarea
              id="comentario"
              value={nuevoComentario}
              onChange={(e) => setNuevoComentario(e.target.value)}
              rows={3}
              placeholder="Escribí un comentario..."
              className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500"
            />

            <button
              type="submit"
              disabled={enviandoComentario || !nuevoComentario.trim()}
              className="mt-3 rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {enviandoComentario ? "Publicando..." : "Publicar comentario"}
            </button>

            {errorComentario && (
              <p className="mt-3 text-sm text-red-600">
                {errorComentario}
              </p>
            )}
          </form>
        </section>
      </div>
    </main>
  );
}

export default function DetalleTecnicoPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-100 p-10">
          Cargando página...
        </main>
      }
    >
      <DetalleTecnicoContenido />
    </Suspense>
  );
}
