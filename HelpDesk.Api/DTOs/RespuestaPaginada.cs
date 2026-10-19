
namespace HelpDesk.Api.DTOs;

public class RespuestaPaginadaDto<T>
{
    public int Pagina { get; set; }

    public int TamanoPagina { get; set; }

    public int TotalRegistros { get; set; }

    public int TotalPaginas { get; set; }

    public List<T> Datos { get; set; } = new();
}
