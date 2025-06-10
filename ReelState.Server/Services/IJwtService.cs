using System.Security.Claims;
using System.Threading.Tasks;
using System.Collections.Generic;
using ReelState.Server.Models;
using ReelState.Server.Models.DTOs;

namespace ReelState.Server.Services
{
    public interface IJwtService
    {
        Task<AuthResponseDto> GenerateTokenAsync(
            ApplicationUser user,
            IList<string> userRoles,
            string? message = null);

        string GenerateRefreshToken();

        ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
    }
}