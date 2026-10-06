using InteriorDesign.Domain.Enums;

namespace InteriorDesign.Domain.Entities;

public sealed class ConsultationBooking
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public DateTimeOffset? PreferredDate { get; set; }
    public string SpaceType { get; set; } = string.Empty;
    public string DesignStyle { get; set; } = string.Empty;
    public string BudgetRange { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
    public ConsultationStatus Status { get; set; } = ConsultationStatus.Pending;
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
