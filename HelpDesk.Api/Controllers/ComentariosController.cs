using System.Security.Claims;
using HelpDesk.Api.Data;
using HelpDesk.Api.DTOs;
using HelpDesk.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HelpDesk.Api.Security;

namespace HelpDesk.Api.Controllers;

[ApiController]
[Route("api/incidencias/{incidenciaId:int}/comentarios")]
[Authorize]
public class ComentariosController : ControllerBase
{
    private readonly HelpDeskDbContext _context;

    public ComentariosController(HelpDeskDbContext context)
    {
        _context = context;
    }

    private int? ObtenerUsuarioId()
    {
        var idTexto = User.FindFirstValue("sub");

        return int.TryParse(idTexto, out var id)
            ? id
            : null;
    }

    private async Task<bool> TieneAcceso(
        int incidenciaId,
        int usuarioId)
    {
        var esAdministrador =
            User.IsInRole(Roles.Administrador);

        var tecnicoId = await _context.Tecnicos
            .Where(t => t.UsuarioId == usuarioId)
            .Select(t => (int?)t.Id)
            .FirstOrDefaultAsync();

        return await _context.Incidencias.AnyAsync(i =>
            i.Id == incidenciaId &&
            (
                esAdministrador ||
                i.UsuarioCreadorId == usuarioId ||
                (tecnicoId.HasValue &&
                 i.TecnicoId == tecnicoId.Value)
            ));
    }

    [HttpGet]
    public async Task<IActionResult> ObtenerComentarios(
        int incidenciaId)
    {
        var usuarioId = ObtenerUsuarioId();

        if (!usuarioId.HasValue)
            return Unauthorized();

        if (!await TieneAcceso(incidenciaId, usuarioId.Value))
            return NotFound("Incidencia no encontrada");

        var comentarios = await _context.Comentarios
            .AsNoTracking()
            .Where(c => c.IncidenciaId == incidenciaId)
            .OrderBy(c => c.FechaCreacion)
            .ThenBy(c => c.Id)
            .Select(c => new ComentarioRespuestaDto
            {
                Id = c.Id,
                IncidenciaId = c.IncidenciaId,
                UsuarioId = c.UsuarioId,
                UsuarioNombre = c.Usuario.Nombre,
                Mensaje = c.Mensaje,
                FechaCreacion = c.FechaCreacion
            })
            .ToListAsync();

        return Ok(comentarios);
    }

    [HttpPost]
    public async Task<IActionResult> CrearComentario(
        int incidenciaId,
        [FromBody] CrearComentarioDto datos)
    {
        var usuarioId = ObtenerUsuarioId();

        if (!usuarioId.HasValue)
            return Unauthorized();

        if (!await TieneAcceso(incidenciaId, usuarioId.Value))
            return NotFound("Incidencia no encontrada");

        if (string.IsNullOrWhiteSpace(datos.Mensaje))
            return BadRequest("El mensaje no puede estar vacio");

        var usuario = await _context.Usuarios
            .FindAsync(usuarioId.Value);

        if (usuario == null)
            return Unauthorized();

        var comentario = new Comentario
        {
            IncidenciaId = incidenciaId,
            UsuarioId = usuarioId.Value,
            Mensaje = datos.Mensaje.Trim(),
            FechaCreacion = DateTime.UtcNow
        };

        _context.Comentarios.Add(comentario);

        await _context.SaveChangesAsync();

        return Ok(new ComentarioRespuestaDto
        {
            Id = comentario.Id,
            IncidenciaId = comentario.IncidenciaId,
            UsuarioId = comentario.UsuarioId,
            UsuarioNombre = usuario.Nombre,
            Mensaje = comentario.Mensaje,
            FechaCreacion = comentario.FechaCreacion
        });
    }
}
