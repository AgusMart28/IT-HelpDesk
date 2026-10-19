"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("")
  const router = useRouter();

  async function iniciarSesion(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setMensaje("");
    setCargando(true);

    try {
      const respuesta = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      if (!respuesta.ok) {
        if (respuesta.status === 401) {
          throw new Error("Correo o contraseña incorrectos");
        }

        throw new Error(`Error del servidor: ${respuesta.status}`);
      }

      
const datos = await respuesta.json();

if (!datos.token) {
  throw new Error("La API no devolvió un token");
}

// Almacenamiento temporal para desarrollo.
// No utilizar sessionStorage para tokens en producción.
sessionStorage.setItem("helpdesk_token", datos.token);

// Consultamos el perfil para conocer el rol real del usuario.
const perfilRespuesta = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/api/auth/perfil`,
  {
    headers: {
      Authorization: `Bearer ${datos.token}`,
    },
  }
);

if (!perfilRespuesta.ok) {
  sessionStorage.removeItem("helpdesk_token");
  throw new Error("No se pudo obtener el perfil");
}

const perfil = await perfilRespuesta.json();

sessionStorage.setItem(
  "helpdesk_usuario",
  JSON.stringify(perfil)
);

const rol = perfil.rol ?? perfil.role;

if (rol === "Administrador") {
  router.push("/admin");
} else if (rol === "Tecnico") {
  router.push("/tecnico");
} else if (rol === "Usuario") {
  router.push("/usuario");
} else {
  sessionStorage.removeItem("helpdesk_token");
  sessionStorage.removeItem("helpdesk_usuario");
  throw new Error("El usuario tiene un rol desconocido");
}

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo iniciar sesión"
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-2xl font-bold text-white">
            H
          </div>

          <h1 className="text-3xl font-bold text-slate-900">
            IT Help Desk
          </h1>

          <p className="mt-2 text-slate-500">
            Iniciá sesión para gestionar tus incidencias
          </p>
        </div>

        <form onSubmit={iniciarSesion} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Correo electrónico
            </label>

            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@ejemplo.com"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Contraseña
            </label>

            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresá tu contraseña"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}

          {mensaje && (
            <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
              {mensaje}
            </p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {cargando ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-slate-400">
          IT Help Desk · Sistema de gestión de incidencias
        </p>
      </div>
    </main>
  );
}
