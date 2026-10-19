
namespace HelpDesk.Api.DTOs;

public class LoginRespuestaDto
{
    public string Token { get; set; } = string.Empty;

    public string TipoToken { get; set; } = "Bearer";

    public DateTime ExpiraEn { get; set; }

    public UsuarioRespuestaDto Usuario { get; set; } = new();
}
