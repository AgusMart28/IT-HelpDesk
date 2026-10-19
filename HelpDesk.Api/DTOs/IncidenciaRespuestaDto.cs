
namespace HelpDesk.Api.DTOs;

public class IncidenciaRespuestaDto
{
    public int Id { get; set; }

    public string Titulo { get; set; } = string.Empty;

    public string Descripcion { get; set; } = string.Empty;

    public string Prioridad { get; set; } = string.Empty;

    public string Estado { get; set; } = string.Empty;

    public DateTime FechaCreacion { get; set; }

    public int? TecnicoId { get; set; }

    public string? TecnicoNombre { get; set; }
    
    public int? UsuarioCreadorId { get; set; }

    public string? UsuarioCreadorNombre { get; set; }

}
