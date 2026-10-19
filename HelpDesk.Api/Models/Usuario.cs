
namespace HelpDesk.Api.Models;

public class Usuario
{
    public int Id { get; set; }

    public string Nombre { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public string Rol { get; set; } = "Usuario";

    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;
    
    public List<Incidencia> IncidenciasCreadas { get; set; } = new();
    
    public Tecnico? Tecnico { get; set; }


}
