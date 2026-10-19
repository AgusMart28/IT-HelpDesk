using HelpDesk.Api.Data;
using HelpDesk.Api.DTOs;
using HelpDesk.Api.Models;
using HelpDesk.Api.Security;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;


namespace HelpDesk.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly HelpDeskDbContext _context;
    private readonly IPasswordHasher<Usuario> _passwordHasher;
    private readonly IConfiguration _configuration;


    
    public AuthController(
        HelpDeskDbContext context,
        IPasswordHasher<Usuario> passwordHasher,
        IConfiguration configuration)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _configuration = configuration;
    }


    [HttpPost("registro")]
    public async Task<IActionResult> Registrar(
        RegistroUsuarioDto datos)
    {
        // Normalizar los datos
        var nombre = datos.Nombre.Trim();
        var email = datos.Email.Trim().ToLowerInvariant();

        if (nombre.Length < 3)
        {
            return BadRequest(
                "El nombre debe tener al menos 3 caracteres");
        }

        // Comprobar si el email ya existe
        var emailExiste = await _context.Usuarios
            .AnyAsync(u => u.Email == email);

        if (emailExiste)
        {
            return Conflict(
                "Ya existe un usuario con ese email");
        }

        // Crear el usuario
        var usuario = new Usuario
        {
            Nombre = nombre,
            Email = email,
            Rol = Roles.Usuario,
            FechaRegistro = DateTime.UtcNow
        };

        // Generar el hash de la contraseña
        usuario.PasswordHash =
            _passwordHasher.HashPassword(
                usuario,
                datos.Password
            );

        // Guardar en PostgreSQL
        _context.Usuarios.Add(usuario);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
            when (ex.InnerException is PostgresException
                { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            return Conflict(
                "Ya existe un usuario con ese email");
        }

        // Preparar respuesta sin contraseña
        var respuesta = new UsuarioRespuestaDto
        {
            Id = usuario.Id,
            Nombre = usuario.Nombre,
            Email = usuario.Email,
            Rol = usuario.Rol,
            FechaRegistro = usuario.FechaRegistro
        };

        return StatusCode(
            StatusCodes.Status201Created,
            respuesta
        );
    }

    
[HttpPost("login")]
public async Task<IActionResult> Login(LoginUsuarioDto datos)
{
    var email = datos.Email.Trim().ToLowerInvariant();

    // Buscar el usuario en PostgreSQL
    var usuario = await _context.Usuarios
        .FirstOrDefaultAsync(u => u.Email == email);

    if (usuario == null)
    {
        return Unauthorized("Credenciales incorrectas");
    }

    // Verificar la contraseña contra su hash
    var resultado = _passwordHasher.VerifyHashedPassword(
        usuario,
        usuario.PasswordHash,
        datos.Password
    );

    if (resultado == PasswordVerificationResult.Failed)
    {
        return Unauthorized("Credenciales incorrectas");
    }

    // Actualizar el hash si el algoritmo lo recomienda
    if (resultado == PasswordVerificationResult.SuccessRehashNeeded)
    {
        usuario.PasswordHash = _passwordHasher.HashPassword(
            usuario,
            datos.Password
        );

        await _context.SaveChangesAsync();
    }

    // Leer la configuración JWT
    var jwtKey = _configuration["Jwt:Key"]!;
    var jwtIssuer = _configuration["Jwt:Issuer"]!;
    var jwtAudience = _configuration["Jwt:Audience"]!;

    var clave = new SymmetricSecurityKey(
        Convert.FromBase64String(jwtKey));

    var credenciales = new SigningCredentials(
        clave,
        SecurityAlgorithms.HmacSha256);

    // Información que incluiremos en el token
    var claims = new List<Claim>
    {
        new Claim(JwtRegisteredClaimNames.Sub,
            usuario.Id.ToString()),

        new Claim(JwtRegisteredClaimNames.Email,
            usuario.Email),

        new Claim("name", usuario.Nombre),

        new Claim("role", usuario.Rol),

        new Claim(JwtRegisteredClaimNames.Jti,
            Guid.NewGuid().ToString())
    };

    var expiracion = DateTime.UtcNow.AddHours(1);

    // Generar el JWT
    var token = new JwtSecurityToken(
        issuer: jwtIssuer,
        audience: jwtAudience,
        claims: claims,
        expires: expiracion,
        signingCredentials: credenciales
    );

    var tokenString = new JwtSecurityTokenHandler()
        .WriteToken(token);

    var respuesta = new LoginRespuestaDto
    {
        Token = tokenString,
        TipoToken = "Bearer",
        ExpiraEn = expiracion,

        Usuario = new UsuarioRespuestaDto
        {
            Id = usuario.Id,
            Nombre = usuario.Nombre,
            Email = usuario.Email,
            Rol = usuario.Rol,
            FechaRegistro = usuario.FechaRegistro
        }
    };

    return Ok(respuesta);
}

[HttpGet("perfil")]
[Microsoft.AspNetCore.Authorization.Authorize]
public IActionResult ObtenerPerfil()
{
    var id = User.FindFirst("sub")?.Value;
    var nombre = User.FindFirst("name")?.Value;
    var email = User.FindFirst("email")?.Value;
    var rol = User.FindFirst("role")?.Value;

    return Ok(new
    {
        id,
        nombre,
        email,
        rol
    });
}


}
