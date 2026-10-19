
using System.ComponentModel.DataAnnotations;

namespace HelpDesk.Api.DTOs;

public class CrearTecnicoDto
{
    [Required(ErrorMessage = "El nombre es obligatorio")]
    [StringLength(100, MinimumLength = 3)]
    public string Nombre { get; set; } = string.Empty;

    [Required(ErrorMessage = "El email es obligatorio")]
    [EmailAddress(ErrorMessage = "El email no es valido")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "La especialidad es obligatoria")]
    [StringLength(100, MinimumLength = 3)]
    public string Especialidad { get; set; } = string.Empty;
}
