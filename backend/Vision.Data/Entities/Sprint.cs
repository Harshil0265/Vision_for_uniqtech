namespace Vision.Data.Entities;

public class Sprint
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Goal { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string Status { get; set; } = "planned";
    public DateTime? CompletedAt { get; set; }
    public int PlannedPoints { get; set; }
    public int CompletedPoints { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public Project Project { get; set; } = null!;
    public ICollection<Issue> Issues { get; set; } = new List<Issue>();
}
