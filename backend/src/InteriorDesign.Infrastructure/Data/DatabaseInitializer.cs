using Microsoft.EntityFrameworkCore;

namespace InteriorDesign.Infrastructure.Data;

public static class DatabaseInitializer
{
    public static async Task InitializeAsync(InteriorDbContext context)
    {
        await context.Database.EnsureCreatedAsync();

        if (!await context.Categories.AnyAsync())
        {
            await context.Categories.AddRangeAsync(InteriorSeedData.GetCategories());
            await context.SaveChangesAsync();
        }

        if (!await context.Products.AnyAsync())
        {
            await context.Products.AddRangeAsync(InteriorSeedData.GetProducts());
            await context.SaveChangesAsync();
        }

        if (!await context.Users.AnyAsync())
        {
            await context.Users.AddAsync(InteriorSeedData.GetAdminUser());
            await context.SaveChangesAsync();
        }

        if (!await context.StoreSettings.AnyAsync())
        {
            await context.StoreSettings.AddAsync(InteriorSeedData.GetStoreSetting());
            await context.SaveChangesAsync();
        }
    }
}
