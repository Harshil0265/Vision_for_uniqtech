using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Vision.API.Models
{
    [Table("ProjectMembers")]
    public class ProjectMember
    {
        [Column("ProjectID")]
        public int ProjectId { get; set; }

        [Column("UserID")]
        public int UserId { get; set; }

        [Column("ProjectRole")]
        [MaxLength(20)]
        public string ProjectRole { get; set; } = "member";

        [Column("AddedAt")]
        public DateTime AddedAt { get; set; }

        [Column("AddedByUserID")]
        public int? AddedByUserId { get; set; }
    }

    [Table("ProjectWorkItemTypes")]
    public class ProjectWorkItemType
    {
        [Column("ProjectID")]
        public int ProjectId { get; set; }

        [Column("WorkItemTypeID")]
        public int WorkItemTypeId { get; set; }
    }
}
