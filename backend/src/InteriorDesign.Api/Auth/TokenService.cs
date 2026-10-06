using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using InteriorDesign.Application.Interfaces;
using InteriorDesign.Domain.Entities;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace InteriorDesign.Api.Auth;

public sealed class JwtSettings
{
    public const string SectionName = "Jwt";
    public string SecretKey { get; set; } = "Komorebi_Super_Secret_Jwt_Key_2026_Interior_Design_Platform_9876543210";
    public string Issuer { get; set; } = "InteriorDesignApi";
    public string Audience { get; set; } = "InteriorDesignApp";
    public int ExpiryDays { get; set; } = 7;
}

public sealed class TokenService(IOptions<JwtSettings> options) : ITokenService
{
    private readonly JwtSettings _jwtSettings = options.Value;

    public string GenerateJwtToken(User user)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(_jwtSettings.SecretKey);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.FullName),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, user.Role)
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddDays(_jwtSettings.ExpiryDays),
            Issuer = _jwtSettings.Issuer,
            Audience = _jwtSettings.Audience,
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}
