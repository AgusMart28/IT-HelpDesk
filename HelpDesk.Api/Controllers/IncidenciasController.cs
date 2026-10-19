using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HelpDesk.Api.Models;
using HelpDesk.Api.Data;
using HelpDesk.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using HelpDesk.Api.Security;
using System.Security.Claims;
using HelpDesk.Api.Services;




namespace HelpDesk.Api.Controllers;


[ApiController]
[Route("api/incidencias")]
[Authorize]
public class IncidenciasController : ControllerBase
{
    
private readonly HelpDeskDbContext _context;
private readonly ServicioEstadoIncidencia _servicioEstado;

public IncidenciasController(
    HelpDeskDbContext context,
    ServicioEstadoIncidencia servicioEstado)
{
    _context = context;
    _servicioEstado = servicioEstado;
}


    // GET: Obtener todas las incidencias
    


[HttpGet]
[Authorize(Roles = Roles.Administrador)]
public async Task<IActionResult> ObtenerTodas(
    [FromQuery] FiltroIncidenciasDto filtros)
{
    var consulta = _context.Incidencias
        .AsNoTracking()
        .AsQueryable();

    // Filtrar por estado
    if (!string.IsNullOrWhiteSpace(filtros.Estado))
    {
        consulta = consulta.Where(i =>
            i.Estado == filtros.Estado);
    }

    // Filtrar por prioridad
    if (!string.IsNullOrWhiteSpace(filtros.Prioridad))
    {
        consulta = consulta.Where(i =>
            i.Prioridad == filtros.Prioridad);
    }

    // Buscar por titulo o descripcion
    if (!string.IsNullOrWhiteSpace(filtros.Buscar))
    {
        var texto = $"%{filtros.Buscar.Trim()}%";

        consulta = consulta.Where(i =>
            EF.Functions.ILike(i.Titulo, texto) ||
            EF.Functions.ILike(i.Descripcion, texto));
    }

    // Validar el ordenamiento
    var ordenarPor = filtros.OrdenarPor.ToLowerInvariant();
    var direccion = filtros.Direccion.ToLowerInvariant();

    if (ordenarPor != "fecha" &&
        ordenarPor != "titulo" &&
        ordenarPor != "prioridad")
    {
        return BadRequest(
            "OrdenarPor debe ser fecha, titulo o prioridad");
    }

    if (direccion != "asc" && direccion != "desc")
    {
        return BadRequest(
            "Direccion debe ser asc o desc");
    }

    // Contar antes de paginar
    var totalRegistros = await consulta.CountAsync();

    // Ordenar
    consulta = (ordenarPor, direccion) switch
    {
        ("titulo", "asc") =>
            consulta.OrderBy(i => i.Titulo).ThenBy(i => i.Id),

        ("titulo", "desc") =>
            consulta.OrderByDescending(i => i.Titulo)
                    .ThenBy(i => i.Id),

        ("prioridad", "asc") =>
            consulta.OrderBy(i => i.Prioridad).ThenBy(i => i.Id),

        ("prioridad", "desc") =>
            consulta.OrderByDescending(i => i.Prioridad)
                    .ThenBy(i => i.Id),

        ("fecha", "asc") =>
            consulta.OrderBy(i => i.FechaCreacion)
                    .ThenBy(i => i.Id),

        _ =>
            consulta.OrderByDescending(i => i.FechaCreacion)
                    .ThenBy(i => i.Id)
    };

    // Paginar
    var saltar = (filtros.Pagina - 1)
    * filtros.TamanoPagina;

    // Convertir las entidades a DTOs
    var incidencias = await consulta
        .Skip(saltar)
        .Take(filtros.TamanoPagina)
        .Select(i => new IncidenciaRespuestaDto
        {
            Id = i.Id,
            Titulo = i.Titulo,
            Descripcion = i.Descripcion,
            Prioridad = i.Prioridad,
            Estado = i.Estado,
            FechaCreacion = i.FechaCreacion,
            TecnicoId = i.TecnicoId,
            TecnicoNombre = i.Tecnico != null
                ? i.Tecnico.Nombre
                : null,            
            UsuarioCreadorId = i.UsuarioCreadorId,
            UsuarioCreadorNombre = i.UsuarioCreador != null
                ? i.UsuarioCreador.Nombre
                : null
    
        })
        .ToListAsync();

    var totalPaginas = (int)Math.Ceiling(
        (double)totalRegistros / filtros.TamanoPagina);

    var respuesta = new RespuestaPaginadaDto<IncidenciaRespuestaDto>
    {
        Pagina = filtros.Pagina,
        TamanoPagina = filtros.TamanoPagina,
        TotalRegistros = totalRegistros,
        TotalPaginas = totalPaginas,
        Datos = incidencias
    };

    return Ok(respuesta);
}




