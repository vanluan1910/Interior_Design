using System.Net;
using System.Text.Json;
using FluentValidation;
using InteriorDesign.Integration.Common;

namespace InteriorDesign.Api.Middlewares;

public sealed class ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (ValidationException ex)
        {
            logger.LogWarning("Validation failed: {Errors}", ex.Errors);
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.BadRequest;

            var errors = ex.Errors.Select(e => e.ErrorMessage).ToList();
            var response = ApiResponse<object>.Fail("Dữ liệu đầu vào không hợp lệ.", errors);
            await context.Response.WriteAsync(JsonSerializer.Serialize(response));
        }
        catch (Exception ex) when (ex is OperationCanceledException || (context.RequestAborted.IsCancellationRequested && ex is InvalidOperationException && ex.Message.Contains("The connection is closed", StringComparison.OrdinalIgnoreCase)))
        {
            logger.LogInformation("Request was cancelled by the client.");
            if (!context.Response.HasStarted)
            {
                context.Response.StatusCode = 499;
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An unhandled exception occurred.");
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

            var response = ApiResponse<object>.Fail("Đã có lỗi xảy ra trên hệ thống.", [ex.Message]);
            await context.Response.WriteAsync(JsonSerializer.Serialize(response));
        }
    }
}
