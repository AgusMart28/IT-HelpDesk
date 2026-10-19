
using System.ComponentModel.DataAnnotations;

namespace HelpDesk.Api.DTOs;

public class FiltroIncidenciasDto
{
    public string? Estado { get; set; }

    public string? Prioridad { get; set; }

    public string? Buscar { get; set; }

    [Range(1, int.MaxValue,
        ErrorMessage = "La pagina debe ser mayor a cero")]
    public int Pagina { get; set; } = 1;

    [Range(1, 100,
        ErrorMessage = "El tamaño debe estar entre 1 y 100")]
    public int TamanoPagina { get; set; } = 10;

    public string OrdenarPor { get; set; } = "fecha";

    public string Direccion { get; set; } = "desc";
}
