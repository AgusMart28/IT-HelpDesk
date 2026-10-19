
namespace HelpDesk.Api.DTOs;

public class ComentarioRespuestaDto
{
    public int Id { get; set; }
    public int IncidenciaId { get; set; }
    public int UsuarioId { get; set; }

    public string UsuarioNombre { get; set; } = string.Empty;
    public string Mensaje { get; set; } = string.Empty;

    public DateTime FechaCreacion { get; set; }
}
