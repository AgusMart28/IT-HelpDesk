
using HelpDesk.Api.Data;
using HelpDesk.Api.DTOs;
using HelpDesk.Api.Models;
using HelpDesk.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace HelpDesk.Api.Controllers;

[ApiController]
[Route("api/admin/usuarios")]
[Authorize(Roles = Roles.Administrador)]
public class UsuariosAdminController : ControllerBase
{
    private readonly HelpDeskDbContext _context;
    private readonly IPasswordHasher<Usuario> _passwordHasher;

    public UsuariosAdminController(
        HelpDeskDbContext context,
        IPasswordHasher<Usuario> passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    [HttpPost("crear-cuenta-tecnico")]
    public async Task<IActionResult> CrearCuentaTecnico(
        CrearCuentaTecnicoDto datos)
    {
        var tecnico = await _context.Tecnicos
            .FirstOrDefaultAsync(t => t.Id == datos.TecnicoId);

        if (tecnico == null)
            return NotFound("Técnico no encontrado");

        if (tecnico.UsuarioId != null)
            return Conflict("Este técnico ya tiene una cuenta vinculada");

        var email = tecnico.Email.Trim().ToLowerInvariant();

        var emailExiste = await _context.Usuarios
            .AnyAsync(u => u.Email == email);

        if (emailExiste)
            return Conflict("Ya existe una cuenta con ese correo");

        var usuario = new Usuario
        {
            Nombre = tecnico.Nombre,
            Email = email,
            Rol = Roles.Tecnico,
            FechaRegistro = DateTime.UtcNow
        };

        usuario.PasswordHash = _passwordHasher.HashPassword(
            usuario,
            datos.Password
        );

        tecnico.Usuario = usuario;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
            when (ex.InnerException is PostgresException
                { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            return Conflict("El correo o la vinculación ya existe");
        }

        return StatusCode(
            StatusCodes.Status201Created,
            new
            {
                mensaje = "Cuenta de técnico creada y vinculada",
                tecnicoId = tecnico.Id,
                usuarioId = usuario.Id,
                nombre = usuario.Nombre,
                email = usuario.Email,
                rol = usuario.Rol
            }
        );
    }
}
