
using System.ComponentModel.DataAnnotations;

namespace HelpDesk.Api.DTOs;

public class CambiarEstadoIncidenciaDto
{
    [Required]
    public string Estado { get; set; } = string.Empty;
}
