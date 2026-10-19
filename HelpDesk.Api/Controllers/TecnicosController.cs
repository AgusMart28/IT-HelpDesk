
using HelpDesk.Api.Data;
using HelpDesk.Api.DTOs;
using HelpDesk.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using HelpDesk.Api.Security;
using System.Security.Claims;


namespace HelpDesk.Api.Controllers;


[ApiController]
[Route("api/tecnicos")]
[Authorize]
public class TecnicosController : ControllerBase
{
    private readonly HelpDeskDbContext _context;

    public TecnicosController(HelpDeskDbContext context)
    {
        _context = context;
    }

    // GET: api/tecnicos
    [HttpGet]
    [Authorize(Roles = Roles.Administrador)]
    public async Task<IActionResult> ObtenerTodos()
    {
        var tecnicos = await _context.Tecnicos
            .AsNoTracking()
            .OrderBy(t => t.Nombre)
            .Select(t => new TecnicoRespuestaDto
            {
                Id = t.Id,
                Nombre = t.Nombre,
                Email = t.Email,
                Especialidad = t.Especialidad
            })
            .ToListAsync();

        return Ok(tecnicos);
    }

    // GET: api/tecnicos/1
    [HttpGet("{id}")]
    [Authorize(Roles = Roles.Administrador)]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var tecnico = await _context.Tecnicos
            .AsNoTracking()
            .Where(t => t.Id == id)
            .Select(t => new TecnicoRespuestaDto
            {
                Id = t.Id,
                Nombre = t.Nombre,
                Email = t.Email,
                Especialidad = t.Especialidad
            })
            .FirstOrDefaultAsync();

        if (tecnico == null)
            return NotFound("Tecnico no encontrado");

        return Ok(tecnico);
    }

    // POST: api/tecnicos
    [HttpPost]
    [Authorize(Roles = Roles.Administrador)]
    public async Task<IActionResult> Crear(CrearTecnicoDto datos)
    {
        var emailExiste = await _context.Tecnicos
            .AnyAsync(t => t.Email == datos.Email);

        if (emailExiste)
            return Conflict("Ya existe un tecnico con ese email");

        var tecnico = new Tecnico
        {
            Nombre = datos.Nombre,
            Email = datos.Email,
            Especialidad = datos.Especialidad
        };

        _context.Tecnicos.Add(tecnico);
        await _context.SaveChangesAsync();

        var respuesta = new TecnicoRespuestaDto
        {
            Id = tecnico.Id,
            Nombre = tecnico.Nombre,
            Email = tecnico.Email,
            Especialidad = tecnico.Especialidad
        };

        return CreatedAtAction(
            nameof(ObtenerPorId),
            new { id = tecnico.Id },
            respuesta
        );
    }

    // PUT: api/tecnicos/1
    [HttpPut("{id}")]
    [Authorize(Roles = Roles.Administrador)]
    public async Task<IActionResult> Actualizar(
        int id, ActualizarTecnicoDto datos)
    {
        var tecnico = await _context.Tecnicos.FindAsync(id);

        if (tecnico == null)
            return NotFound("Tecnico no encontrado");

        var emailExiste = await _context.Tecnicos
            .AnyAsync(t => t.Email == datos.Email && t.Id != id);

        if (emailExiste)
            return Conflict("Ya existe otro tecnico con ese email");

        tecnico.Nombre = datos.Nombre;
        tecnico.Email = datos.Email;
        tecnico.Especialidad = datos.Especialidad;

        await _context.SaveChangesAsync();

        return Ok(new TecnicoRespuestaDto
        {
            Id = tecnico.Id,
            Nombre = tecnico.Nombre,
            Email = tecnico.Email,
            Especialidad = tecnico.Especialidad
        });
    }

    // DELETE: api/tecnicos/1
    [HttpDelete("{id}")]
    [Authorize(Roles = Roles.Administrador)]
    public async Task<IActionResult> Eliminar(int id)
    {
        var tecnico = await _context.Tecnicos.FindAsync(id);

        if (tecnico == null)
            return NotFound("Tecnico no encontrado");

        var tieneIncidencias = await _context.Incidencias
            .AnyAsync(i => i.TecnicoId == id);

        if (tieneIncidencias)
        {
            return Conflict(
                "No se puede eliminar un tecnico con incidencias asignadas");
        }

        _context.Tecnicos.Remove(tecnico);
        await _context.SaveChangesAsync();

        return NoContent();
    }


    

