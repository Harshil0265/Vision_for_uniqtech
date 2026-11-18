using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Vision.API.Models
{
    [Table("WorkItems")]
    public class WorkItem
    {
        [Key]
        [Column("WorkItemID")]
        public int Id { get; set; }

        [Column("WorkItemKey")]
        [MaxLength(20)]
        public string WorkItemKey { get; set; } = string.Empty;

        [Column("ProjectID")]
        public int ProjectId { get; set; }

        [Column("StatusID")]
        public int StatusId { get; set; }

        [Column("WorkItemTypeID")]
        public int WorkItemTypeId { get; set; }

        [Column("PriorityID")]
        public int PriorityId { get; set; }

        [Column("Summary")]
        [MaxLength(200)]
        public string Summary { get; set; } = string.Empty;

        [Column("Description")]
        public string Description { get; set; } = string.Empty;

        [Column("AssigneeID")]
        public int? AssigneeId { get; set; }

        [Column("ReporterID")]
        public int ReporterId { get; set; }

        [Column("SprintID")]
        public int? SprintId { get; set; }

        [Column("ParentEpicID")]
        public int? ParentEpicId { get; set; }

        [Column("StoryPointID")]
        public int? StoryPointId { get; set; }

        [Column("StoryPoints")]
        public int StoryPoints { get; set; }

        [Column("DueDate")]
        public DateTime? DueDate { get; set; }

        [Column("StartedAt")]
        public DateTime? StartedAt { get; set; }

        [Column("CompletedAt")]
        public DateTime? CompletedAt { get; set; }

        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; }

        [Column("UpdatedAt")]
        public DateTime UpdatedAt { get; set; }
    }

    [Table("WorkItemLabels")]
    public class WorkItemLabel
    {
        [Key]
        [Column("WorkItemLabelID")]
        public int Id { get; set; }

        [Column("WorkItemID")]
        public int WorkItemId { get; set; }

        [Column("LabelName")]
        [MaxLength(24)]
        public string LabelName { get; set; } = string.Empty;
    }
}
