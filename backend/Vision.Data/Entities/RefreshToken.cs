namespace Vision.Data.Entities;

/// <summary>
/// Represents a refresh token for JWT authentication.
/// Requirements: 3.13, 3.14
/// </summary>
public class RefreshToken
{
    /// <summary>
    /// Primary key identifier for the refresh token.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Foreign key to the User who owns this refresh token.
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// The actual token string. Must be unique across all refresh tokens.
    /// </summary>
    public string Token { get; set; } = string.Empty;

    /// <summary>
    /// The date and time when this refresh token expires.
    /// </summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// The date and time when this refresh token was created.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// The date and time when this refresh token was revoked (nullable).
    /// If null, the token has not been revoked.
    /// </summary>
    public DateTime? RevokedAt { get; set; }

    // Navigation Properties

    /// <summary>
    /// Navigation property to the User who owns this refresh token.
    /// </summary>
    public User User { get; set; } = null!;
}