[HttpGet("{id}/incidencias")]
[Authorize(Roles = Roles.Administrador)]
public async Task<IActionResult> ObtenerIncidencias(int id)
{
    var tecnico = await _context.Tecnicos
        .AsNoTracking()
        .FirstOrDefaultAsync(t => t.Id == id);

    if (tecnico == null)
    {
        return NotFound("Tecnico no encontrado");
    }

    var incidencias = await _context.Incidencias
        .AsNoTracking()
        .Where(i => i.TecnicoId == id)
        .OrderByDescending(i => i.FechaCreacion)
        .Select(i => new IncidenciaRespuestaDto
        {
            Id = i.Id,
            Titulo = i.Titulo,
            Descripcion = i.Descripcion,
            Prioridad = i.Prioridad,
            Estado = i.Estado,
            FechaCreacion = i.FechaCreacion,
            TecnicoId = i.TecnicoId,
            TecnicoNombre = tecnico.Nombre,       
            UsuarioCreadorId = i.UsuarioCreadorId,
            UsuarioCreadorNombre = i.UsuarioCreador != null
                ? i.UsuarioCreador.Nombre
                : null
        })
        .ToListAsync();

    return Ok(new
    {
        tecnicoId = tecnico.Id,
        tecnicoNombre = tecnico.Nombre,
        totalIncidencias = incidencias.Count,
        incidencias
    });
}


[HttpPatch("{id}/vincular-usuario")]
[Authorize(Roles = Roles.Administrador)]
public async Task<IActionResult> VincularUsuario(
    int id,
    VincularTecnicoDto datos)
{
    var tecnico = await _context.Tecnicos
        .FirstOrDefaultAsync(t => t.Id == id);

    if (tecnico == null)
    {
        return NotFound("Tecnico no encontrado");
    }

    var usuario = await _context.Usuarios
        .FirstOrDefaultAsync(u => u.Id == datos.UsuarioId);

    if (usuario == null)
    {
        return NotFound("Usuario no encontrado");
    }

    // Comprobar que la cuenta tenga rol Tecnico
    if (usuario.Rol != Roles.Tecnico)
    {
        return BadRequest(
            "El usuario debe tener rol Tecnico");
    }

    // Evitar que una cuenta se vincule a varios técnicos
    var yaVinculado = await _context.Tecnicos
        .AnyAsync(t =>
            t.UsuarioId == datos.UsuarioId &&
            t.Id != id);

    if (yaVinculado)
    {
        return Conflict(
            "El usuario ya esta vinculado a otro tecnico");
    }

    tecnico.UsuarioId = datos.UsuarioId.Value;

    await _context.SaveChangesAsync();

    return Ok(new
    {
        mensaje = "Usuario vinculado correctamente",
        tecnicoId = tecnico.Id,
        usuarioId = tecnico.UsuarioId,
        usuarioNombre = usuario.Nombre
    });
}


[HttpGet("mis-incidencias")]
[Authorize(Roles = Roles.Tecnico)]
public async Task<IActionResult> ObtenerMisIncidencias()
{
    var idTexto = User.FindFirstValue("sub");

    if (!int.TryParse(idTexto, out var usuarioId))
    {
        return Unauthorized(
            "No se pudo identificar al usuario");
    }

    var tecnico = await _context.Tecnicos
        .AsNoTracking()
        .FirstOrDefaultAsync(t => t.UsuarioId == usuarioId);

    if (tecnico == null)
    {
        return NotFound(
            "No existe un tecnico vinculado a esta cuenta");
    }

    var incidencias = await _context.Incidencias
        .AsNoTracking()
        .Where(i => i.TecnicoId == tecnico.Id)
        .OrderByDescending(i => i.FechaCreacion)
        .Select(i => new IncidenciaRespuestaDto
        {
            Id = i.Id,
            Titulo = i.Titulo,
            Descripcion = i.Descripcion,
            Prioridad = i.Prioridad,
            Estado = i.Estado,
            FechaCreacion = i.FechaCreacion,
            TecnicoId = i.TecnicoId,
            TecnicoNombre = tecnico.Nombre,
            UsuarioCreadorId = i.UsuarioCreadorId,
            UsuarioCreadorNombre = i.UsuarioCreador != null
                ? i.UsuarioCreador.Nombre
                : null
        })
        .ToListAsync();

    return Ok(new
    {
        tecnicoId = tecnico.Id,
        tecnicoNombre = tecnico.Nombre,
        totalIncidencias = incidencias.Count,
        incidencias
    });
}


}
