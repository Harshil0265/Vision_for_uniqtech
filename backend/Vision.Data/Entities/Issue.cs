namespace Vision.Data.Entities;

public class Issue
{
    public Guid Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public Guid ProjectId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Priority { get; set; } = "medium";
    public string Status { get; set; } = "backlog";
    public Guid? AssigneeId { get; set; }
    public Guid ReporterId { get; set; }
    public Guid? SprintId { get; set; }
    public int StoryPoints { get; set; }
    public string? EpicKey { get; set; }
    public string? EpicTitle { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public Project Project { get; set; } = null!;
    public User? Assignee { get; set; }
    public User Reporter { get; set; } = null!;
    public Sprint? Sprint { get; set; }
    public ICollection<IssueLabel> Labels { get; set; } = new List<IssueLabel>();
    public ICollection<Subtask> Subtasks { get; set; } = new List<Subtask>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<Activity> Activities { get; set; } = new List<Activity>();
}
