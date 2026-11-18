using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Vision.API.Models
{
    [Table("Users")]
    public class User
    {
        [Key]
        [Column("UserID")]
        public int Id { get; set; }

        [Column("FullName")]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Column("Email")]
        [MaxLength(254)]
        public string Email { get; set; } = string.Empty;

        [Column("PasswordHash")]
        [MaxLength(256)]
        public string? PasswordHash { get; set; }

        [Column("AvatarUrl")]
        [MaxLength(500)]
        public string AvatarUrl { get; set; } = string.Empty;

        [Column("JobTitle")]
        [MaxLength(60)]
        public string JobTitle { get; set; } = string.Empty;

        [Column("Department")]
        [MaxLength(60)]
        public string Department { get; set; } = string.Empty;

        [Column("Status")]
        [MaxLength(20)]
        public string Status { get; set; } = "online";

        [Column("IsActive")]
        public bool IsActive { get; set; } = true;

        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; }

        [Column("UpdatedAt")]
        public DateTime UpdatedAt { get; set; }
    }
}