    // GET: Obtener una incidencia por ID
    


[HttpGet("{id}")]
public async Task<IActionResult> ObtenerPorId(int id)
{
    var usuarioId = ObtenerUsuarioId();

    if (usuarioId == null)
    {
        return Unauthorized("No se pudo identificar al usuario");
    }

    var esAdministrador = User.IsInRole(Roles.Administrador);

    var consulta = _context.Incidencias
        .AsNoTracking()
        .Where(i => i.Id == id);

    if (!esAdministrador)
    {
        consulta = consulta.Where(
            i => i.UsuarioCreadorId == usuarioId.Value);
    }

    var incidencia = await consulta
        .Select(i => new IncidenciaRespuestaDto
        {
            Id = i.Id,
            Titulo = i.Titulo,
            Descripcion = i.Descripcion,
            Prioridad = i.Prioridad,
            Estado = i.Estado,
            FechaCreacion = i.FechaCreacion,
            TecnicoId = i.TecnicoId,
            TecnicoNombre = i.Tecnico != null
                ? i.Tecnico.Nombre
                : null,
            UsuarioCreadorId = i.UsuarioCreadorId,
            UsuarioCreadorNombre = i.UsuarioCreador != null
                ? i.UsuarioCreador.Nombre
                : null
        })
        .FirstOrDefaultAsync();

    if (incidencia == null)
    {
        return NotFound("Incidencia no encontrada");
    }

    return Ok(incidencia);
}



    // POST: Crear una incidencia
    

[HttpPost]
[Authorize(Roles = Roles.Administrador + "," + Roles.Tecnico + "," + Roles.Usuario)]
public async Task<IActionResult> Crear(CrearIncidenciaDto datos)
{
    var usuarioId = ObtenerUsuarioId();

    if (usuarioId == null)
    {
        return Unauthorized("No se pudo identificar al usuario");
    }

    var nuevaIncidencia = new Incidencia
    {
        Titulo = datos.Titulo,
        Descripcion = datos.Descripcion,
        Prioridad = datos.Prioridad,
        Estado = "Abierta",
        FechaCreacion = DateTime.UtcNow,
        UsuarioCreadorId = usuarioId.Value
    };

    _context.Incidencias.Add(nuevaIncidencia);
    await _context.SaveChangesAsync();

    var respuesta = new IncidenciaRespuestaDto
    {
        Id = nuevaIncidencia.Id,
        Titulo = nuevaIncidencia.Titulo,
        Descripcion = nuevaIncidencia.Descripcion,
        Prioridad = nuevaIncidencia.Prioridad,
        Estado = nuevaIncidencia.Estado,
        FechaCreacion = nuevaIncidencia.FechaCreacion,
        TecnicoId = nuevaIncidencia.TecnicoId,
        TecnicoNombre = null,
        UsuarioCreadorId = nuevaIncidencia.UsuarioCreadorId
    };

    return CreatedAtAction(
        nameof(ObtenerPorId),
        new { id = nuevaIncidencia.Id },
        respuesta
    );
}


