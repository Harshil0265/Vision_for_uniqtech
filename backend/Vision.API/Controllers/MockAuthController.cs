using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace Vision.API.Controllers;

[ApiController]
[Route("api/auth")]
public class MockAuthController : ControllerBase
{
    private readonly IConfiguration _configuration;

    // Mock users for testing
    private static readonly List<MockUser> MockUsers = new()
    {
        new MockUser 
        { 
            Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
            Name = "Sarah Jenkins", 
            Email = "sarah@vision.dev",
            Password = "password123",
            Avatar = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
            Role = "Product Manager",
            Department = "Platform",
            Status = "online"
        },
        new MockUser 
        { 
            Id = Guid.Parse("00000000-0000-0000-0000-000000000002"),
            Name = "Alex Rivera", 
            Email = "alex@vision.dev",
            Password = "password123",
            Avatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
            Role = "Architect",
            Department = "Engineering",
            Status = "online"
        },
        new MockUser 
        { 
            Id = Guid.NewGuid(),
            Name = "Test User", 
            Email = "test@test.com",
            Password = "test",
            Avatar = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
            Role = "Developer",
            Department = "Engineering",
            Status = "online"
        }
    };

    public MockAuthController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    [HttpPost("signup")]
    public IActionResult SignUp([FromBody] SignUpRequest request)
    {
        if (MockUsers.Any(u => u.Email == request.Email))
        {
            return BadRequest(new { success = false, error = "User already exists" });
        }

        var newUser = new MockUser
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Email = request.Email,
            Password = request.Password ?? "password123",
            Avatar = $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(request.Name)}&size=150",
            Role = request.Role ?? "Developer",
            Department = request.Department ?? "Engineering",
            Status = "online"
        };

        MockUsers.Add(newUser);
        var token = GenerateJwtToken(newUser);

        return Ok(new
        {
            success = true,
            user = new
            {
                id = newUser.Id,
                name = newUser.Name,
                email = newUser.Email,
                avatar = newUser.Avatar,
                role = newUser.Role,
                department = newUser.Department,
                status = newUser.Status
            },
            token
        });
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        var user = MockUsers.FirstOrDefault(u => u.Email == request.Email);
        
        if (user == null || user.Password != request.Password)
        {
            return Unauthorized(new { success = false, error = "Invalid credentials" });
        }

        var token = GenerateJwtToken(user);

        return Ok(new
        {
            success = true,
            user = new
            {
                id = user.Id,
                name = user.Name,
                email = user.Email,
                avatar = user.Avatar,
                role = user.Role,
                department = user.Department,
                status = user.Status
            },
            token
        });
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        return Ok(new { success = true });
    }

    [HttpGet("me")]
    public IActionResult GetCurrentUser()
    {
        var user = MockUsers[0];
        return Ok(new { success = true, user = new { id = user.Id, name = user.Name, email = user.Email, avatar = user.Avatar, role = user.Role, department = user.Department, status = user.Status } });
    }

    [HttpGet("users")]
    public IActionResult GetAllUsers()
    {
        return Ok(new { success = true, users = MockUsers.Select(u => new { id = u.Id, name = u.Name, email = u.Email, avatar = u.Avatar, role = u.Role, department = u.Department, status = u.Status }) });
    }

    private string GenerateJwtToken(MockUser user)
    {
        var jwtSettings = _configuration.GetSection("Jwt");
        var secretKey = jwtSettings["Secret"];
        
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Name, user.Name),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(24),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

public class MockUser
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
    public string Avatar { get; set; } = "";
    public string Role { get; set; } = "";
    public string Department { get; set; } = "";
    public string Status { get; set; } = "";
}

public class SignUpRequest
{
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string? Password { get; set; }
    public string? Role { get; set; }
    public string? Department { get; set; }
}

public class LoginRequest
{
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
}
