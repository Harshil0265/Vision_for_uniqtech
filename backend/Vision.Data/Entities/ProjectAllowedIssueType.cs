namespace Vision.Data.Entities;

public class ProjectAllowedIssueType
{
    public int Id { get; set; }
    public Guid ProjectId { get; set; }
    public string IssueType { get; set; } = string.Empty;

    // Navigation property
    public Project Project { get; set; } = null!;
}
