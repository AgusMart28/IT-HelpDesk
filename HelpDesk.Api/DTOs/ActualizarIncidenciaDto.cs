
using System.ComponentModel.DataAnnotations;

namespace HelpDesk.Api.DTOs;

public class ActualizarIncidenciaDto
{
    [Required(ErrorMessage = "El titulo es obligatorio")]
    [StringLength(100, MinimumLength = 5,
        ErrorMessage = "El titulo debe tener entre 5 y 100 caracteres")]
    public string Titulo { get; set; } = string.Empty;

    [Required(ErrorMessage = "La descripcion es obligatoria")]
    [StringLength(1000, MinimumLength = 10,
        ErrorMessage = "La descripcion debe tener entre 10 y 1000 caracteres")]
    public string Descripcion { get; set; } = string.Empty;

    [Required(ErrorMessage = "La prioridad es obligatoria")]
    [RegularExpression("^(Baja|Media|Alta)$",
        ErrorMessage = "La prioridad debe ser Baja, Media o Alta")]
    public string Prioridad { get; set; } = string.Empty;

    
[Required(ErrorMessage = "El estado es obligatorio")]
[RegularExpression(
    @"^(Abierta|En progreso|Resuelta|Cerrada)$",
    ErrorMessage = "El estado no es valido")]
public string Estado { get; set; } = "Abierta";

}
