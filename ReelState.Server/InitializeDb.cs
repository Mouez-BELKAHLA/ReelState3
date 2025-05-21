using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using ReelState.Server.Models;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace ReelState.Server
{
    public static class InitializeDb
    {
        public static async Task InitializeRolesAndAdmin(IHost host)
        {
            using var scope = host.Services.CreateScope();
            var services = scope.ServiceProvider;
            var logger = services.GetRequiredService<ILogger<Program>>();

            try
            {
                var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
                var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();

                // Create roles if they don't exist
                string[] roleNames = { "Admin", "User" };
                foreach (var roleName in roleNames)
                {
                    if (!await roleManager.RoleExistsAsync(roleName))
                    {
                        await roleManager.CreateAsync(new IdentityRole(roleName));
                        logger.LogInformation($"Created {roleName} role");
                    }
                }

                // Create admin user if it doesn't exist
                const string adminEmail = "admin@reelstate.com";
                const string adminPassword = "Admin123!";

                var adminUser = await userManager.FindByEmailAsync(adminEmail);
                if (adminUser == null)
                {
                    adminUser = new ApplicationUser
                    {
                        UserName = adminEmail,
                        Email = adminEmail,
                        FirstName = "Admin",
                        LastName = "User",
                        EmailConfirmed = true
                    };

                    var result = await userManager.CreateAsync(adminUser, adminPassword);
                    if (result.Succeeded)
                    {
                        logger.LogInformation($"Created admin user: {adminEmail}");

                        // Add admin to Admin role
                        await userManager.AddToRoleAsync(adminUser, "Admin");
                        logger.LogInformation("Added admin user to Admin role");
                    }
                    else
                    {
                        var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                        logger.LogError($"Error creating admin user: {errors}");
                    }
                }
                else if (!await userManager.IsInRoleAsync(adminUser, "Admin"))
                {
                    // Ensure existing admin user is in Admin role
                    await userManager.AddToRoleAsync(adminUser, "Admin");
                    logger.LogInformation("Added existing admin user to Admin role");
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "An error occurred while initializing roles and admin user");
            }
        }
    }
}