
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
  tecnicoNombre: string | null;
  usuarioCreadorId: number;
  usuarioCreadorNombre: string | null;
};

type RespuestaMisIncidencias = {
  tecnicoId: number;
  tecnicoNombre: string;
  totalIncidencias: number;
  incidencias: Incidencia[];
};

export default function TecnicoPage() {
  const router = useRouter();

  const [datos, setDatos] =
    useState<RespuestaMisIncidencias | null>(null);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");

  useEffect(() => {
    const controlador = new AbortController();

    async function cargarIncidencias() {
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

        const respuesta = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/tecnicos/mis-incidencias`,
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
          throw new Error(
            "No se pudieron cargar las incidencias asignadas"
          );
        }

        const resultado: RespuestaMisIncidencias =
          await respuesta.json();

        if (!Array.isArray(resultado.incidencias)) {
          throw new Error(
            "La API devolvió un formato inesperado"
          );
        }

        if (!controlador.signal.aborted) {
          setDatos(resultado);
        }
      } catch (err) {
        if (!controlador.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "Error al cargar las incidencias"
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
  }, [router]);

  const incidenciasFiltradas = (datos?.incidencias ?? []).filter(
    (incidencia) => {
      const coincideBusqueda =
        incidencia.titulo
          .toLowerCase()
          .includes(busqueda.toLowerCase()) ||
        incidencia.id.toString().includes(busqueda);

      const coincideEstado =
        filtroEstado === "Todos" ||
        incidencia.estado === filtroEstado;

      return coincideBusqueda && coincideEstado;
    }
  );

  function cerrarSesion() {
    sessionStorage.removeItem("helpdesk_token");
    sessionStorage.removeItem("helpdesk_usuario");
    router.replace("/");
  }

  if (cargando) {
    return (
      <main className="min-h-screen bg-slate-100 p-10 text-slate-900">
        <p>Cargando panel del técnico...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-100 p-10 text-slate-900">
        <h1 className="text-2xl font-bold">
          Panel del técnico
        </h1>

        <p className="mt-4 text-red-600">{error}</p>
      </main>
    );
  }

  if (!datos) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900 md:p-10">
      <div className="mx-auto max-w-6xl">

        {/* Encabezado */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Panel del técnico
            </h1>

            <p className="mt-2 text-slate-600">
              Bienvenido, {datos.tecnicoNombre}
            </p>
          </div>

          <button
            onClick={cerrarSesion}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium hover:bg-slate-50"
          >
            Cerrar sesión
          </button>
        </div>

        {/* Resumen */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              titulo: "Total asignadas",
              valor: datos.totalIncidencias,
            },
            {
              titulo: "Abiertas",
              valor: datos.incidencias.filter(
                (i) => i.estado === "Abierta"
              ).length,
            },
            {
              titulo: "En progreso",
              valor: datos.incidencias.filter(
                (i) => i.estado === "En progreso"
              ).length,
            },
            {
              titulo: "Resueltas",
              valor: datos.incidencias.filter(
                (i) => i.estado === "Resuelta"
              ).length,
            },
          ].map((tarjeta) => (
            <div
              key={tarjeta.titulo}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-slate-500">
                {tarjeta.titulo}
              </p>

              <p className="mt-2 text-3xl font-bold">
                {tarjeta.valor}
              </p>
            </div>
          ))}
        </div>

        {/* Listado */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">
              Mis incidencias asignadas
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Consultá las incidencias que tenés a cargo.
            </p>
          </div>

          {/* Filtros */}
          <div className="mb-6 flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Buscar por título o ID..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-blue-500 md:w-80"
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
          </div>

          {incidenciasFiltradas.length === 0 ? (
            <div className="rounded-lg bg-slate-50 p-8 text-center text-slate-500">
              No se encontraron incidencias.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-slate-50 text-slate-600">
                  <tr>
                    <th className="p-4">ID</th>
                    <th className="p-4">Título</th>
                    <th className="p-4">Prioridad</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4">Usuario</th>
                    <th className="p-4">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {incidenciasFiltradas.map((incidencia) => (
                    <tr
                      key={incidencia.id}
                      className="border-b last:border-0 hover:bg-slate-50"
                    >
                      <td className="p-4">
                        #{incidencia.id}
                      </td>

                      <td className="p-4 font-medium">
                        {incidencia.titulo}
                      </td>

                      <td className="p-4">
                        {incidencia.prioridad}
                      </td>

                      <td className="p-4">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                          {incidencia.estado}
                        </span>
                      </td>

                      <td className="p-4">
                        {incidencia.usuarioCreadorNombre ??
                          "Sin información"}
                      </td>

                      <td className="p-4">
                        <button
                          onClick={() =>
                            router.push(
                              `/tecnico/incidencias/${incidencia.id}`
                            )
                          }
                          className="font-medium text-blue-600 hover:underline"
                        >
                          Ver detalles
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