    // PUT: Actualizar una incidencia
    


[HttpPut("{id}")]
[Authorize(Roles = Roles.Administrador)]
public async Task<IActionResult> Actualizar(
    int id, ActualizarIncidenciaDto datos)
{
    // Obtener el ID del administrador autenticado
    var usuarioIdTexto = User.FindFirstValue("sub");

    if (!int.TryParse(usuarioIdTexto, out var usuarioId))
    {
        return Unauthorized();
    }

    // Buscar la incidencia
    var incidencia = await _context.Incidencias
        .Include(i => i.Tecnico)
        .Include(i => i.UsuarioCreador)
        .FirstOrDefaultAsync(i => i.Id == id);

    if (incidencia == null)
    {
        return NotFound("Incidencia no encontrada");
    }

    // Cambiar el estado utilizando el servicio
    // para registrar automaticamente el historial
    try
    {
        _servicioEstado.CambiarEstado(
            incidencia,
            datos.Estado,
            usuarioId);
    }
    catch (ArgumentException ex)
    {
        return BadRequest(ex.Message);
    }

    // Actualizar los demas datos
    incidencia.Titulo = datos.Titulo;
    incidencia.Descripcion = datos.Descripcion;
    incidencia.Prioridad = datos.Prioridad;

    // Guardar la incidencia y el historial juntos
    await _context.SaveChangesAsync();

    var respuesta = new IncidenciaRespuestaDto
    {
        Id = incidencia.Id,
        Titulo = incidencia.Titulo,
        Descripcion = incidencia.Descripcion,
        Prioridad = incidencia.Prioridad,
        Estado = incidencia.Estado,
        FechaCreacion = incidencia.FechaCreacion,
        TecnicoId = incidencia.TecnicoId,
        TecnicoNombre = incidencia.Tecnico?.Nombre,
        UsuarioCreadorId = incidencia.UsuarioCreadorId,
        UsuarioCreadorNombre = incidencia.UsuarioCreador?.Nombre
    };

    return Ok(respuesta);
}




    // DELETE: Eliminar una incidencia
    [HttpDelete("{id}")]
    [Authorize(Roles = Roles.Administrador)]
    public async Task<IActionResult> Eliminar(int id)
    {
        var incidencia = await _context.Incidencias.FindAsync(id);

        if (incidencia == null)
        {
            return NotFound("Incidencia no encontrada");
        }

        _context.Incidencias.Remove(incidencia);

        await _context.SaveChangesAsync();

        return NoContent();
    }


    
[HttpPatch("{id}/asignar")]
[Authorize(Roles = Roles.Administrador)]
public async Task<IActionResult> AsignarTecnico(
    int id, AsignarTecnicoDto datos)
{
    // Buscar la incidencia
    var incidencia = await _context.Incidencias.FindAsync(id);

    if (incidencia == null)
    {
        return NotFound("Incidencia no encontrada");
    }

    // Buscar el tecnico
    var tecnico = await _context.Tecnicos
        .FindAsync(datos.TecnicoId!.Value);

    if (tecnico == null)
    {
        return NotFound("Tecnico no encontrado");
    }

    // Asignar el tecnico a la incidencia
    incidencia.TecnicoId = tecnico.Id;

    await _context.SaveChangesAsync();

    return Ok(new
    {
        mensaje = "Tecnico asignado correctamente",
        incidenciaId = incidencia.Id,
        tecnicoId = tecnico.Id,
        tecnicoNombre = tecnico.Nombre
    });
}


[HttpPatch("{id}/desasignar")]
[Authorize(Roles = Roles.Administrador)]
public async Task<IActionResult> DesasignarTecnico(int id)
{
    var incidencia = await _context.Incidencias.FindAsync(id);

    if (incidencia == null)
    {
        return NotFound("Incidencia no encontrada");
    }

    incidencia.TecnicoId = null;

    await _context.SaveChangesAsync();

    return Ok(new
    {
        mensaje = "Tecnico desasignado correctamente",
        incidenciaId = incidencia.Id,
        tecnicoId = incidencia.TecnicoId
    });
}


private int? ObtenerUsuarioId()
{
    var idTexto = User.FindFirstValue("sub");

    if (int.TryParse(idTexto, out var id))
    {
        return id;
    }

    return null;
}

[HttpGet("mis-incidencias")]
public async Task<IActionResult> ObtenerMisIncidencias()
{
    var usuarioId = ObtenerUsuarioId();

    if (usuarioId == null)
    {
        return Unauthorized("No se pudo identificar al usuario");
    }

    var incidencias = await _context.Incidencias
        .AsNoTracking()
        .Where(i => i.UsuarioCreadorId == usuarioId.Value)
        .OrderByDescending(i => i.FechaCreacion)
        .ThenByDescending(i => i.Id)
        .Select(i => new IncidenciaRespuestaDto
        {
            Id = i.Id,
            Titulo = i.Titulo,
            Descripcion = i.Descripcion,
            Prioridad = i.Prioridad,
            Estado = i.Estado,
            FechaCreacion = i.FechaCreacion,
            TecnicoId = i.TecnicoId,
            TecnicoNombre = i.Tecnico != null
                ? i.Tecnico.Nombre
                : null,
            UsuarioCreadorId = i.UsuarioCreadorId,
            UsuarioCreadorNombre = i.UsuarioCreador != null
                ? i.UsuarioCreador.Nombre
                : null
        })
        .ToListAsync();

    return Ok(incidencias);
}



[HttpPatch("{id}/estado")]
[Authorize(Roles = Roles.Tecnico)]
public async Task<IActionResult> CambiarEstado(
    int id,
    [FromBody] CambiarEstadoIncidenciaDto datos)
{
    // Obtener el ID del usuario autenticado
    var usuarioIdTexto = User.FindFirstValue("sub");

    if (!int.TryParse(usuarioIdTexto, out var usuarioId))
    {
        return Unauthorized();
    }

    // Buscar el tecnico vinculado al usuario
    var tecnico = await _context.Tecnicos
        .FirstOrDefaultAsync(t => t.UsuarioId == usuarioId);

    if (tecnico == null)
    {
        return Forbid();
    }

    // Buscar la incidencia
    var incidencia = await _context.Incidencias
        .FirstOrDefaultAsync(i => i.Id == id);

    if (incidencia == null)
    {
        return NotFound("Incidencia no encontrada");
    }

    // Verificar que pertenezca al tecnico
    if (incidencia.TecnicoId != tecnico.Id)
    {
        return NotFound("Incidencia no encontrada");
    }

    // Actualizar el estado utilizando el servicio
    try
    {
        var cambioRealizado = _servicioEstado.CambiarEstado(
            incidencia,
            datos.Estado,
            usuarioId);

        if (!cambioRealizado)
        {
            return BadRequest(
                "La incidencia ya tiene ese estado");
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensaje = "Estado actualizado correctamente",
            incidenciaId = incidencia.Id,
            estado = incidencia.Estado,
            tecnicoId = tecnico.Id
        });
    }
    catch (ArgumentException ex)
    {
        return BadRequest(ex.Message);
    }
}


