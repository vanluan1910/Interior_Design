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
        var baseQuery = db.Products.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            baseQuery = baseQuery.Where(p => p.Name.Contains(s) || p.Sku.Contains(s) || p.Description.Contains(s));
        }

        if (!string.IsNullOrWhiteSpace(space) && !space.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            var sp = space.Trim().ToLower();
            if (sp == "living" || sp == "livingroom" || sp == "living-room" || sp.Contains("khách") || sp == "kg01")
            {
                baseQuery = baseQuery.Where(p => p.Space.Contains("khách") || p.Space.Contains("Living") || p.Space == "KG01");
            }
            else if (sp == "bedroom" || sp == "bed" || sp.Contains("ngủ") || sp == "kg02" || sp == "kg03")
            {
                baseQuery = baseQuery.Where(p => p.Space.Contains("ngủ") || p.Space.Contains("Bed") || p.Space == "KG02" || p.Space == "KG03");
            }
            else if (sp == "dining" || sp == "diningroom" || sp == "dining-room" || sp.Contains("ăn") || sp.Contains("bếp"))
            {
                baseQuery = baseQuery.Where(p => p.Space.Contains("ăn") || p.Space.Contains("bếp") || p.Space.Contains("Dining"));
            }
            else if (sp == "office" || sp == "work" || sp.Contains("việc") || sp.Contains("sách") || sp == "kg04")
            {
                baseQuery = baseQuery.Where(p => p.Space.Contains("việc") || p.Space.Contains("sách") || p.Space.Contains("Office") || p.Space == "KG04");
            }
            else
            {
                baseQuery = baseQuery.Where(p => p.Space == space || p.Space.Contains(space));
            }
        }

        if (categoryId.HasValue && categoryId != Guid.Empty)
        {
            baseQuery = baseQuery.Where(p => p.CategoryId == categoryId.Value);
        }

        if (status.HasValue)
        {
            baseQuery = baseQuery.Where(p => p.Status == status.Value);
        }

        var total = await baseQuery.CountAsync(cancellationToken);
        var items = await baseQuery
            .Include(p => p.Category)
            .OrderByDescending(p => p.CreatedAt)
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

    public async Task<Product?> GetProductByIdentifierAsync(string identifier, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(identifier)) return null;

        var query = db.Products.Include(p => p.Category).AsNoTracking();

        if (Guid.TryParse(identifier, out var guid))
        {
            var byId = await query.FirstOrDefaultAsync(p => p.Id == guid, cancellationToken);
            if (byId != null) return byId;
        }

        var normalized = identifier.Trim();
        return await query.FirstOrDefaultAsync(p =>
            p.Slug == normalized ||
            p.Sku == normalized ||
            p.Name == normalized,
            cancellationToken);
    }

    public async Task<IReadOnlyList<Product>> GetRelatedProductsAsync(Guid productId, string? space, Guid? categoryId, int limit, CancellationToken cancellationToken)
    {
        var query = db.Products.Include(p => p.Category)
            .AsNoTracking()
            .Where(p => p.Id != productId && p.Status == ProductStatus.Active);

        if (!string.IsNullOrWhiteSpace(space))
        {
            query = query.Where(p => p.Space == space);
        }
        else if (categoryId.HasValue && categoryId.Value != Guid.Empty)
        {
            query = query.Where(p => p.CategoryId == categoryId.Value);
        }

        return await query.Take(limit).ToListAsync(cancellationToken);
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
