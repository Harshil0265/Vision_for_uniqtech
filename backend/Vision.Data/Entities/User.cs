using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Vision.Data.Entities;

[Table("Users")]
public class User
{
    [Key]
    [Column("ID")]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int ID { get; set; }

    [Column("FullName")]
    [MaxLength(100)]
    public string? FullName { get; set; }

    [Column("GmailAddress")]
    [MaxLength(100)]
    public string? GmailAddress { get; set; }

    [Column("Password")]
    [MaxLength(50)]
    public string? Password { get; set; }

    [Column("CreatedDateTime")]
    public DateTime? CreatedDateTime { get; set; }

    [Column("JobTitle")]
    [MaxLength(50)]
    public string? JobTitle { get; set; }

    [Column("Department")]
    [MaxLength(50)]
    public string? Department { get; set; }
}
