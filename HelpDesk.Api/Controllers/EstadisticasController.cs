
using HelpDesk.Api.Data;
using HelpDesk.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HelpDesk.Api.Controllers;

[ApiController]
[Route("api/estadisticas")]
[Authorize(Roles = Roles.Administrador)]
public class EstadisticasController : ControllerBase
{
    private readonly HelpDeskDbContext _context;

    public EstadisticasController(HelpDeskDbContext context)
    {
        _context = context;
    }

    [HttpGet("resumen")]
    public async Task<IActionResult> ObtenerResumen()
    {
        var incidencias = _context.Incidencias.AsNoTracking();

        var resumen = new
        {
            totalIncidencias = await incidencias.CountAsync(),

            abiertas = await incidencias.CountAsync(
                i => i.Estado == "Abierta"),

            enProgreso = await incidencias.CountAsync(
                i => i.Estado == "En progreso"),

            resueltas = await incidencias.CountAsync(
                i => i.Estado == "Resuelta"),

            cerradas = await incidencias.CountAsync(
                i => i.Estado == "Cerrada"),

            sinAsignar = await incidencias.CountAsync(
                i => i.TecnicoId == null),

            totalTecnicos = await _context.Tecnicos.CountAsync(),

            totalUsuarios = await _context.Usuarios.CountAsync()
        };

        return Ok(resumen);
    }

    
[HttpGet("prioridades")]
public async Task<IActionResult> ObtenerPorPrioridad()
{
    var prioridades = await _context.Incidencias
        .AsNoTracking()
        .GroupBy(i => i.Prioridad)
        .Select(g => new
        {
            prioridad = g.Key,
            cantidad = g.Count()
        })
        .OrderByDescending(x => x.cantidad)
        .ToListAsync();

    return Ok(prioridades);
}


[HttpGet("tecnicos")]
public async Task<IActionResult> ObtenerEstadisticasTecnicos()
{
    var estadisticas = await _context.Tecnicos
        .AsNoTracking()
        .Select(t => new
        {
            tecnicoId = t.Id,
            nombre = t.Nombre,
            especialidad = t.Especialidad,

            totalAsignadas = t.Incidencias.Count(),

            abiertas = t.Incidencias.Count(
                i => i.Estado == "Abierta"),

            enProgreso = t.Incidencias.Count(
                i => i.Estado == "En progreso"),

            resueltas = t.Incidencias.Count(
                i => i.Estado == "Resuelta"),

            cerradas = t.Incidencias.Count(
                i => i.Estado == "Cerrada")
        })
        .OrderByDescending(t => t.totalAsignadas)
        .ToListAsync();

    return Ok(estadisticas);
}


}
