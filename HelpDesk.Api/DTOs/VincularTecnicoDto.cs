
using System.ComponentModel.DataAnnotations;

namespace HelpDesk.Api.DTOs;

public class VincularTecnicoDto
{
    [Required]
    [Range(1, int.MaxValue)]
    public int? UsuarioId { get; set; }
}
