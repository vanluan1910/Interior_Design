using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InteriorDesign.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFullCustomerSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PhoneNumber",
                table: "customers");

            migrationBuilder.AlterColumn<string>(
                name: "FullName",
                table: "customers",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "customers",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "City",
                table: "customers",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Address",
                table: "customers",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<string>(
                name: "BankAccount",
                table: "customers",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BankName",
                table: "customers",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "Birthday",
                table: "customers",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Branch",
                table: "customers",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BuyerName",
                table: "customers",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Code",
                table: "customers",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CompanyName",
                table: "customers",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CustomerType",
                table: "customers",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true,
                defaultValue: "individual");

            migrationBuilder.AddColumn<decimal>(
                name: "Debt",
                table: "customers",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "Facebook",
                table: "customers",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Gender",
                table: "customers",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IdNumber",
                table: "customers",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InvoiceAddress",
                table: "customers",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "customers",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "LastOrderDate",
                table: "customers",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "customers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Passport",
                table: "customers",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Phone",
                table: "customers",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Phone2",
                table: "customers",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PreferredStyle",
                table: "customers",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProjectLocation",
                table: "customers",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RewardPoints",
                table: "customers",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "SalesRep",
                table: "customers",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "customers",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "active");

            migrationBuilder.AddColumn<string>(
                name: "TaxId",
                table: "customers",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Tier",
                table: "customers",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true,
                defaultValue: "standard");

            migrationBuilder.AddColumn<string>(
                name: "Type",
                table: "customers",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true,
                defaultValue: "retail");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "UpdatedAt",
                table: "customers",
                type: "datetimeoffset",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.AddColumn<string>(
                name: "Zalo",
                table: "customers",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_customers_Code",
                table: "customers",
                column: "Code",
                unique: true,
                filter: "[IsDeleted] = 0");

            migrationBuilder.CreateIndex(
                name: "IX_customers_Phone",
                table: "customers",
                column: "Phone");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_customers_Code",
                table: "customers");

            migrationBuilder.DropIndex(
                name: "IX_customers_Phone",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "BankAccount",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "BankName",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "Birthday",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "Branch",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "BuyerName",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "Code",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "CompanyName",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "CustomerType",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "Debt",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "Facebook",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "Gender",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "IdNumber",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "InvoiceAddress",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "LastOrderDate",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "Passport",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "Phone",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "Phone2",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "PreferredStyle",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "ProjectLocation",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "RewardPoints",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "SalesRep",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "TaxId",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "Tier",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "Zalo",
                table: "customers");

            migrationBuilder.AlterColumn<string>(
                name: "FullName",
                table: "customers",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(255)",
                oldMaxLength: 255);

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "customers",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(150)",
                oldMaxLength: 150,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "City",
                table: "customers",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Address",
                table: "customers",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PhoneNumber",
                table: "customers",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }
    }
}
