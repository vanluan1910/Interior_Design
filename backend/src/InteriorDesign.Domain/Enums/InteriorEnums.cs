namespace InteriorDesign.Domain.Enums;

public enum OrderStatus
{
    Pending = 0,
    Confirmed = 1,
    InProduction = 2,
    Processing = 2,
    Delivering = 3,
    Completed = 4,
    Cancelled = 5
}

public enum PaymentStatus
{
    Pending = 0,
    Paid = 1,
    Failed = 2,
    Refunded = 3
}

public enum ProductStatus
{
    Active = 0,
    Inactive = 1,
    OutOfStock = 2,
    Discontinued = 3
}

public enum ConsultationStatus
{
    Pending = 0,
    Contacted = 1,
    Scheduled = 2,
    Completed = 3,
    Cancelled = 4
}

public enum SpaceType
{
    All = 0,
    LivingRoom = 1,
    DiningRoom = 2,
    Bedroom = 3,
    Office = 4,
    Decor = 5
}
