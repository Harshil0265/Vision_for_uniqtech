namespace Vision.API.Models
{
    public class WorkItemRequest
    {
        public int ProjectId { get; set; }
        public string Type { get; set; } = "task";
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Priority { get; set; } = "medium";
        public string Status { get; set; } = "todo";
        public int? AssigneeId { get; set; }
        public int? SprintId { get; set; }
        public int StoryPoints { get; set; }
        public string? DueDate { get; set; }
        public string? EpicKey { get; set; }
        public List<string>? Labels { get; set; }
    }
}
