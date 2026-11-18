namespace Vision.API.Models
{
    public class ProjectRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Key { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int LeadId { get; set; }
        public string DefaultAssignee { get; set; } = "unassigned";
        public List<string> AllowedIssueTypes { get; set; } = new();
        public List<int>? MemberIds { get; set; }
    }
}
