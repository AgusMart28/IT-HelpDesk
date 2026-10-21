using System.ComponentModel.DataAnnotations;

namespace HelpDesk.Api.DTOs;

public class RegistroUsuarioDto
{
    [Required(ErrorMessage = "El nombre es obligatorio")]
    [StringLength(100, MinimumLength = 3)]
    public string Nombre { get; set; } = string.Empty;

    [Required(ErrorMessage = "El email es obligatorio")]
    [EmailAddress(ErrorMessage = "El email no es valido")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "La contraseña es obligatoria")]
    [MinLength(8, ErrorMessage = "La contraseña debe tener al menos 8 caracteres")]
    [MaxLength(128, ErrorMessage = "La contraseña es demasiado larga")]
    public string Password { get; set; } = string.Empty;
}
