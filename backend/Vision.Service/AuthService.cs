using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Vision.Common.DTOs;
using Vision.Common.Helpers;
using Vision.Data.Entities;
using Vision.Repository;

namespace Vision.Service;

public class AuthService : IAuthService
{
    private readonly IAuthRepo _authRepo;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;

    public AuthService(IAuthRepo authRepo, IConfiguration configuration, ILogger<AuthService> logger)
    {
        _authRepo = authRepo;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<AuthResponse> SignUpAsync(SignUpRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return new AuthResponse { Success = false, Error = "Name is required." };

        if (string.IsNullOrWhiteSpace(request.Email))
            return new AuthResponse { Success = false, Error = "Email is required." };

        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
            return new AuthResponse { Success = false, Error = "Password must be at least 6 characters." };

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        if (await _authRepo.UserExistsAsync(normalizedEmail))
            return new AuthResponse { Success = false, Error = "An account with this email already exists." };

        var user = new User
        {
            FullName = request.Name.Trim(),
            GmailAddress = normalizedEmail,
            Password = PasswordHelper.HashPassword(request.Password),
            CreatedDateTime = DateTime.UtcNow,
            JobTitle = string.IsNullOrWhiteSpace(request.Role) ? "Member" : request.Role.Trim(),
            Department = string.IsNullOrWhiteSpace(request.Department) ? "General" : request.Department.Trim()
        };

        var created = await _authRepo.CreateUserAsync(user);
        _logger.LogInformation("User created: ID {UserId}, Email {Email}", created.ID, created.GmailAddress);

        var token = GenerateJwtToken(created);

        return new AuthResponse
        {
            Success = true,
            User = MapToDto(created),
            Token = token
        };
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return new AuthResponse { Success = false, Error = "Email and password are required." };

        var user = await _authRepo.GetUserByEmailAsync(request.Email);
        if (user == null || !PasswordHelper.VerifyPassword(request.Password, user.Password))
            return new AuthResponse { Success = false, Error = "Invalid email or password." };

        _logger.LogInformation("User authenticated: ID {UserId}, Email {Email}", user.ID, user.GmailAddress);

        var token = GenerateJwtToken(user);

        return new AuthResponse
        {
            Success = true,
            User = MapToDto(user),
            Token = token
        };
    }

    public async Task<UserDto?> GetUserByIdAsync(int id)
    {
        var user = await _authRepo.GetUserByIdAsync(id);
        return user != null ? MapToDto(user) : null;
    }

    public async Task<List<UserDto>> GetAllUsersAsync()
    {
        var users = await _authRepo.GetAllUsersAsync();
        return users.Select(MapToDto).ToList();
    }

    #region Helpers

    private string GenerateJwtToken(User user)
    {
        var jwtSettings = _configuration.GetSection("Jwt");
        var secretKey = jwtSettings["Secret"] ?? "VisionProjectManagement2024SecureJwtKey256BitsMinimumForHS256AlgorithmSecurity!";

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.ID.ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.ID.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.GmailAddress ?? string.Empty),
            new Claim(ClaimTypes.Email, user.GmailAddress ?? string.Empty),
            new Claim(JwtRegisteredClaimNames.Name, user.FullName ?? string.Empty),
            new Claim(ClaimTypes.Name, user.FullName ?? string.Empty),
            new Claim(ClaimTypes.Role, user.JobTitle ?? "Member"),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var expirationMinutes = int.TryParse(jwtSettings["AccessTokenExpirationMinutes"], out var exp) ? exp : 60 * 24;

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"] ?? "https://localhost:5001",
            audience: jwtSettings["Audience"] ?? "https://localhost:5173",
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static UserDto MapToDto(User user)
    {
        var name = string.IsNullOrWhiteSpace(user.FullName) ? "User" : user.FullName;
        var email = user.GmailAddress ?? string.Empty;
        var avatar = $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(name)}&background=2563eb&color=fff&size=150";

        return new UserDto
        {
            Id = user.ID.ToString(),
            Name = name,
            Email = email,
            Avatar = avatar,
            Role = string.IsNullOrWhiteSpace(user.JobTitle) ? "Member" : user.JobTitle,
            Department = string.IsNullOrWhiteSpace(user.Department) ? "General" : user.Department,
            Status = "online"
        };
    }

    #endregion
}
