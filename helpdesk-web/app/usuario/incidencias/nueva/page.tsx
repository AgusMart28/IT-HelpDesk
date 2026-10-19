
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type IncidenciaCreada = {
  id: number;
  titulo: string;
  descripcion: string;
  prioridad: string;
  estado: string;
};

export default function NuevaIncidenciaPage() {
  const router = useRouter();

  const [autorizado, setAutorizado] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [prioridad, setPrioridad] = useState("Media");

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
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

      setAutorizado(true);
    } catch {
      router.replace("/");
    }
  }, [router]);

  async function crearIncidencia(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (guardando) return;

    if (!titulo.trim() || !descripcion.trim()) {
      setError("Completá el título y la descripción.");
      return;
    }

    const token = sessionStorage.getItem("helpdesk_token");

    if (!token) {
      router.replace("/");
      return;
    }

    setGuardando(true);
    setError("");

    try {
      const respuesta = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/incidencias`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            titulo: titulo.trim(),
            descripcion: descripcion.trim(),
            prioridad: prioridad,
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
        const mensaje = await respuesta.text();
        throw new Error(
          mensaje || "No se pudo crear la incidencia."
        );
      }

      const incidencia: IncidenciaCreada =
        await respuesta.json();

      // Regresar al panel del usuario.
      router.push("/usuario");
      router.refresh();

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al crear la incidencia."
      );
    } finally {
      setGuardando(false);
    }
  }

  if (!autorizado) {
    return (
      <main className="min-h-screen bg-slate-100 p-10 text-slate-900">
        Verificando sesión...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900 md:p-10">
      <div className="mx-auto max-w-3xl">

        {/* Volver */}
        <button
          onClick={() => router.push("/usuario")}
          className="mb-6 text-sm font-medium text-blue-600 hover:underline"
        >
          ← Volver a mis incidencias
        </button>

        {/* Formulario */}
        <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">

          <h1 className="text-2xl font-bold">
            Nueva incidencia
          </h1>

          <p className="mt-2 text-slate-600">
            Describí el problema informático para solicitar
            asistencia técnica.
          </p>

          <form
            onSubmit={crearIncidencia}
            className="mt-8 space-y-6"
          >

            {/* Título */}
            <div>
              <label
                htmlFor="titulo"
                className="mb-2 block text-sm font-medium"
              >
                Título del problema
              </label>

              <input
                id="titulo"
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej.: No puedo conectarme a Internet"
                maxLength={150}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            {/* Descripción */}
            <div>
              <label
                htmlFor="descripcion"
                className="mb-2 block text-sm font-medium"
              >
                Descripción del problema
              </label>

              <textarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Explicá qué sucede, cuándo comenzó y qué intentaste hacer para solucionarlo..."
                rows={6}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            {/* Prioridad */}
            <div>
              <label
                htmlFor="prioridad"
                className="mb-2 block text-sm font-medium"
              >
                Prioridad
              </label>

              <select
                id="prioridad"
                value={prioridad}
                onChange={(e) => setPrioridad(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="Baja">Baja</option>
                <option value="Media">Media</option>
                <option value="Alta">Alta</option>
              </select>

              <p className="mt-2 text-xs text-slate-500">
                Baja: problema menor. Media: afecta el trabajo
                habitual. Alta: impide realizar tareas importantes.
              </p>
            </div>

            {/* Errores */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Botones */}
            <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-6">
              <button
                type="submit"
                disabled={
                  guardando ||
                  !titulo.trim() ||
                  !descripcion.trim()
                }
                className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {guardando
                  ? "Creando incidencia..."
                  : "Crear incidencia"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/usuario")}
                disabled={guardando}
                className="rounded-lg border border-slate-300 px-6 py-3 font-medium hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
