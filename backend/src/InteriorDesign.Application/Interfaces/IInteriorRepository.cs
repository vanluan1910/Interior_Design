using InteriorDesign.Domain.Entities;
using InteriorDesign.Domain.Enums;
using InteriorDesign.Integration.Common;

namespace InteriorDesign.Application.Interfaces;

public interface IInteriorRepository
{
    // Products
    Task<PagedResult<Product>> GetProductsAsync(int page, int pageSize, string? search, string? space, Guid? categoryId, ProductStatus? status, CancellationToken cancellationToken);
    Task<Product?> GetProductByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<Product?> GetProductBySlugAsync(string slug, CancellationToken cancellationToken);
    Task<IReadOnlyList<Product>> GetFeaturedProductsAsync(int limit, CancellationToken cancellationToken);
    Task<Product> AddProductAsync(Product product, CancellationToken cancellationToken);
    Task<Product?> UpdateProductAsync(Product product, CancellationToken cancellationToken);
    Task<bool> DeleteProductAsync(Guid id, CancellationToken cancellationToken);

    // Categories
    Task<IReadOnlyList<Category>> GetCategoriesAsync(CancellationToken cancellationToken);
    Task<Category?> GetCategoryByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<Category> AddCategoryAsync(Category category, CancellationToken cancellationToken);
    Task<Category?> UpdateCategoryAsync(Category category, CancellationToken cancellationToken);
    Task<bool> DeleteCategoryAsync(Guid id, CancellationToken cancellationToken);

    // Orders
    Task<PagedResult<Order>> GetOrdersAsync(int page, int pageSize, string? search, OrderStatus? status, CancellationToken cancellationToken);
    Task<Order?> GetOrderByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<Order?> GetOrderByCodeAsync(string orderCode, CancellationToken cancellationToken);
    Task<Order> AddOrderAsync(Order order, CancellationToken cancellationToken);
    Task<Order?> UpdateOrderAsync(Order order, CancellationToken cancellationToken);

    // Consultations
    Task<PagedResult<ConsultationBooking>> GetConsultationsAsync(int page, int pageSize, string? search, ConsultationStatus? status, CancellationToken cancellationToken);
    Task<ConsultationBooking?> GetConsultationByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<ConsultationBooking> AddConsultationAsync(ConsultationBooking booking, CancellationToken cancellationToken);
    Task<ConsultationBooking?> UpdateConsultationAsync(ConsultationBooking booking, CancellationToken cancellationToken);

    // Dashboard
    Task<(decimal TotalRevenue, int TotalOrders, int PendingOrders, int TotalProducts, int TotalConsultations, int TotalCustomers)> GetDashboardStatsAsync(CancellationToken cancellationToken);
}
