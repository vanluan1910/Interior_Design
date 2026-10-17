using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InteriorDesign.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddInventoryWarehouseOperations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_warehouses_Code",
                table: "warehouses");

            migrationBuilder.DropIndex(
                name: "IX_spaces_Code",
                table: "spaces");

            migrationBuilder.DropIndex(
                name: "IX_categories_Code",
                table: "categories");

            migrationBuilder.DropIndex(
                name: "IX_branches_Code",
                table: "branches");

            // Supplier columns were already added in database initialization

            migrationBuilder.AddColumn<decimal>(
                name: "Discount",
                table: "supplier_return_slips",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "supplier_return_slips",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ItemsJson",
                table: "supplier_return_slips",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Note",
                table: "supplier_return_slips",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "PaidAmount",
                table: "supplier_return_slips",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "PaymentMethod",
                table: "supplier_return_slips",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Solution",
                table: "supplier_return_slips",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SourceImportCode",
                table: "supplier_return_slips",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "StaffName",
                table: "supplier_return_slips",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "SupplierRefund",
                table: "supplier_return_slips",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "UpdatedAt",
                table: "supplier_return_slips",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "WarehouseId",
                table: "supplier_return_slips",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WarehouseName",
                table: "supplier_return_slips",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "Discount",
                table: "stock_import_slips",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "stock_import_slips",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ItemsJson",
                table: "stock_import_slips",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Note",
                table: "stock_import_slips",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "PaidAmount",
                table: "stock_import_slips",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "RemainingDebt",
                table: "stock_import_slips",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "UnitPrice",
                table: "stock_import_slips",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "UpdatedAt",
                table: "stock_import_slips",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "WarehouseId",
                table: "stock_import_slips",
                type: "uniqueidentifier",
                nullable: true);

            // Product columns were already added in previous schema

            migrationBuilder.CreateTable(
                name: "stock_audit_slips",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    WarehouseId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ScopeLabel = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Creator = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AuditDate = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    StatusLabel = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TotalItems = table.Column<int>(type: "int", nullable: false),
                    MatchedItems = table.Column<int>(type: "int", nullable: false),
                    DiscrepantItems = table.Column<int>(type: "int", nullable: false),
                    TotalDifferenceValue = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Note = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ItemsJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_stock_audit_slips", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_warehouses_Code",
                table: "warehouses",
                column: "Code",
                unique: true,
                filter: "[IsDeleted] = 0");

            migrationBuilder.CreateIndex(
                name: "IX_spaces_Code",
                table: "spaces",
                column: "Code",
                unique: true,
                filter: "[IsDeleted] = 0");

            migrationBuilder.CreateIndex(
                name: "IX_categories_Code",
                table: "categories",
                column: "Code",
                unique: true,
                filter: "[IsDeleted] = 0");

            migrationBuilder.CreateIndex(
                name: "IX_branches_Code",
                table: "branches",
                column: "Code",
                unique: true,
                filter: "[IsDeleted] = 0");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "stock_audit_slips");

            migrationBuilder.DropIndex(
                name: "IX_warehouses_Code",
                table: "warehouses");

            migrationBuilder.DropIndex(
                name: "IX_spaces_Code",
                table: "spaces");

            migrationBuilder.DropIndex(
                name: "IX_categories_Code",
                table: "categories");

            migrationBuilder.DropIndex(
                name: "IX_branches_Code",
                table: "branches");

            // Supplier columns kept

            migrationBuilder.DropColumn(
                name: "Discount",
                table: "supplier_return_slips");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "supplier_return_slips");

            migrationBuilder.DropColumn(
                name: "ItemsJson",
                table: "supplier_return_slips");

            migrationBuilder.DropColumn(
                name: "Note",
                table: "supplier_return_slips");

            migrationBuilder.DropColumn(
                name: "PaidAmount",
                table: "supplier_return_slips");

            migrationBuilder.DropColumn(
                name: "PaymentMethod",
                table: "supplier_return_slips");

            migrationBuilder.DropColumn(
                name: "Solution",
                table: "supplier_return_slips");

            migrationBuilder.DropColumn(
                name: "SourceImportCode",
                table: "supplier_return_slips");

            migrationBuilder.DropColumn(
                name: "StaffName",
                table: "supplier_return_slips");

            migrationBuilder.DropColumn(
                name: "SupplierRefund",
                table: "supplier_return_slips");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "supplier_return_slips");

            migrationBuilder.DropColumn(
                name: "WarehouseId",
                table: "supplier_return_slips");

            migrationBuilder.DropColumn(
                name: "WarehouseName",
                table: "supplier_return_slips");

            migrationBuilder.DropColumn(
                name: "Discount",
                table: "stock_import_slips");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "stock_import_slips");

            migrationBuilder.DropColumn(
                name: "ItemsJson",
                table: "stock_import_slips");

            migrationBuilder.DropColumn(
                name: "Note",
                table: "stock_import_slips");

            migrationBuilder.DropColumn(
                name: "PaidAmount",
                table: "stock_import_slips");

            migrationBuilder.DropColumn(
                name: "RemainingDebt",
                table: "stock_import_slips");

            migrationBuilder.DropColumn(
                name: "UnitPrice",
                table: "stock_import_slips");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "stock_import_slips");

            migrationBuilder.DropColumn(
                name: "WarehouseId",
                table: "stock_import_slips");

            // Product columns kept

            migrationBuilder.CreateIndex(
                name: "IX_warehouses_Code",
                table: "warehouses",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_spaces_Code",
                table: "spaces",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_categories_Code",
                table: "categories",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_branches_Code",
                table: "branches",
                column: "Code",
                unique: true);
        }
    }
}
