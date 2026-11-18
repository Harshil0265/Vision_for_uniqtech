using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Vision.API.Models
{
    [Table("WorkItemTypes")]
    public class WorkItemTypeEntity
    {
        [Key]
        [Column("WorkItemTypeID")]
        public int Id { get; set; }

        [Column("TypeKey")]
        public string TypeKey { get; set; } = string.Empty;

        [Column("TypeName")]
        public string TypeName { get; set; } = string.Empty;

        [Column("Description")]
        public string? Description { get; set; }

        [Column("DisplayOrder")]
        public int DisplayOrder { get; set; }

        [Column("IsActive")]
        public bool IsActive { get; set; } = true;
    }

    [Table("WorkItemPriorities")]
    public class WorkItemPriority
    {
        [Key]
        [Column("PriorityID")]
        public int Id { get; set; }

        [Column("PriorityKey")]
        public string PriorityKey { get; set; } = string.Empty;

        [Column("PriorityName")]
        public string PriorityName { get; set; } = string.Empty;

        [Column("ColorHex")]
        public string ColorHex { get; set; } = "#64748b";

        [Column("DisplayOrder")]
        public int DisplayOrder { get; set; }

        [Column("IsActive")]
        public bool IsActive { get; set; } = true;
    }

    [Table("WorkItemStatuses")]
    public class WorkItemStatus
    {
        [Key]
        [Column("StatusID")]
        public int Id { get; set; }

        [Column("StatusKey")]
        public string StatusKey { get; set; } = string.Empty;

        [Column("StatusName")]
        public string StatusName { get; set; } = string.Empty;

        [Column("Category")]
        public string Category { get; set; } = "todo";

        [Column("WipLimit")]
        public int WipLimit { get; set; }

        [Column("ColorHex")]
        public string ColorHex { get; set; } = "#2563eb";

        [Column("DisplayOrder")]
        public int DisplayOrder { get; set; }

        [Column("IsActive")]
        public bool IsActive { get; set; } = true;
    }

    [Table("WorkItemStoryPoints")]
    public class WorkItemStoryPoint
    {
        [Key]
        [Column("StoryPointID")]
        public int Id { get; set; }

        [Column("PointLabel")]
        public string PointLabel { get; set; } = string.Empty;

        [Column("NumericValue")]
        public int NumericValue { get; set; }

        [Column("DisplayOrder")]
        public int DisplayOrder { get; set; }
    }

    [Table("Sprints")]
    public class Sprint
    {
        [Key]
        [Column("SprintID")]
        public int Id { get; set; }

        [Column("ProjectID")]
        public int ProjectId { get; set; }

        [Column("SprintName")]
        public string SprintName { get; set; } = string.Empty;

        [Column("Goal")]
        public string Goal { get; set; } = string.Empty;

        [Column("StartDate")]
        public DateTime StartDate { get; set; }

        [Column("EndDate")]
        public DateTime EndDate { get; set; }

        [Column("Status")]
        public string Status { get; set; } = "planned";

        [Column("PlannedPoints")]
        public int PlannedPoints { get; set; }

        [Column("CompletedPoints")]
        public int CompletedPoints { get; set; }

        [Column("CompletedAt")]
        public DateTime? CompletedAt { get; set; }

        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; }

        [Column("UpdatedAt")]
        public DateTime UpdatedAt { get; set; }
    }
}
