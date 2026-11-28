using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Warehouse.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddImageStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_WarehouseImages_WarehouseListingId",
                table: "WarehouseImages");

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "WarehouseImages",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Approved");

            migrationBuilder.CreateIndex(
                name: "IX_WarehouseImages_WarehouseListingId_Status",
                table: "WarehouseImages",
                columns: new[] { "WarehouseListingId", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_WarehouseImages_WarehouseListingId_Status",
                table: "WarehouseImages");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "WarehouseImages");

            migrationBuilder.CreateIndex(
                name: "IX_WarehouseImages_WarehouseListingId",
                table: "WarehouseImages",
                column: "WarehouseListingId");
        }
    }
}
