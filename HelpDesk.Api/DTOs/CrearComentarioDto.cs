
using System.ComponentModel.DataAnnotations;

namespace HelpDesk.Api.DTOs;

public class CrearComentarioDto
{
    [Required(ErrorMessage = "El mensaje es obligatorio")]
    [StringLength(2000, MinimumLength = 1)]
    public string Mensaje { get; set; } = string.Empty;
}
