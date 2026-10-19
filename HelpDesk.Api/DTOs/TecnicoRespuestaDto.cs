
namespace HelpDesk.Api.DTOs;

public class TecnicoRespuestaDto
{
    public int Id { get; set; }

    public string Nombre { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Especialidad { get; set; } = string.Empty;
}
