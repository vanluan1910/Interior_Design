namespace InteriorDesign.Integration.Common;

public sealed record ApiResponse<T>(bool Success, T? Data, string? Message, IReadOnlyList<string> Errors)
{
    public static ApiResponse<T> Ok(T data, string? message = null) => new(true, data, message, Array.Empty<string>());

    public static ApiResponse<T> Fail(string message, IReadOnlyList<string>? errors = null) =>
        new(false, default, message, errors ?? Array.Empty<string>());
}
