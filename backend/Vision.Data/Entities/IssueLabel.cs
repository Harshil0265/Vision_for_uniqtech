namespace Vision.Data.Entities;

public class IssueLabel
{
    public int Id { get; set; }
    public Guid IssueId { get; set; }
    public string Label { get; set; } = string.Empty;

    // Navigation property
    public Issue Issue { get; set; } = null!;
}
