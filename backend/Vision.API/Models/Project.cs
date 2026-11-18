using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Vision.API.Models
{
    [Table("Projects")]
    public class Project
    {
        [Key]
        [Column("ProjectID")]
        public int Id { get; set; }

        [Column("ProjectName")]
        [MaxLength(100)]
        public string ProjectName { get; set; } = string.Empty;

        [Column("ProjectKey")]
        [MaxLength(10)]
        public string ProjectKey { get; set; } = string.Empty;

        [Column("Description")]
        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;

        [Column("ProjectLeadID")]
        public int ProjectLeadId { get; set; }

        [Column("Template")]
        [MaxLength(30)]
        public string Template { get; set; } = "Scrum";

        [Column("DefaultAssigneeMode")]
        [MaxLength(20)]
        public string DefaultAssigneeMode { get; set; } = "unassigned";

        [Column("DefaultAssigneeID")]
        public int? DefaultAssigneeId { get; set; }

        [Column("IconGradient")]
        [MaxLength(100)]
        public string IconGradient { get; set; } = "from-blue-600 via-indigo-600 to-sky-500";

        [Column("IssueSequence")]
        public int IssueSequence { get; set; } = 100;

        [Column("IsArchived")]
        public bool IsArchived { get; set; }

        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; }

        [Column("UpdatedAt")]
        public DateTime UpdatedAt { get; set; }
    }
}
