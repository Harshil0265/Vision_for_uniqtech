namespace Vision.Data.Entities;

public class Notification
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public bool Read { get; set; }
    public string Type { get; set; } = string.Empty;
    public string? IssueKey { get; set; }
    public Guid? AuthorId { get; set; }

    // Navigation properties
    public User User { get; set; } = null!;
    public User? Author { get; set; }
}
