namespace Vision.Data.Entities;

public class Comment
{
    public Guid Id { get; set; }
    public Guid IssueId { get; set; }
    public Guid AuthorId { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public Issue Issue { get; set; } = null!;
    public User Author { get; set; } = null!;
    public ICollection<CommentMention> Mentions { get; set; } = new List<CommentMention>();
}
