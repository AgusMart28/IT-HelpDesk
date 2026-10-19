
namespace HelpDesk.Api.DTOs;

public class HistorialEstadoRespuestaDto
{
    public int Id { get; set; }
    public int IncidenciaId { get; set; }

    public string UsuarioNombre { get; set; } = string.Empty;

    public string EstadoAnterior { get; set; } = string.Empty;
    public string EstadoNuevo { get; set; } = string.Empty;

    public DateTime FechaCambio { get; set; }
}
