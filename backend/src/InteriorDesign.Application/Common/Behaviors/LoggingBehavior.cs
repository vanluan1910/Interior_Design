using MediatR;
using Microsoft.Extensions.Logging;

namespace InteriorDesign.Application.Common.Behaviors;

public sealed class LoggingBehavior<TRequest, TResponse>(ILogger<LoggingBehavior<TRequest, TResponse>> logger)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        var requestName = typeof(TRequest).Name;
        logger.LogInformation("Handling {RequestName}", requestName);
        try
        {
            var response = await next();
            logger.LogInformation("Handled {RequestName}", requestName);
            return response;
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Error handling {RequestName}", requestName);
            throw;
        }
    }
}
