namespace Vision.Common.DTOs;

public class AuthResponse
{
    public bool Success { get; set; }
    public UserDto? User { get; set; }
    public string? Token { get; set; }
    public string? Error { get; set; }
}
