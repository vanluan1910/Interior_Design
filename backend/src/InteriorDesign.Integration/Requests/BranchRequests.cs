namespace InteriorDesign.Integration.Requests;

public sealed record CreateBranchRequest(
    string Code,
    string Name,
    string Type,
    string? TypeLabel,
    string Address,
    string Region,
    string ManagerName,
    string ManagerPhone,
    string ManagerEmail,
    decimal Area,
    int StaffCount,
    int WarehouseCount,
    string EstablishedDate,
    string Status,
    bool IsHeadquarter,
    string? Description
);

public sealed record UpdateBranchRequest(
    string Code,
    string Name,
    string Type,
    string? TypeLabel,
    string Address,
    string Region,
    string ManagerName,
    string ManagerPhone,
    string ManagerEmail,
    decimal Area,
    int StaffCount,
    int WarehouseCount,
    string EstablishedDate,
    string Status,
    bool IsHeadquarter,
    string? Description
);

public sealed record UpdateBranchStatusRequest(
    string Status
);
