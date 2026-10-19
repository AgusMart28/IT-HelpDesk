# IT Help Desk — Sistema de Gestión de Incidencias

Sistema web de gestión de incidencias de soporte técnico, desarrollado con **ASP.NET Core (.NET 10), Next.js, TypeScript y PostgreSQL**.

El proyecto permite registrar, administrar y realizar el seguimiento de solicitudes de soporte informático mediante un sistema de autenticación y autorización basado en roles.

Su objetivo es simular el funcionamiento de una mesa de ayuda (*Help Desk*) utilizada en organizaciones para gestionar problemas técnicos, asignar responsables y mantener la trazabilidad de cada solicitud.

## Tecnologías utilizadas

### Backend
- **ASP.NET Core (.NET 10):** desarrollo de la API REST.
- **Entity Framework Core:** acceso a datos mediante ORM.
- **PostgreSQL:** base de datos relacional.
- **JWT (JSON Web Tokens):** autenticación de usuarios.
- **ASP.NET Core Identity PasswordHasher:** almacenamiento seguro de contraseñas mediante hashing.
- **Swagger / OpenAPI:** documentación y pruebas de endpoints, cuando está habilitado.

### Frontend
- **Next.js 16:** aplicación web con App Router.
- **React:** construcción de interfaces.
- **TypeScript:** tipado estático.
- **Tailwind CSS:** estilos y diseño adaptable.

### Herramientas de desarrollo
- Visual Studio Code
- Git y GitHub
- PostgreSQL y pgAdmin
- .NET CLI
- Node.js y npm

## Funcionalidades principales

### Autenticación y autorización
- Registro e inicio de sesión de usuarios.
- Autenticación mediante JWT.
- Contraseñas almacenadas mediante hashing.
- Control de acceso basado en roles.
- Protección de endpoints según los permisos del usuario.

### Administrador
- Visualización y gestión de incidencias.
- Búsqueda y filtrado de solicitudes.
- Consulta de estadísticas.
- Asignación y desasignación de técnicos.
- Actualización de estados.
- Consulta del historial de cambios.
- Lectura y publicación de comentarios.

### Técnico
- Visualización de incidencias asignadas.
- Consulta de detalles y prioridades.
- Actualización del estado de las incidencias.
- Consulta del historial de cambios.
- Comunicación mediante comentarios.

### Usuario
- Creación de nuevas incidencias.
- Consulta de solicitudes propias.
- Búsqueda y filtrado por estado.
- Seguimiento de la resolución de problemas.
- Visualización del técnico asignado.
- Consulta del historial.
- Publicación de comentarios.

## Estados de las incidencias

Las incidencias pueden encontrarse en los siguientes estados:

| Estado | Descripción |
|---|---|
| Abierta | La solicitud fue registrada y está pendiente de atención. |
| En progreso | Se está trabajando en la resolución del problema. |
| Resuelta | El problema fue solucionado. |
| Cerrada | La incidencia fue finalizada. |

Los cambios de estado se registran en un historial que permite identificar las transiciones realizadas, el usuario responsable y la fecha correspondiente.

## Arquitectura del sistema

El proyecto utiliza una arquitectura cliente-servidor:

```text
                    USUARIO
                       |
                       v
             FRONTEND - NEXT.JS
                React + TypeScript
                       |
                    HTTP/JSON
                       |
                       v
              API REST - .NET 10
                       |
             Autenticación JWT
             Autorización por roles
             Lógica de negocio
                       |
                       v
             ENTITY FRAMEWORK CORE
                       |
                       v
                  POSTGRESQL
```

El frontend consume los endpoints de la API REST y presenta interfaces diferentes según el rol del usuario autenticado.

El backend concentra las reglas de negocio, la autorización y las operaciones sobre la base de datos.

## Estructura del proyecto

```text
IT-HelpDesk/
|
|-- HelpDesk.Api/
|   |-- Controllers/
|   |-- Data/
|   |-- DTOs/
|   |-- Migrations/
|   |-- Models/
|   |-- Security/
|   |-- Services/
|   |-- Program.cs
|
|-- helpdesk-web/
|   |-- app/
|   |   |-- admin/
|   |   |-- tecnico/
|   |   |-- usuario/
|   |-- public/
|   |-- package.json
|
|-- .gitignore
|-- README.md
```

## Requisitos para ejecutar el proyecto

- .NET 10 SDK
- Node.js y npm compatibles con Next.js 16
- PostgreSQL
- Git

## Configuración del backend

1. Clonar el repositorio:

```bash
git clone URL_DEL_REPOSITORIO
cd IT-HelpDesk/HelpDesk.Api
```

2. Configurar las credenciales mediante **.NET User Secrets**:

```bash
dotnet user-secrets init
```

Configurar la cadena de conexión a PostgreSQL y los parámetros JWT:

```bash
dotnet user-secrets set "ConnectionStrings:HelpDeskConnection" "Host=localhost;Port=5432;Database=helpdesk_db;Username=TU_USUARIO;Password=TU_PASSWORD"
dotnet user-secrets set "Jwt:Issuer" "HelpDeskApi"
dotnet user-secrets set "Jwt:Audience" "HelpDeskFrontend"
```

Generar una clave aleatoria de al menos 32 bytes y codificarla en Base64. Guardar el valor mediante:

```bash
dotnet user-secrets set "Jwt:Key" "TU_CLAVE_BASE64"
```

**Importante:** las credenciales y las claves JWT no deben publicarse en el repositorio. Los valores de emisor y audiencia deben ser coherentes con la configuración utilizada para generar los tokens.

3. Restaurar dependencias:

```bash
dotnet restore
```

4. Aplicar las migraciones:

```bash
dotnet ef database update
```

5. Ejecutar la API:

```bash
dotnet run --urls "http://localhost:5000"
```

## Configuración del frontend

1. Acceder a la carpeta:

```bash
cd helpdesk-web
```

2. Instalar dependencias:

```bash
npm install
```

3. Crear un archivo `.env.local` con el siguiente contenido:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

4. Ejecutar el servidor de desarrollo:

```bash
npm run dev
```

5. Abrir en el navegador:

http://localhost:3000

## Seguridad

El proyecto incorpora las siguientes medidas:

- Autenticación basada en JWT.
- Validación de firma y expiración de tokens.
- Autorización mediante roles.
- Hashing de contraseñas.
- Restricción de acceso a incidencias según el usuario y el técnico asignado.
- Validaciones de datos desde el backend.
- Almacenamiento local de credenciales de desarrollo mediante .NET User Secrets.

**Nota:** el almacenamiento de tokens en `sessionStorage` corresponde a la implementación actual de desarrollo. Para un despliegue público se recomienda revisar la gestión de sesiones y utilizar un mecanismo más robusto, como cookies HttpOnly configuradas adecuadamente.

## Capturas de pantalla

*Pendiente: incorporar capturas del inicio de sesión y de los paneles de administrador, técnico y usuario.*

## Estado del proyecto

**Versión funcional en desarrollo.**

Las principales funcionalidades de los tres roles están implementadas y conectadas con la API REST y PostgreSQL.

Próximas mejoras previstas:

- Pruebas automatizadas.
- Mejoras en la gestión de sesiones y seguridad.
- Contenerización con Docker.
- Despliegue de la aplicación.
- Documentación adicional de endpoints.

## Autor

**Agustín Martínez**

Proyecto personal desarrollado como práctica de desarrollo full stack, APIs REST, bases de datos relacionales y seguridad de aplicaciones web.