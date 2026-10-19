
namespace HelpDesk.Api.Models;

public class Tecnico
{
    public int Id { get; set; }

    public string Nombre { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Especialidad { get; set; } = string.Empty;

    public List<Incidencia> Incidencias { get; set; } = new();

    public int? UsuarioId { get; set; }

    public Usuario? Usuario { get; set; }

}
