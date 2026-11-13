namespace Vision.Data.Entities;

public class Project
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Key { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Guid LeadId { get; set; }
    public string Template { get; set; } = string.Empty;
    public string DefaultAssignee { get; set; } = "unassigned";
    public string IconGradient { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public User Lead { get; set; } = null!;
    public ICollection<ProjectAllowedIssueType> AllowedIssueTypes { get; set; } = new List<ProjectAllowedIssueType>();
    public ICollection<Issue> Issues { get; set; } = new List<Issue>();
    public ICollection<Sprint> Sprints { get; set; } = new List<Sprint>();
}
