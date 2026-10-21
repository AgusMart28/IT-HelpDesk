using System.ComponentModel.DataAnnotations;

namespace HelpDesk.Api.DTOs;

public class CrearCuentaTecnicoDto
{
    [Range(1, int.MaxValue, ErrorMessage = "Seleccioná un técnico válido")]
    public int TecnicoId { get; set; }

    [Required(ErrorMessage = "La contraseña es obligatoria")]
    [StringLength(128, MinimumLength = 8)]
    public string Password { get; set; } = string.Empty;
}