using InteriorDesign.Application.Interfaces;
using InteriorDesign.Domain.Entities;
using InteriorDesign.Domain.Enums;
using InteriorDesign.Infrastructure.Data;
using InteriorDesign.Integration.Common;
using Microsoft.EntityFrameworkCore;

namespace InteriorDesign.Infrastructure.Repositories;

public sealed class InteriorRepository(InteriorDbContext db) : IInteriorRepository
{
    // Products
    public async Task<PagedResult<Product>> GetProductsAsync(int page, int pageSize, string? search, string? space, Guid? categoryId, ProductStatus? status, CancellationToken cancellationToken)
    {
        var query = db.Products.Include(p => p.Category).AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(s) || p.Sku.ToLower().Contains(s) || p.Description.ToLower().Contains(s));
        }

        if (!string.IsNullOrWhiteSpace(space) && !space.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(p => p.Space.ToLower() == space.ToLower());
        }

        if (categoryId.HasValue && categoryId != Guid.Empty)
        {
            query = query.Where(p => p.CategoryId == categoryId.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(p => p.Status == status.Value);
        }

        var total = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<Product>(items, page, pageSize, total);
    }

    public async Task<Product?> GetProductByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await db.Products.Include(p => p.Category).AsNoTracking().FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    public async Task<Product?> GetProductBySlugAsync(string slug, CancellationToken cancellationToken)
    {
        return await db.Products.Include(p => p.Category).AsNoTracking().FirstOrDefaultAsync(p => p.Slug == slug, cancellationToken);
    }

    public async Task<IReadOnlyList<Product>> GetFeaturedProductsAsync(int limit, CancellationToken cancellationToken)
    {
        return await db.Products.Include(p => p.Category)
            .AsNoTracking()
            .Where(p => p.IsFeatured && p.Status == ProductStatus.Active)
            .Take(limit)
            .ToListAsync(cancellationToken);
    }

    public async Task<Product> AddProductAsync(Product product, CancellationToken cancellationToken)
    {
        db.Products.Add(product);
        await db.SaveChangesAsync(cancellationToken);
        return product;
    }

    public async Task<Product?> UpdateProductAsync(Product product, CancellationToken cancellationToken)
    {
        db.Products.Update(product);
        await db.SaveChangesAsync(cancellationToken);
        return product;
    }

    public async Task<bool> DeleteProductAsync(Guid id, CancellationToken cancellationToken)
    {
        var product = await db.Products.FindAsync([id], cancellationToken);
        if (product is null) return false;

        db.Products.Remove(product);
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    // Categories
    public async Task<IReadOnlyList<Category>> GetCategoriesAsync(CancellationToken cancellationToken)
    {
        return await db.Categories.Include(c => c.Products).AsNoTracking().OrderBy(c => c.DisplayOrder).ToListAsync(cancellationToken);
    }

    public async Task<Category?> GetCategoryByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await db.Categories.Include(c => c.Products).AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<Category> AddCategoryAsync(Category category, CancellationToken cancellationToken)
    {
        db.Categories.Add(category);
        await db.SaveChangesAsync(cancellationToken);
        return category;
    }

    public async Task<Category?> UpdateCategoryAsync(Category category, CancellationToken cancellationToken)
    {
        db.Categories.Update(category);
        await db.SaveChangesAsync(cancellationToken);
        return category;
    }

    public async Task<bool> DeleteCategoryAsync(Guid id, CancellationToken cancellationToken)
    {
        var cat = await db.Categories.FindAsync([id], cancellationToken);
        if (cat is null) return false;

        db.Categories.Remove(cat);
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    // Orders
    public async Task<PagedResult<Order>> GetOrdersAsync(int page, int pageSize, string? search, OrderStatus? status, CancellationToken cancellationToken)
    {
        var query = db.Orders.Include(o => o.Items).AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(o => o.OrderCode.ToLower().Contains(s) || o.CustomerName.ToLower().Contains(s) || o.CustomerPhone.ToLower().Contains(s));
        }

        if (status.HasValue)
        {
            query = query.Where(o => o.Status == status.Value);
        }

        var total = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<Order>(items, page, pageSize, total);
    }

    public async Task<Order?> GetOrderByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await db.Orders.Include(o => o.Items).AsNoTracking().FirstOrDefaultAsync(o => o.Id == id, cancellationToken);
    }

    public async Task<Order?> GetOrderByCodeAsync(string orderCode, CancellationToken cancellationToken)
    {
        return await db.Orders.Include(o => o.Items).AsNoTracking().FirstOrDefaultAsync(o => o.OrderCode == orderCode, cancellationToken);
    }

    public async Task<Order> AddOrderAsync(Order order, CancellationToken cancellationToken)
    {
        db.Orders.Add(order);
        await db.SaveChangesAsync(cancellationToken);
        return order;
    }

    public async Task<Order?> UpdateOrderAsync(Order order, CancellationToken cancellationToken)
    {
        db.Orders.Update(order);
        await db.SaveChangesAsync(cancellationToken);
        return order;
    }

    // Consultations
    public async Task<PagedResult<ConsultationBooking>> GetConsultationsAsync(int page, int pageSize, string? search, ConsultationStatus? status, CancellationToken cancellationToken)
    {
        var query = db.ConsultationBookings.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(c => c.FullName.ToLower().Contains(s) || c.Phone.ToLower().Contains(s) || c.Email.ToLower().Contains(s));
        }

        if (status.HasValue)
        {
            query = query.Where(c => c.Status == status.Value);
        }

        var total = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<ConsultationBooking>(items, page, pageSize, total);
    }

    public async Task<ConsultationBooking?> GetConsultationByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await db.ConsultationBookings.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<ConsultationBooking> AddConsultationAsync(ConsultationBooking booking, CancellationToken cancellationToken)
    {
        db.ConsultationBookings.Add(booking);
        await db.SaveChangesAsync(cancellationToken);
        return booking;
    }

    public async Task<ConsultationBooking?> UpdateConsultationAsync(ConsultationBooking booking, CancellationToken cancellationToken)
    {
        db.ConsultationBookings.Update(booking);
        await db.SaveChangesAsync(cancellationToken);
        return booking;
    }

    // Dashboard
    public async Task<(decimal TotalRevenue, int TotalOrders, int PendingOrders, int TotalProducts, int TotalConsultations, int TotalCustomers)> GetDashboardStatsAsync(CancellationToken cancellationToken)
    {
        var totalRevenue = await db.Orders.Where(o => o.Status != OrderStatus.Cancelled).SumAsync(o => (decimal?)o.TotalAmount, cancellationToken) ?? 0;
        var totalOrders = await db.Orders.CountAsync(cancellationToken);
        var pendingOrders = await db.Orders.CountAsync(o => o.Status == OrderStatus.Pending, cancellationToken);
        var totalProducts = await db.Products.CountAsync(cancellationToken);
        var totalConsultations = await db.ConsultationBookings.CountAsync(cancellationToken);
        var totalCustomers = await db.Users.CountAsync(u => u.Role == "Customer", cancellationToken);

        return (totalRevenue, totalOrders, pendingOrders, totalProducts, totalConsultations, totalCustomers);
    }
}
