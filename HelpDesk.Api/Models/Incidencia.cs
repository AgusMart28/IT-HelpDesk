
namespace HelpDesk.Api.Models;

public class Incidencia
{
    public int Id { get; set; }

    public string Titulo { get; set; } = string.Empty;

    public string Descripcion { get; set; } = string.Empty;

    public string Prioridad { get; set; } = "Media";

    public string Estado { get; set; } = "Abierta";

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;


    // ID del tecnico asignado (puede ser null)
    public int? TecnicoId { get; set; }

    // Relacion con el tecnico
    public Tecnico? Tecnico { get; set; }

    
    public int? UsuarioCreadorId { get; set; }

    public Usuario? UsuarioCreador { get; set; }
    
    public List<HistorialEstado> HistorialEstados { get; set; } = new();
   
    public List<Comentario> Comentarios { get; set; } = new();




}
