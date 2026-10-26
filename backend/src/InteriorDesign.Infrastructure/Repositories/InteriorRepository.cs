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
    public async Task<PagedResult<Product>> GetProductsAsync(int page, int pageSize, string? search, string? space, Guid? categoryId, string? category, ProductStatus? status, string? branch, string? material = null, CancellationToken cancellationToken = default)
    {
        var baseQuery = db.Products.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            var hasAccents = HasVietnameseAccents(s);
            var collation = hasAccents ? "Vietnamese_CI_AS" : "Vietnamese_CI_AI";

            if (s.Length >= 4)
            {
                baseQuery = baseQuery.Where(p =>
                    p.Sku.Contains(s) ||
                    EF.Functions.Collate(p.Name, collation).Contains(s) ||
                    (p.Category != null && EF.Functions.Collate(p.Category.Name, collation).Contains(s)) ||
                    (p.ShortDescription != null && EF.Functions.Collate(p.ShortDescription, collation).Contains(s)) ||
                    (p.Space != null && EF.Functions.Collate(p.Space, collation).Contains(s)) ||
                    (p.WoodType != null && EF.Functions.Collate(p.WoodType, collation).Contains(s)) ||
                    (p.Material != null && EF.Functions.Collate(p.Material, collation).Contains(s))
                );
            }
            else
            {
                baseQuery = baseQuery.Where(p =>
                    p.Sku.Contains(s) ||
                    EF.Functions.Collate(p.Name, collation).Contains(s) ||
                    (p.Category != null && EF.Functions.Collate(p.Category.Name, collation).Contains(s)) ||
                    (p.ShortDescription != null && EF.Functions.Collate(p.ShortDescription, collation).Contains(s))
                );
            }
        }

        if (!string.IsNullOrWhiteSpace(material) && !material.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            var parts = material.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                                .Select(x => x.ToLower())
                                .ToList();

            if (parts.Count == 1)
            {
                var m = parts[0];
                if (m.Contains("sồi") || m.Contains("oak"))
                    baseQuery = baseQuery.Where(p => p.WoodType.Contains("Sồi") || p.Material.Contains("Sồi"));
                else if (m.Contains("tần bì") || m.Contains("ash"))
                    baseQuery = baseQuery.Where(p => p.WoodType.Contains("Tần Bì") || p.Material.Contains("Tần Bì"));
                else if (m.Contains("me tây"))
                    baseQuery = baseQuery.Where(p => p.WoodType.Contains("Me Tây") || p.Material.Contains("Me Tây"));
                else if (m.Contains("mây"))
                    baseQuery = baseQuery.Where(p => p.WoodType.Contains("Mây") || p.Material.Contains("Mây"));
                else if (m.Contains("óc chó") || m.Contains("walnut"))
                    baseQuery = baseQuery.Where(p => p.WoodType.Contains("Óc Chó") || p.Material.Contains("Óc Chó"));
                else if (m.Contains("gõ đỏ"))
                    baseQuery = baseQuery.Where(p => p.WoodType.Contains("Gõ Đỏ") || p.Material.Contains("Gõ Đỏ"));
                else if (m.Contains("hương"))
                    baseQuery = baseQuery.Where(p => p.WoodType.Contains("Hương") || p.Material.Contains("Hương"));
                else if (m.Contains("mun") || m.Contains("gụ"))
                    baseQuery = baseQuery.Where(p => p.WoodType.Contains("Mun") || p.WoodType.Contains("Gụ") || p.Material.Contains("Mun") || p.Material.Contains("Gụ"));
                else if (m.Contains("da"))
                    baseQuery = baseQuery.Where(p => p.WoodType.Contains("Da") || p.Material.Contains("Da") || p.Description.Contains("da bò"));
                else
                    baseQuery = baseQuery.Where(p => p.WoodType.Contains(m) || p.Material.Contains(m));
            }
            else if (parts.Count > 1)
            {
                var hasSoi = parts.Any(m => m.Contains("sồi") || m.Contains("oak"));
                var hasTanBi = parts.Any(m => m.Contains("tần bì") || m.Contains("ash"));
                var hasMeTay = parts.Any(m => m.Contains("me tây"));
                var hasMay = parts.Any(m => m.Contains("mây"));
                var hasOcCho = parts.Any(m => m.Contains("óc chó") || m.Contains("walnut"));
                var hasGoDo = parts.Any(m => m.Contains("gõ đỏ"));
                var hasHuong = parts.Any(m => m.Contains("hương"));
                var hasMunGu = parts.Any(m => m.Contains("mun") || m.Contains("gụ"));
                var hasDa = parts.Any(m => m.Contains("da"));

                baseQuery = baseQuery.Where(p =>
                    (hasSoi && (p.WoodType.Contains("Sồi") || p.Material.Contains("Sồi"))) ||
                    (hasTanBi && (p.WoodType.Contains("Tần Bì") || p.Material.Contains("Tần Bì"))) ||
                    (hasMeTay && (p.WoodType.Contains("Me Tây") || p.Material.Contains("Me Tây"))) ||
                    (hasMay && (p.WoodType.Contains("Mây") || p.Material.Contains("Mây"))) ||
                    (hasOcCho && (p.WoodType.Contains("Óc Chó") || p.Material.Contains("Óc Chó"))) ||
                    (hasGoDo && (p.WoodType.Contains("Gõ Đỏ") || p.Material.Contains("Gõ Đỏ"))) ||
                    (hasHuong && (p.WoodType.Contains("Hương") || p.Material.Contains("Hương"))) ||
                    (hasMunGu && (p.WoodType.Contains("Mun") || p.WoodType.Contains("Gụ") || p.Material.Contains("Mun") || p.Material.Contains("Gụ"))) ||
                    (hasDa && (p.WoodType.Contains("Da") || p.Material.Contains("Da") || p.Description.Contains("da bò")))
                );
            }
        }

        var hasSpecificCategoryFilter = (categoryId.HasValue && categoryId != Guid.Empty) ||
                                        (!string.IsNullOrWhiteSpace(category) && !category.Equals("all", StringComparison.OrdinalIgnoreCase));

        if (!hasSpecificCategoryFilter && !string.IsNullOrWhiteSpace(space) && !space.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            var sp = space.Trim();
            var spLower = sp.ToLower();

            // Tìm không gian trong bảng spaces theo slug, code, id hoặc tên
            var matchedDbSpace = await db.Spaces.AsNoTracking().FirstOrDefaultAsync(s => !s.IsDeleted &&
                (s.Slug == spLower || (s.Code != null && s.Code.ToLower() == spLower) || s.Id.ToString() == spLower || (s.Name != null && s.Name.ToLower() == spLower)), cancellationToken);

            if (matchedDbSpace != null)
            {
                var sId = matchedDbSpace.Id;
                var sName = matchedDbSpace.Name;
                var sCode = matchedDbSpace.Code;
                var sSlug = matchedDbSpace.Slug;

                baseQuery = baseQuery.Where(p =>
                    (p.Category != null && p.Category.SpaceId == sId) ||
                    (!string.IsNullOrEmpty(p.Space) && (
                        p.Space == sName || p.Space.Contains(sName) ||
                        (!string.IsNullOrEmpty(sCode) && p.Space.Contains(sCode)) ||
                        (!string.IsNullOrEmpty(sSlug) && p.Space.Contains(sSlug))
                    ))
                );
            }
            else
            {
                // Fallback tìm trực tiếp theo tên hoặc mã chuỗi
                baseQuery = baseQuery.Where(p => p.Space == space || p.Space.Contains(space));
            }
        }

        if (categoryId.HasValue && categoryId != Guid.Empty)
        {
            baseQuery = baseQuery.Where(p => p.CategoryId == categoryId.Value);
        }
        else if (!string.IsNullOrWhiteSpace(category) && !category.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            var cat = category.Trim();
            if (Guid.TryParse(cat, out var parsedCatGuid))
            {
                baseQuery = baseQuery.Where(p => p.CategoryId == parsedCatGuid);
            }
            else
            {
                var matchingCategoryIds = await db.Categories
                    .AsNoTracking()
                    .Where(c => c.Slug == cat || c.Code == cat || c.Name.Contains(cat))
                    .Select(c => c.Id)
                    .ToListAsync(cancellationToken);

                if (matchingCategoryIds.Count > 0)
                {
                    baseQuery = baseQuery.Where(p => matchingCategoryIds.Contains(p.CategoryId) || p.Name.Contains(cat));
                }
                else
                {
                    baseQuery = baseQuery.Where(p => p.Name.Contains(cat));
                }
            }
        }

        if (status.HasValue)
        {
            baseQuery = baseQuery.Where(p => p.Status == status.Value);
        }

        // Note: Branch stock quantity mapping is performed in memory by the controller to avoid expensive LOB table scans on BranchStocksJson.
        cancellationToken.ThrowIfCancellationRequested();

        var total = await baseQuery.CountAsync(cancellationToken);
        if (total == 0)
        {
            return new PagedResult<Product>([], page, pageSize, 0);
        }

        cancellationToken.ThrowIfCancellationRequested();

        var sTrim = search?.Trim();
        var query = !string.IsNullOrWhiteSpace(sTrim)
            ? baseQuery.OrderByDescending(p => p.Sku.Contains(sTrim) || EF.Functions.Collate(p.Name, HasVietnameseAccents(sTrim) ? "Vietnamese_CI_AS" : "Vietnamese_CI_AI").Contains(sTrim))
                       .ThenByDescending(p => p.CreatedAt)
            : baseQuery.OrderByDescending(p => p.CreatedAt);
        var items = pageSize <= 0
            ? await query.Include(p => p.Category).ToListAsync(cancellationToken)
            : await query.Include(p => p.Category).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);

        return new PagedResult<Product>(items, page, pageSize <= 0 ? total : pageSize, total);
    }

    public async Task<IReadOnlyList<Branch>> GetBranchesAsync(CancellationToken cancellationToken)
    {
        return await db.Branches.Where(b => !b.IsDeleted).AsNoTracking().ToListAsync(cancellationToken);
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

        var normalized = identifier.Trim();

        if (Guid.TryParse(normalized, out var guid))
        {
            var byId = await db.Products
                .Include(p => p.Category)
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == guid, cancellationToken);
            if (byId != null) return byId;
        }

        return await db.Products
            .Include(p => p.Category)
            .AsNoTracking()
            .FirstOrDefaultAsync(p =>
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
        var hasProducts = await db.Products.AnyAsync(p => p.CategoryId == id, cancellationToken);
        if (hasProducts) return false;

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

        cancellationToken.ThrowIfCancellationRequested();

        var total = await query.CountAsync(cancellationToken);
        if (total == 0)
        {
            return new PagedResult<Order>([], page, pageSize, 0);
        }

        cancellationToken.ThrowIfCancellationRequested();

        var items = pageSize <= 0
            ? await query.OrderByDescending(o => o.CreatedAt).ToListAsync(cancellationToken)
            : await query.OrderByDescending(o => o.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

        return new PagedResult<Order>(items, page, pageSize <= 0 ? total : pageSize, total);
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

        cancellationToken.ThrowIfCancellationRequested();

        var total = await query.CountAsync(cancellationToken);
        if (total == 0)
        {
            return new PagedResult<ConsultationBooking>([], page, pageSize, 0);
        }

        cancellationToken.ThrowIfCancellationRequested();

        var items = pageSize <= 0
            ? await query.OrderByDescending(c => c.CreatedAt).ToListAsync(cancellationToken)
            : await query.OrderByDescending(c => c.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

        return new PagedResult<ConsultationBooking>(items, page, pageSize <= 0 ? total : pageSize, total);
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
        var totalRevenue = await db.Orders.Where(o => o.Status != OrderStatus.Cancelled && o.Status != OrderStatus.Returned && o.Status != OrderStatus.ReturnCompleted).SumAsync(o => (decimal?)o.TotalAmount, cancellationToken) ?? 0;
        var totalOrders = await db.Orders.CountAsync(cancellationToken);
        var pendingOrders = await db.Orders.CountAsync(o => o.Status == OrderStatus.Pending, cancellationToken);
        var totalProducts = await db.Products.CountAsync(cancellationToken);
        var totalConsultations = await db.ConsultationBookings.CountAsync(cancellationToken);
        var totalCustomers = await db.Users.CountAsync(u => u.Role == "Customer", cancellationToken);

        return (totalRevenue, totalOrders, pendingOrders, totalProducts, totalConsultations, totalCustomers);
    }

    private static readonly HashSet<char> VietnameseAccents =
    [
        'à','á','ả','ã','ạ','ă','ằ','ắ','ẳ','ẵ','ặ','â','ầ','ấ','ẩ','ẫ','ậ',
        'è','é','ẻ','ẽ','ẹ','ê','ề','ế','ể','ễ','ệ',
        'ì','í','ỉ','ĩ','ị',
        'ò','ó','ỏ','õ','ọ','ô','ồ','ố','ổ','ỗ','ộ','ơ','ờ','ớ','ở','ỡ','ợ',
        'ù','ú','ủ','ũ','ụ','ư','ừ','ứ','ử','ữ','ự',
        'ỳ','ý','ỷ','ỹ','ỵ',
        'đ',
        'À','Á','Ả','Ã','Ạ','Ă','Ằ','Ắ','Ẳ','Ẵ','Ặ','Â','Ầ','Ấ','Ẩ','Ẫ','Ậ',
        'È','É','Ẻ','Ẽ','Ẹ','Ê','Ề','Ế','Ể','Ễ','Ệ',
        'Ì','Í','Ỉ','Ĩ','Ị',
        'Ò','Ó','Ỏ','Õ','Ọ','Ô','Ồ','Ố','Ổ','Ỗ','Ộ','Ơ','Ờ','Ớ','Ở','Ỡ','Ợ',
        'Ù','Ú','Ủ','Ũ','Ụ','Ư','Ừ','Ứ','Ử','Ữ','Ự',
        'Ỳ','Ý','Ỷ','Ỹ','Ỵ',
        'Đ'
    ];

    private static bool HasVietnameseAccents(string text) => text.Any(VietnameseAccents.Contains);
}
