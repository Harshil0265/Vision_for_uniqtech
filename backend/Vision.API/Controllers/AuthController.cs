using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Vision.API.Models;

namespace Vision.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private static readonly Regex EmailRegex = new(
            @"^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$",
            RegexOptions.Compiled | RegexOptions.CultureInvariant);

        private readonly VisionDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(VisionDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost]
        [Route("signup")]
        public async Task<IActionResult> Signup([FromBody] SignupRequest request)
        {
            try
            {
                if (request == null)
                    return BadRequest(new { success = false, status = false, error = "Invalid request body.", message = "Invalid request body." });

                var name = (request.Name ?? string.Empty).Trim();
                var email = (request.Email ?? string.Empty).Trim().ToLowerInvariant();
                var password = request.Password ?? string.Empty;
                var jobTitle = (request.Role ?? string.Empty).Trim();
                var department = (request.Department ?? string.Empty).Trim();

                var errors = new Dictionary<string, string>();

                if (string.IsNullOrWhiteSpace(name))
                    errors["name"] = "Enter your full name.";
                else if (name.Length > 80)
                    errors["name"] = "Use 80 characters or fewer.";

                if (string.IsNullOrWhiteSpace(email) || !EmailRegex.IsMatch(email))
                    errors["email"] = "Enter a valid email address.";
                else if (email.Length > 254)
                    errors["email"] = "Email must be 254 characters or fewer.";

                var passwordByteCount = Encoding.UTF8.GetByteCount(password);
                if (password.Length < 8)
                    errors["password"] = "Use at least 8 characters.";
                else if (passwordByteCount > 72)
                    errors["password"] = "Use at most 72 bytes.";
                else if (!Regex.IsMatch(password, "[A-Za-z]") || !Regex.IsMatch(password, @"\d"))
                    errors["password"] = "Include at least one letter and one number.";

                if (jobTitle.Length > 60)
                    errors["role"] = "Job title must be 60 characters or fewer.";

                if (department.Length > 60)
                    errors["department"] = "Department must be 60 characters or fewer.";

                if (errors.Count > 0)
                {
                    var firstError = errors.Values.First();
                    return BadRequest(new { success = false, status = false, error = firstError, message = firstError, errors });
                }

                var emailExists = await _context.Users.AnyAsync(u => u.Email.ToLower() == email);
                if (emailExists)
                    return Conflict(new { success = false, status = false, error = "An account with this email already exists.", message = "An account with this email already exists." });

                var now = DateTime.UtcNow;
                var newUser = new User
                {
                    FullName = name,
                    Email = email,
                    PasswordHash = HashPassword(password),
                    AvatarUrl = string.Empty,
                    JobTitle = jobTitle,
                    Department = department,
                    Status = "online",
                    IsActive = true,
                    CreatedAt = now,
                    UpdatedAt = now
                };

                _context.Users.Add(newUser);
                await _context.SaveChangesAsync();

                var token = GenerateJwtToken(newUser);

                return StatusCode(StatusCodes.Status201Created, new
                {
                    success = true,
                    status = true,
                    message = "Account created successfully! Please sign in.",
                    token,
                    user = MapUserDto(newUser)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, status = false, error = "An error occurred while registering the user.", message = ex.Message });
            }
        }

        [HttpPost]
        [Route("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                if (request == null)
                    return BadRequest(new { success = false, status = false, error = "Invalid request body.", message = "Invalid request body." });

                var email = (request.Email ?? string.Empty).Trim().ToLowerInvariant();
                var password = request.Password ?? string.Empty;

                if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
                    return BadRequest(new { success = false, status = false, error = "Email and password are required.", message = "Email and password are required." });

                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email && u.IsActive);
                if (user == null || !VerifyPassword(password, user.PasswordHash))
                    return Unauthorized(new { success = false, status = false, error = "Invalid email or password.", message = "Invalid email or password." });

                var token = GenerateJwtToken(user);

                return Ok(new
                {
                    success = true,
                    status = true,
                    message = "Login successful!",
                    token,
                    user = MapUserDto(user)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, status = false, error = "An error occurred while signing in.", message = ex.Message });
            }
        }

        [HttpPost]
        [Route("logout")]
        public IActionResult Logout()
        {
            return Ok(new { success = true, status = true, message = "Logged out successfully." });
        }

        [HttpGet]
        [Authorize]
        [Route("me")]
        public async Task<IActionResult> Me()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier)
                              ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);

            if (!int.TryParse(userIdClaim, out var userId))
                return Unauthorized(new { success = false, status = false, error = "Invalid token.", message = "Invalid token." });

            var user = await _context.Users.FindAsync(userId);
            if (user == null || !user.IsActive)
                return Unauthorized(new { success = false, status = false, error = "User not found.", message = "User not found." });

            return Ok(new { success = true, status = true, user = MapUserDto(user) });
        }

        private static string HashPassword(string password)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(bytes);
        }

        private static bool VerifyPassword(string plainPassword, string? storedHash)
        {
            if (string.IsNullOrEmpty(storedHash)) return false;

            var computedBytes = Encoding.UTF8.GetBytes(HashPassword(plainPassword));
            var storedBytes = Encoding.UTF8.GetBytes(storedHash);
            return computedBytes.Length == storedBytes.Length &&
                   CryptographicOperations.FixedTimeEquals(computedBytes, storedBytes);
        }

        private string GenerateJwtToken(User user)
        {
            var jwtKey = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key is not configured.");
            var issuer = _configuration["Jwt:Issuer"] ?? "Vision.API";
            var audience = _configuration["Jwt:Audience"] ?? "Vision.Frontend";
            var expiryMinutes = int.TryParse(_configuration["Jwt:ExpiryMinutes"], out var mins) ? mins : 1440;

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(JwtRegisteredClaimNames.Name, user.FullName),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private static object MapUserDto(User user)
        {
            return new
            {
                id = user.Id.ToString(),
                name = user.FullName,
                email = user.Email,
                avatar = user.AvatarUrl,
                role = user.JobTitle,
                department = user.Department,
                status = user.Status
            };
        }
    }
}
