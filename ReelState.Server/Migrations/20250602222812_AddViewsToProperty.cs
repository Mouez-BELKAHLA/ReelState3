using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ReelState.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddViewsToProperty : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Views",
                table: "Properties",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Views",
                table: "Properties");
        }
    }
}
