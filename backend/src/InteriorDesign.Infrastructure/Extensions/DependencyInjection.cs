using InteriorDesign.Application.Interfaces;
using InteriorDesign.Infrastructure.Data;
using InteriorDesign.Infrastructure.Repositories;
using InteriorDesign.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.DependencyInjection;

namespace InteriorDesign.Infrastructure.Extensions;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, string? connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString) || connectionString.Equals("InMemory", StringComparison.OrdinalIgnoreCase))
        {
            services.AddDbContext<InteriorDbContext>(options =>
                options.UseInMemoryDatabase("InteriorDesignDb"));
        }
        else if (connectionString.Contains("Uid=", StringComparison.OrdinalIgnoreCase) || connectionString.Contains("port=3306", StringComparison.OrdinalIgnoreCase))
        {
            services.AddDbContext<InteriorDbContext>(options =>
                options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));
        }
        else
        {
            services.AddDbContext<InteriorDbContext>(options =>
            {
                options.UseSqlServer(connectionString, sqlOptions =>
                {
                    sqlOptions.ExecutionStrategy(dependencies => new CustomSqlServerRetryingExecutionStrategy(dependencies));
                })
                .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
            });
        }

        services.AddScoped<IInteriorRepository, InteriorRepository>();
        services.AddScoped<IAuthRepository, AuthRepository>();
        services.AddScoped<ISettingsRepository, SettingsRepository>();
        services.AddScoped<IEmailService, EmailService>();

        return services;
    }
}

public sealed class CustomSqlServerRetryingExecutionStrategy : SqlServerRetryingExecutionStrategy
{
    public CustomSqlServerRetryingExecutionStrategy(ExecutionStrategyDependencies dependencies)
        : base(dependencies, maxRetryCount: 5, maxRetryDelay: TimeSpan.FromSeconds(30), errorNumbersToAdd: [19])
    {
    }

    protected override bool ShouldRetryOn(Exception? exception)
    {
        if (exception != null && base.ShouldRetryOn(exception)) return true;

        if (exception is InvalidOperationException ex &&
            (ex.Message.Contains("The connection is closed", StringComparison.OrdinalIgnoreCase) ||
             ex.Message.Contains("connection was closed", StringComparison.OrdinalIgnoreCase)))
        {
            return true;
        }

        return false;
    }
}

