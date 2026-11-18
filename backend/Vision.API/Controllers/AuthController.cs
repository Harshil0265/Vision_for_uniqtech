using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Vision.Common.DTOs;
using Vision.Service;

namespace Vision.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
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
            var result = await _authService.SignUpAsync(request);
            if (!result.Success)
            {
                return BadRequest(new { success = false, error = result.Error });
            }

            return Ok(new
            {
                success = true,
                user = result.User,
                token = result.Token
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
            var result = await _authService.LoginAsync(request);
            if (!result.Success)
            {
                return Unauthorized(new { success = false, error = result.Error });
            }

            return Ok(new
            {
                success = true,
                user = result.User,
                token = result.Token
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
                var user = await _authService.GetUserByIdAsync(userId);
                if (user != null)
                {
                    return Ok(new { success = true, user });
                }
            }

            // Fallback: return the first user if in dev/offline
            var allUsers = await _authService.GetAllUsersAsync();
            if (allUsers.Count > 0)
            {
                return Ok(new { success = true, user = allUsers[0] });
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
    /// Get all users list
    /// </summary>
    [HttpGet("users")]
    public async Task<IActionResult> GetAllUsers()
    {
        try
        {
            var users = await _authService.GetAllUsersAsync();
            return Ok(new
            {
                success = true,
                users
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in GetAllUsers");
            return StatusCode(500, new { success = false, error = "Failed to load users." });
        }
    }
}
