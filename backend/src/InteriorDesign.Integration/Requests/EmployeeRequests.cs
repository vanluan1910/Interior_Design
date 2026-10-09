namespace InteriorDesign.Integration.Requests;

public sealed record CreateEmployeeRequest(
    string? Code,
    string Name,
    string Phone,
    string? IdNumber,
    string? Gender,
    string? Birthday,
    string? Email,
    string? Address,
    string? Department,
    string? Title,
    string? Branch,
    Guid? BranchId,
    string? Login,
    string? Username,
    string? Password,
    string? Role,
    string? Status,
    string? WorkingDate,
    string? Area,
    string? Ward,
    string? AddressDetail,
    decimal? Debt,
    string? Note,
    string? Facebook,
    string? Zalo,
    List<string>? Skills
);

public sealed record UpdateEmployeeRequest(
    string? Code,
    string Name,
    string Phone,
    string? IdNumber,
    string? Gender,
    string? Birthday,
    string? Email,
    string? Address,
    string? Department,
    string? Title,
    string? Branch,
    Guid? BranchId,
    string? Login,
    string? Username,
    string? Password,
    string? Role,
    string? Status,
    string? WorkingDate,
    string? Area,
    string? Ward,
    string? AddressDetail,
    decimal? Debt,
    string? Note,
    string? Facebook,
    string? Zalo,
    List<string>? Skills
);

public sealed record UpdateEmployeeStatusRequest(
    string Status
);

public sealed record ResetEmployeePasswordRequest(
    string NewPassword
);
