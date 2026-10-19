
using HelpDesk.Api.Data;
using HelpDesk.Api.Models;

namespace HelpDesk.Api.Services;

public class ServicioEstadoIncidencia
{
    private readonly HelpDeskDbContext _context;

    public ServicioEstadoIncidencia(HelpDeskDbContext context)
    {
        _context = context;
    }

    public static readonly string[] EstadosPermitidos =
    {
        "Abierta",
        "En progreso",
        "Resuelta",
        "Cerrada"
    };

    public bool CambiarEstado(
        Incidencia incidencia,
        string? nuevoEstado,
        int usuarioId)
    {
        // Comprobar que el estado sea valido
        var estadoNormalizado = EstadosPermitidos
            .FirstOrDefault(e => e.Equals(
                nuevoEstado?.Trim(),
                StringComparison.OrdinalIgnoreCase));

        if (estadoNormalizado == null)
        {
            throw new ArgumentException(
                "Estado invalido. Use: Abierta, En progreso, Resuelta o Cerrada");
        }

        // No registrar cambios repetidos
        if (incidencia.Estado == estadoNormalizado)
        {
            return false;
        }

        var estadoAnterior = incidencia.Estado;

        // Modificar la incidencia
        incidencia.Estado = estadoNormalizado;

        // Registrar el cambio
        _context.HistorialEstados.Add(new HistorialEstado
        {
            IncidenciaId = incidencia.Id,
            UsuarioId = usuarioId,
            EstadoAnterior = estadoAnterior,
            EstadoNuevo = estadoNormalizado,
            FechaCambio = DateTime.UtcNow
        });

        return true;
    }
}
