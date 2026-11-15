using Microsoft.EntityFrameworkCore;
using Vision.Data;

var connectionString = "Server=sql8005.site4now.net,1433;Database=db_a4843b_projectmanagement;User Id=db_a4843b_projectmanagement_admin;Password=Uniqtech@12345#;TrustServerCertificate=True;MultipleActiveResultSets=True;Encrypt=True";

var optionsBuilder = new DbContextOptionsBuilder<VisionDbContext>();
optionsBuilder.UseSqlServer(connectionString);

using (var context = new VisionDbContext(optionsBuilder.Options))
{
    Console.WriteLine("Testing connection...");
    try
    {
        var canConnect = await context.Database.CanConnectAsync();
        Console.WriteLine($"Can connect: {canConnect}");
        
        if (canConnect)
        {
            Console.WriteLine("Applying migrations (will skip database creation)...");
            var pendingMigrations = await context.Database.GetPendingMigrationsAsync();
            Console.WriteLine($"Pending migrations: {string.Join(, , pendingMigrations)}");
            
            await context.Database.MigrateAsync();
            Console.WriteLine("Migrations applied successfully!");
            
            var userCount = await context.Users.CountAsync();
            Console.WriteLine($"Users in database: {userCount}");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error: {ex.Message}");
    }
}
