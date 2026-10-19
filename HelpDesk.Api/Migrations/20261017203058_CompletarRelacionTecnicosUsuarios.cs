using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HelpDesk.Api.Migrations
{
    /// <inheritdoc />
    public partial class CompletarRelacionTecnicosUsuarios : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "UsuarioId",
                table: "Tecnicos",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tecnicos_UsuarioId",
                table: "Tecnicos",
                column: "UsuarioId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Tecnicos_Usuarios_UsuarioId",
                table: "Tecnicos",
                column: "UsuarioId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tecnicos_Usuarios_UsuarioId",
                table: "Tecnicos");

            migrationBuilder.DropIndex(
                name: "IX_Tecnicos_UsuarioId",
                table: "Tecnicos");

            migrationBuilder.DropColumn(
                name: "UsuarioId",
                table: "Tecnicos");
        }
    }
}
