using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Vision.Data;
using Vision.Data.Entities;

namespace Vision.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly VisionDbContext _db;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthController> _logger;

    public AuthController(VisionDbContext db, IConfiguration configuration, ILogger<AuthController> logger)
    {
        _db = db;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Register a new user in the database
    /// </summary>
    [HttpPost("signup")]
    public async Task<IActionResult> SignUp([FromBody] SignUpRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new { success = false, error = "Name is required." });
            }

            if (string.IsNullOrWhiteSpace(request.Email))
            {
                return BadRequest(new { success = false, error = "Email is required." });
            }

            if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
            {
                return BadRequest(new { success = false, error = "Password must be at least 6 characters." });
            }

            var normalizedEmail = request.Email.Trim().ToLowerInvariant();

            // Check if user already exists
            var existingUser = await _db.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.GmailAddress != null && u.GmailAddress.ToLower() == normalizedEmail);

            if (existingUser != null)
            {
                return BadRequest(new { success = false, error = "An account with this email already exists." });
            }

            // Create new user in the Users table
            var newUser = new User
            {
                FullName = request.Name.Trim(),
                GmailAddress = normalizedEmail,
                Password = HashPassword(request.Password),
                CreatedDateTime = DateTime.UtcNow,
                JobTitle = string.IsNullOrWhiteSpace(request.Role) ? "Member" : request.Role.Trim(),
                Department = string.IsNullOrWhiteSpace(request.Department) ? "General" : request.Department.Trim()
            };

            await _db.Users.AddAsync(newUser);
            await _db.SaveChangesAsync();

            _logger.LogInformation("New user registered successfully: ID {UserId}, Email {Email}", newUser.ID, newUser.GmailAddress);

            var token = GenerateJwtToken(newUser);

            return Ok(new
            {
                success = true,
                user = MapUserResponse(newUser),
                token
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during SignUp for {Email}", request.Email);
            return StatusCode(500, new { success = false, error = "An unexpected error occurred while creating your account." });
        }
    }

    /// <summary>
    /// Authenticate a user against the Users table
    /// </summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { success = false, error = "Email and password are required." });
            }

            var normalizedEmail = request.Email.Trim().ToLowerInvariant();

            // Query user from the database
            var user = await _db.Users
                .FirstOrDefaultAsync(u => u.GmailAddress != null && u.GmailAddress.ToLower() == normalizedEmail);

            if (user == null || !VerifyPassword(request.Password, user.Password))
            {
                return Unauthorized(new { success = false, error = "Invalid email or password." });
            }

            _logger.LogInformation("User logged in successfully: ID {UserId}, Email {Email}", user.ID, user.GmailAddress);

            var token = GenerateJwtToken(user);

            return Ok(new
            {
                success = true,
                user = MapUserResponse(user),
                token
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during Login for {Email}", request.Email);
            return StatusCode(500, new { success = false, error = "An unexpected error occurred during sign in." });
        }
    }

    /// <summary>
    /// Sign out
    /// </summary>
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        return Ok(new { success = true });
    }

    /// <summary>
    /// Get current logged in user details
    /// </summary>
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                           ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

            if (int.TryParse(userIdClaim, out var userId))
            {
                var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.ID == userId);
                if (user != null)
                {
                    return Ok(new { success = true, user = MapUserResponse(user) });
                }
            }

            // Fallback for demo/dev if token was not sent: return first active user if any
            var firstUser = await _db.Users.AsNoTracking().OrderBy(u => u.ID).FirstOrDefaultAsync();
            if (firstUser != null)
            {
                return Ok(new { success = true, user = MapUserResponse(firstUser) });
            }

            return Unauthorized(new { success = false, error = "Not authenticated" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in GetCurrentUser");
            return StatusCode(500, new { success = false, error = "Failed to retrieve user." });
        }
    }

    /// <summary>
    /// Get all users list for project assignment and mentions
    /// </summary>
    [HttpGet("users")]
    public async Task<IActionResult> GetAllUsers()
    {
        try
        {
            var users = await _db.Users.AsNoTracking().OrderBy(u => u.ID).ToListAsync();
            return Ok(new
            {
                success = true,
                users = users.Select(MapUserResponse)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in GetAllUsers");
            return StatusCode(500, new { success = false, error = "Failed to load users." });
        }
    }

    #region Helper Methods

    private static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(bytes);
    }

    private static bool VerifyPassword(string inputPassword, string? storedPassword)
    {
        if (string.IsNullOrEmpty(storedPassword) || string.IsNullOrEmpty(inputPassword))
            return false;

        // Check SHA256 base64 match
        var inputHashed = HashPassword(inputPassword);
        if (string.Equals(inputHashed, storedPassword, StringComparison.Ordinal))
            return true;

        // Fallback: direct plain text match (if legacy unhashed text exists)
        if (string.Equals(inputPassword, storedPassword, StringComparison.Ordinal))
            return true;

        return false;
    }

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

    private static object MapUserResponse(User user)
    {
        var name = string.IsNullOrWhiteSpace(user.FullName) ? "User" : user.FullName;
        var email = user.GmailAddress ?? string.Empty;
        var avatar = $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(name)}&background=2563eb&color=fff&size=150";

        return new
        {
            id = user.ID.ToString(),
            name,
            email,
            avatar,
            role = string.IsNullOrWhiteSpace(user.JobTitle) ? "Member" : user.JobTitle,
            department = string.IsNullOrWhiteSpace(user.Department) ? "General" : user.Department,
            status = "online"
        };
    }

    #endregion
}

public class SignUpRequest
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? Role { get; set; }
    public string? Department { get; set; }
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
