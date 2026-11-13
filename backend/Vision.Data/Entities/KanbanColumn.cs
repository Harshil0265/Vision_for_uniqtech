namespace Vision.Data.Entities;

public class KanbanColumn
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int WipLimit { get; set; }
    public string Color { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
