
using System.ComponentModel.DataAnnotations;

namespace HelpDesk.Api.DTOs;

public class AsignarTecnicoDto
{
    [Required(ErrorMessage = "El tecnicoId es obligatorio")]
    [Range(1, int.MaxValue,
        ErrorMessage = "El tecnicoId debe ser mayor a cero")]
    public int? TecnicoId { get; set; }
}
