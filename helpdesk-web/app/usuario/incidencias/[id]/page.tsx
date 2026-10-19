
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

type Historial = {
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

function DetalleUsuarioContenido() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [incidencia, setIncidencia] =
    useState<Incidencia | null>(null);

  const [historial, setHistorial] = useState<Historial[]>([]);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [nuevoComentario, setNuevoComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [errorComentario, setErrorComentario] = useState("");
  const [mensajeComentario, setMensajeComentario] = useState("");

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

        if ((perfil.rol ?? perfil.role) !== "Usuario") {
          router.replace("/");
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        // Consultar solamente las incidencias del usuario.
        const respuestaIncidencias = await fetch(
          `${API}/api/incidencias/mis-incidencias`,
          {
            headers,
            cache: "no-store",
            signal: controlador.signal,
          }
        );

        if (
          respuestaIncidencias.status === 401 ||
          respuestaIncidencias.status === 403
        ) {
          sessionStorage.removeItem("helpdesk_token");
          sessionStorage.removeItem("helpdesk_usuario");
          router.replace("/");
          return;
        }

        if (!respuestaIncidencias.ok) {
          throw new Error("No se pudieron cargar tus incidencias");
        }

        const incidencias: Incidencia[] =
          await respuestaIncidencias.json();

        const encontrada = incidencias.find(
          (item) => item.id === Number(params.id)
        );

        if (!encontrada) {
          throw new Error(
            "Esta incidencia no existe o no pertenece a tu cuenta."
          );
        }

        setIncidencia(encontrada);

        // Consultar historial y comentarios.
        const [respuestaHistorial, respuestaComentarios] =
          await Promise.all([
            fetch(
              `${API}/api/incidencias/${params.id}/historial`,
              {
                headers,
                cache: "no-store",
                signal: controlador.signal,
              }
            ),
            fetch(
              `${API}/api/incidencias/${params.id}/comentarios`,
              {
                headers,
                cache: "no-store",
                signal: controlador.signal,
              }
            ),
          ]);

        if (
          respuestaHistorial.status === 401 ||
          respuestaComentarios.status === 401
        ) {
          sessionStorage.removeItem("helpdesk_token");
          sessionStorage.removeItem("helpdesk_usuario");
          router.replace("/");
          return;
        }

        if (!respuestaHistorial.ok) {
          throw new Error("No se pudo cargar el historial");
        }

        if (!respuestaComentarios.ok) {
          throw new Error("No se pudieron cargar los comentarios");
        }

        const datosHistorial: Historial[] =
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

  async function publicarComentario(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!incidencia || !nuevoComentario.trim() || enviando) {
      return;
    }

    const token = sessionStorage.getItem("helpdesk_token");

    if (!token) {
      router.replace("/");
      return;
    }

    setEnviando(true);
    setErrorComentario("");
    setMensajeComentario("");

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
        sessionStorage.removeItem("helpdesk_token");
        sessionStorage.removeItem("helpdesk_usuario");
        router.replace("/");
        return;
      }

      if (!respuesta.ok) {
        throw new Error("No se pudo publicar el comentario");
      }

      // Recargar los comentarios desde la base de datos.
      const respuestaComentarios = await fetch(
        `${API}/api/incidencias/${incidencia.id}/comentarios`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      if (!respuestaComentarios.ok) {
        throw new Error(
          "El comentario se envió, pero no se pudo actualizar la lista."
        );
      }

      const datos: Comentario[] =
        await respuestaComentarios.json();

      setComentarios(datos);
      setNuevoComentario("");
      setMensajeComentario("Comentario publicado correctamente.");
    } catch (err) {
      setErrorComentario(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al publicar el comentario"
      );
    } finally {
      setEnviando(false);
    }
  }

  function formatearFecha(fecha: string) {
    return new Date(fecha).toLocaleString("es-UY");
  }

  if (cargando) {
    return (
      <main className="min-h-screen bg-slate-100 p-10 text-slate-900">
        Cargando incidencia...
      </main>
    );
  }

  if (error || !incidencia) {
    return (
      <main className="min-h-screen bg-slate-100 p-10 text-slate-900">
        <p className="text-red-600">
          {error || "No se encontró la incidencia"}
        </p>

        <button
          onClick={() => router.push("/usuario")}
          className="mt-4 text-blue-600 hover:underline"
        >
          ← Volver al panel
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900 md:p-10">
      <div className="mx-auto max-w-4xl space-y-6">

        <button
          onClick={() => router.push("/usuario")}
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          ← Volver a mis incidencias
        </button>

        {/* Detalles */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            Incidencia #{incidencia.id}
          </p>

          <h1 className="mt-2 text-2xl font-bold">
            {incidencia.titulo}
          </h1>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-slate-500">Estado</p>
              <p className="font-semibold">{incidencia.estado}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Prioridad</p>
              <p className="font-semibold">
                {incidencia.prioridad}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Técnico asignado
              </p>
              <p className="font-semibold">
                {incidencia.tecnicoNombre ?? "Sin asignar"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Fecha de creación
              </p>
              <p className="font-semibold">
                {formatearFecha(incidencia.fechaCreacion)}
              </p>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-200 pt-5">
            <h2 className="font-semibold">
              Descripción del problema
            </h2>

            <p className="mt-2 whitespace-pre-wrap text-slate-700">
              {incidencia.descripcion}
            </p>
          </div>
        </section>

        {/* Historial */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">
            Historial de estados
          </h2>

          {historial.length === 0 ? (
            <p className="mt-4 text-slate-500">
              Todavía no hay cambios de estado registrados.
            </p>
          ) : (
            <div className="mt-5 space-y-4">
              {historial.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <p className="font-medium">
                    {item.estadoAnterior} → {item.estadoNuevo}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Modificado por: {item.usuarioNombre}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {formatearFecha(item.fechaCambio)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Comentarios */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">
            Comentarios
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Podés comunicarte con el equipo de soporte
            mediante los comentarios de esta incidencia.
          </p>

          <div className="mt-6 space-y-4">
            {comentarios.length === 0 ? (
              <p className="text-slate-500">
                Todavía no hay comentarios.
              </p>
            ) : (
              comentarios.map((comentario) => (
                <div
                  key={comentario.id}
                  className="rounded-lg bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">
                      {comentario.usuarioNombre}
                    </p>

                    <p className="text-xs text-slate-500">
                      {formatearFecha(
                        comentario.fechaCreacion
                      )}
                    </p>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-slate-700">
                    {comentario.mensaje}
                  </p>
                </div>
              ))
            )}
          </div>

          <form
            onSubmit={publicarComentario}
            className="mt-8 border-t border-slate-200 pt-6"
          >
            <label
              htmlFor="comentario"
              className="mb-2 block font-medium"
            >
              Agregar comentario
            </label>

            <textarea
              id="comentario"
              value={nuevoComentario}
              onChange={(e) =>
                setNuevoComentario(e.target.value)
              }
              placeholder="Escribí tu mensaje para el equipo de soporte..."
              rows={4}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />

            {errorComentario && (
              <p className="mt-3 text-sm text-red-600">
                {errorComentario}
              </p>
            )}

            {mensajeComentario && (
              <p className="mt-3 text-sm text-green-600">
                {mensajeComentario}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando || !nuevoComentario.trim()}
              className="mt-4 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {enviando
                ? "Publicando..."
                : "Publicar comentario"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

export default function DetalleUsuarioPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-100 p-10 text-slate-900">
          Cargando página...
        </main>
      }
    >
      <DetalleUsuarioContenido />
    </Suspense>
  );
}
