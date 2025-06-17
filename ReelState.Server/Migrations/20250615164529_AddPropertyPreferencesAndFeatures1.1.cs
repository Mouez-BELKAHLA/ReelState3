using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ReelState.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddPropertyPreferencesAndFeatures11 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PropertyFeatures",
                table: "Properties",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PropertyPreferences",
                table: "Properties",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "UploadToFacebook",
                table: "Properties",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "UploadToInstagram",
                table: "Properties",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "UploadToTikTok",
                table: "Properties",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "UploadToYouTube",
                table: "Properties",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PropertyFeatures",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "PropertyPreferences",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "UploadToFacebook",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "UploadToInstagram",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "UploadToTikTok",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "UploadToYouTube",
                table: "Properties");
        }
    }
}
