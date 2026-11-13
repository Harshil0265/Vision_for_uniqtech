namespace Vision.Data.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Avatar { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public ICollection<Project> LeadProjects { get; set; } = new List<Project>();
    public ICollection<Issue> AssignedIssues { get; set; } = new List<Issue>();
    public ICollection<Issue> ReportedIssues { get; set; } = new List<Issue>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<Activity> Activities { get; set; } = new List<Activity>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}
