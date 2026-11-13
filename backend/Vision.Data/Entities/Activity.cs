namespace Vision.Data.Entities;

public class Activity
{
    public Guid Id { get; set; }
    public Guid IssueId { get; set; }
    public Guid UserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? Details { get; set; }
    public DateTime Timestamp { get; set; }

    // Navigation properties
    public Issue Issue { get; set; } = null!;
    public User User { get; set; } = null!;
}
