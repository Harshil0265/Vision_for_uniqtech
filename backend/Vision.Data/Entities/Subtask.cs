namespace Vision.Data.Entities;

public class Subtask
{
    public Guid Id { get; set; }
    public Guid IssueId { get; set; }
    public string Title { get; set; } = string.Empty;
    public bool Completed { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation property
    public Issue Issue { get; set; } = null!;
}
