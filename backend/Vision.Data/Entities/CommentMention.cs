namespace Vision.Data.Entities;

public class CommentMention
{
    public int Id { get; set; }
    public Guid CommentId { get; set; }
    public string MentionedText { get; set; } = string.Empty;

    // Navigation property
    public Comment Comment { get; set; } = null!;
}