[HttpGet("{id}/historial")]
[Authorize]
public async Task<IActionResult> ObtenerHistorial(int id)
{
    var usuarioIdTexto = User.FindFirstValue("sub");

    if (!int.TryParse(usuarioIdTexto, out var usuarioId))
    {
        return Unauthorized();
    }

    var esAdministrador = User.IsInRole(Roles.Administrador);

    var tecnicoId = await _context.Tecnicos
        .Where(t => t.UsuarioId == usuarioId)
        .Select(t => (int?)t.Id)
        .FirstOrDefaultAsync();

    // Comprobar permisos antes de mostrar el historial
    var puedeConsultar = await _context.Incidencias.AnyAsync(i =>
        i.Id == id &&
        (
            esAdministrador ||
            i.UsuarioCreadorId == usuarioId ||
            (tecnicoId.HasValue && i.TecnicoId == tecnicoId.Value)
        ));

    if (!puedeConsultar)
    {
        return NotFound("Incidencia no encontrada");
    }

    var historial = await _context.HistorialEstados
        .AsNoTracking()
        .Where(h => h.IncidenciaId == id)
        .OrderByDescending(h => h.FechaCambio)
        .ThenByDescending(h => h.Id)
        .Select(h => new HistorialEstadoRespuestaDto
        {
            Id = h.Id,
            IncidenciaId = h.IncidenciaId,
            UsuarioNombre = h.Usuario.Nombre,
            EstadoAnterior = h.EstadoAnterior,
            EstadoNuevo = h.EstadoNuevo,
            FechaCambio = h.FechaCambio
        })
        .ToListAsync();

    return Ok(historial);
}
}
