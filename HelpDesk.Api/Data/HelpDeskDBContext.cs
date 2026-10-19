
using HelpDesk.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HelpDesk.Api.Data;

public class HelpDeskDbContext : DbContext
{
    public HelpDeskDbContext(
        DbContextOptions<HelpDeskDbContext> options
    ) : base(options)
    {
    }

    public DbSet<Incidencia> Incidencias { get; set; } = null!;

    public DbSet<Tecnico> Tecnicos { get; set; } = null!;

    public DbSet<Usuario> Usuarios { get; set; } = null!;
    
    public DbSet<HistorialEstado> HistorialEstados { get; set; }

    public DbSet<Comentario> Comentarios { get; set; }

    
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);

    modelBuilder.Entity<Usuario>()
        .HasIndex(u => u.Email)
        .IsUnique();

    
    modelBuilder.Entity<Incidencia>()
        .HasOne(i => i.UsuarioCreador)
        .WithMany(u => u.IncidenciasCreadas)
        .HasForeignKey(i => i.UsuarioCreadorId)
        .OnDelete(DeleteBehavior.Restrict);

    
    modelBuilder.Entity<Tecnico>()
        .HasOne(t => t.Usuario)
        .WithOne(u => u.Tecnico)
        .HasForeignKey<Tecnico>(t => t.UsuarioId)
        .OnDelete(DeleteBehavior.Restrict);

    modelBuilder.Entity<Tecnico>()
        .HasIndex(t => t.UsuarioId)
        .IsUnique();

    modelBuilder.Entity<HistorialEstado>()
        .HasOne(h => h.Incidencia)
        .WithMany(i => i.HistorialEstados)
        .HasForeignKey(h => h.IncidenciaId)
        .OnDelete(DeleteBehavior.Cascade);

    modelBuilder.Entity<HistorialEstado>()
        .HasOne(h => h.Usuario)
        .WithMany()
        .HasForeignKey(h => h.UsuarioId)
        .OnDelete(DeleteBehavior.Restrict);

    modelBuilder.Entity<Comentario>()
        .HasOne(c => c.Incidencia)
        .WithMany(i => i.Comentarios)
        .HasForeignKey(c => c.IncidenciaId)
        .OnDelete(DeleteBehavior.Cascade);

    modelBuilder.Entity<Comentario>()
        .HasOne(c => c.Usuario)
        .WithMany()
        .HasForeignKey(c => c.UsuarioId)
        .OnDelete(DeleteBehavior.Restrict);


}




}

