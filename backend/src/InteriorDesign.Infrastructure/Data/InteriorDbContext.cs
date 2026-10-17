using System.Text.Json;
using InteriorDesign.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace InteriorDesign.Infrastructure.Data;

public sealed class InteriorDbContext : DbContext
{
    public InteriorDbContext(DbContextOptions<InteriorDbContext> options) : base(options) { }

    public DbSet<Product> Products => Set<Product>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<ConsultationBooking> ConsultationBookings => Set<ConsultationBooking>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<StoreSetting> StoreSettings => Set<StoreSetting>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<StockImportSlip> StockImportSlips => Set<StockImportSlip>();
    public DbSet<SupplierReturnSlip> SupplierReturnSlips => Set<SupplierReturnSlip>();
    public DbSet<StockAuditSlip> StockAuditSlips => Set<StockAuditSlip>();
    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<Warehouse> Warehouses => Set<Warehouse>();
    public DbSet<InteriorSpace> Spaces => Set<InteriorSpace>();
    public DbSet<UnitOfMeasure> UnitOfMeasures => Set<UnitOfMeasure>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Role> Roles => Set<Role>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var stringListConverter = new ValueConverter<List<string>, string>(
            v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
            v => string.IsNullOrWhiteSpace(v) ? new List<string>() : JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>());

        var stringListComparer = new ValueComparer<List<string>>(
            (c1, c2) => (c1 == null && c2 == null) || (c1 != null && c2 != null && c1.SequenceEqual(c2)),
            c => c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
            c => c.ToList());

        modelBuilder.Entity<Product>(entity =>
        {
            entity.ToTable("products");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Sku).IsRequired().HasMaxLength(100);
            entity.HasIndex(e => e.Sku).IsUnique();
            entity.Property(e => e.Slug).HasMaxLength(255);
            entity.Property(e => e.Price).HasColumnType("decimal(18,2)");
            entity.Property(e => e.OriginalPrice).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Rating).HasColumnType("decimal(3,2)");
            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(30);
            entity.Property(e => e.Unit).HasMaxLength(50).HasDefaultValue("Bộ");

            entity.Property(e => e.Images)
                .HasConversion(stringListConverter)
                .Metadata.SetValueComparer(stringListComparer);

