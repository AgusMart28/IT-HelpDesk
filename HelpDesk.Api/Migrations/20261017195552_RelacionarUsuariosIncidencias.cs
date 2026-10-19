using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HelpDesk.Api.Migrations
{
    /// <inheritdoc />
    public partial class RelacionarUsuariosIncidencias : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "UsuarioCreadorId",
                table: "Incidencias",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Incidencias_UsuarioCreadorId",
                table: "Incidencias",
                column: "UsuarioCreadorId");

            migrationBuilder.AddForeignKey(
                name: "FK_Incidencias_Usuarios_UsuarioCreadorId",
                table: "Incidencias",
                column: "UsuarioCreadorId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Incidencias_Usuarios_UsuarioCreadorId",
                table: "Incidencias");

            migrationBuilder.DropIndex(
                name: "IX_Incidencias_UsuarioCreadorId",
                table: "Incidencias");

            migrationBuilder.DropColumn(
                name: "UsuarioCreadorId",
                table: "Incidencias");
        }
    }
}
