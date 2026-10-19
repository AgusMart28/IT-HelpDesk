
namespace HelpDesk.Api.Models;

public class Comentario
{
    public int Id { get; set; }

    public int IncidenciaId { get; set; }
    public Incidencia Incidencia { get; set; } = null!;

    public int UsuarioId { get; set; }
    public Usuario Usuario { get; set; } = null!;

    public string Mensaje { get; set; } = string.Empty;

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
}