            entity.HasOne(e => e.Category)
                .WithMany(c => c.Products)
                .HasForeignKey(e => e.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.ToTable("categories");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Code).HasMaxLength(50);
            entity.HasIndex(e => e.Code).IsUnique().HasFilter("[IsDeleted] = 0");
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Slug).HasMaxLength(255);
            entity.Property(e => e.Icon).HasMaxLength(100);
            entity.Property(e => e.Status).HasMaxLength(30);
            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        modelBuilder.Entity<InteriorSpace>(entity =>
        {
            entity.ToTable("spaces");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Code).IsRequired().HasMaxLength(50);
            entity.HasIndex(e => e.Code).IsUnique().HasFilter("[IsDeleted] = 0");
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Slug).HasMaxLength(255);
            entity.Property(e => e.Status).HasMaxLength(30);
            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.ToTable("orders");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.OrderCode).IsRequired().HasMaxLength(50);
            entity.HasIndex(e => e.OrderCode).IsUnique().HasFilter("[IsDeleted] = 0");
            entity.Property(e => e.OrderType).HasMaxLength(50).HasDefaultValue("retail");
            entity.Property(e => e.CustomerName).IsRequired().HasMaxLength(255);
            entity.Property(e => e.CustomerPhone).IsRequired().HasMaxLength(50);
            entity.Property(e => e.CustomerEmail).HasMaxLength(150);
            entity.Property(e => e.ShippingAddress).HasMaxLength(500);
            entity.Property(e => e.City).HasMaxLength(100);
            entity.Property(e => e.District).HasMaxLength(100);
            entity.Property(e => e.ProductName).HasMaxLength(255);
            entity.Property(e => e.ProductSpec).HasMaxLength(500);
            entity.Property(e => e.WoodType).HasMaxLength(100);
            entity.Property(e => e.SpaceType).HasMaxLength(50);
            entity.Property(e => e.Branch).HasMaxLength(100);
            entity.Property(e => e.Showroom).HasMaxLength(100);
            entity.Property(e => e.SubTotal).HasColumnType("decimal(18,2)");
            entity.Property(e => e.DepositPercent).HasColumnType("decimal(18,2)");
            entity.Property(e => e.DepositAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.ShippingFee).HasColumnType("decimal(18,2)");
            entity.Property(e => e.DiscountAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(30);
            entity.Property(e => e.PaymentStatus).HasConversion<string>().HasMaxLength(30);
            entity.HasQueryFilter(e => !e.IsDeleted);

            entity.HasMany(e => e.Items)
                .WithOne()
                .HasForeignKey(i => i.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.ToTable("order_items");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UnitPrice).HasColumnType("decimal(18,2)");
            entity.Property(e => e.TotalPrice).HasColumnType("decimal(18,2)");
        });

        modelBuilder.Entity<ConsultationBooking>(entity =>
        {
            entity.ToTable("consultation_bookings");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FullName).IsRequired().HasMaxLength(150);
            entity.Property(e => e.Phone).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(30);
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
            entity.HasIndex(e => e.Email).IsUnique();
        });

        modelBuilder.Entity<Customer>(entity =>
        {
            entity.ToTable("customers");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Code).IsRequired().HasMaxLength(50);
            entity.HasIndex(e => e.Code).IsUnique().HasFilter("[IsDeleted] = 0");
            entity.Property(e => e.FullName).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Phone).IsRequired().HasMaxLength(50);
            entity.HasIndex(e => e.Phone);
            entity.Property(e => e.Phone2).HasMaxLength(50);
            entity.Property(e => e.Email).HasMaxLength(150);
            entity.Property(e => e.Facebook).HasMaxLength(255);
            entity.Property(e => e.Zalo).HasMaxLength(100);
            entity.Property(e => e.Gender).HasMaxLength(20);
            entity.Property(e => e.Address).HasMaxLength(500);
            entity.Property(e => e.City).HasMaxLength(100);
            entity.Property(e => e.Branch).HasMaxLength(100);
            entity.Property(e => e.CustomerType).HasMaxLength(50).HasDefaultValue("individual");
            entity.Property(e => e.Type).HasMaxLength(50).HasDefaultValue("retail");
            entity.Property(e => e.Tier).HasMaxLength(50).HasDefaultValue("standard");
            entity.Property(e => e.SalesRep).HasMaxLength(100);
            entity.Property(e => e.CompanyName).HasMaxLength(255);
            entity.Property(e => e.BuyerName).HasMaxLength(150);
            entity.Property(e => e.TaxId).HasMaxLength(50);
            entity.Property(e => e.InvoiceAddress).HasMaxLength(500);
            entity.Property(e => e.IdNumber).HasMaxLength(50);
            entity.Property(e => e.Passport).HasMaxLength(50);
            entity.Property(e => e.BankName).HasMaxLength(150);
            entity.Property(e => e.BankAccount).HasMaxLength(50);
            entity.Property(e => e.PreferredStyle).HasMaxLength(255);
            entity.Property(e => e.ProjectLocation).HasMaxLength(500);
            entity.Property(e => e.TotalSpent).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Debt).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Status).HasMaxLength(30).HasDefaultValue("active");
            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        modelBuilder.Entity<StoreSetting>(entity =>
        {
            entity.ToTable("store_settings");
            entity.HasKey(e => e.Id);
        });

        modelBuilder.Entity<Supplier>(entity =>
        {
            entity.ToTable("suppliers");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TotalPurchased).HasColumnType("decimal(18,2)");
            entity.Property(e => e.CurrentDebt).HasColumnType("decimal(18,2)");
            entity.Property(e => e.TotalCollected).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Rating).HasColumnType("decimal(3,2)");
            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        modelBuilder.Entity<StockImportSlip>(entity =>
        {
            entity.ToTable("stock_import_slips");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Quantity).HasColumnType("decimal(18,2)");
            entity.Property(e => e.UnitPrice).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Discount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.TotalValue).HasColumnType("decimal(18,2)");
            entity.Property(e => e.PaidAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.RemainingDebt).HasColumnType("decimal(18,2)");
            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        modelBuilder.Entity<SupplierReturnSlip>(entity =>
        {
            entity.ToTable("supplier_return_slips");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Quantity).HasColumnType("decimal(18,2)");
            entity.Property(e => e.TotalValue).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Discount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.SupplierRefund).HasColumnType("decimal(18,2)");
            entity.Property(e => e.PaidAmount).HasColumnType("decimal(18,2)");
            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        modelBuilder.Entity<StockAuditSlip>(entity =>
        {
            entity.ToTable("stock_audit_slips");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TotalDifferenceValue).HasColumnType("decimal(18,2)");
            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        modelBuilder.Entity<Branch>(entity =>
        {
            entity.ToTable("branches");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Code).IsRequired().HasMaxLength(50);
            entity.HasIndex(e => e.Code).IsUnique().HasFilter("[IsDeleted] = 0");
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Area).HasColumnType("decimal(18,2)");
            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        modelBuilder.Entity<Warehouse>(entity =>
        {
            entity.ToTable("warehouses");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Code).IsRequired().HasMaxLength(50);
            entity.HasIndex(e => e.Code).IsUnique().HasFilter("[IsDeleted] = 0");
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
            entity.Property(e => e.CapacityMax).HasColumnType("decimal(18,2)");
            entity.Property(e => e.CapacityCurrent).HasColumnType("decimal(18,2)");
            entity.Property(e => e.OccupancyPercent).HasColumnType("decimal(5,2)");
            entity.Property(e => e.TotalValue).HasColumnType("decimal(18,2)");
            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        modelBuilder.Entity<UnitOfMeasure>(entity =>
        {
            entity.ToTable("unit_of_measures");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Code).IsRequired().HasMaxLength(50);
            entity.HasIndex(e => e.Code).IsUnique().HasFilter("[IsDeleted] = 0");
            entity.Property(e => e.Name).IsRequired().HasMaxLength(150);
            entity.Property(e => e.Status).HasMaxLength(30);
            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        modelBuilder.Entity<Employee>(entity =>
        {
            entity.ToTable("employees");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Code).IsRequired().HasMaxLength(50);
            entity.HasIndex(e => e.Code).IsUnique().HasFilter("[IsDeleted] = 0");
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Phone).HasMaxLength(50);
            entity.Property(e => e.Email).HasMaxLength(150);
            entity.Property(e => e.Status).HasMaxLength(30);
            entity.Property(e => e.Debt).HasColumnType("decimal(18,2)");
            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.ToTable("roles");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Code).IsRequired().HasMaxLength(50);
            entity.HasIndex(e => e.Code).IsUnique().HasFilter("[IsDeleted] = 0");
            entity.Property(e => e.Name).IsRequired().HasMaxLength(150);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("active");
            entity.Property(e => e.Permissions)
                .HasConversion(stringListConverter)
                .Metadata.SetValueComparer(stringListComparer);
            entity.HasQueryFilter(e => !e.IsDeleted);
        });
    }
}

