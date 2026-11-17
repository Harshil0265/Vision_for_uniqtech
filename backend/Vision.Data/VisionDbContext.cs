using Microsoft.EntityFrameworkCore;
using Vision.Data.Entities;

namespace Vision.Data;

public class VisionDbContext : DbContext
{
    public VisionDbContext(DbContextOptions<VisionDbContext> options) : base(options) { }

    // DbSets
    public DbSet<User> Users { get; set; }
    public DbSet<Project> Projects { get; set; }
    public DbSet<ProjectAllowedIssueType> ProjectAllowedIssueTypes { get; set; }
    public DbSet<Sprint> Sprints { get; set; }
    public DbSet<Issue> Issues { get; set; }
    public DbSet<IssueLabel> IssueLabels { get; set; }
    public DbSet<Subtask> Subtasks { get; set; }
    public DbSet<Comment> Comments { get; set; }
    public DbSet<CommentMention> CommentMentions { get; set; }
    public DbSet<Activity> Activities { get; set; }
    public DbSet<KanbanColumn> KanbanColumns { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User configuration (Matches the SQL table Users)
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users");
            entity.HasKey(e => e.ID);
            entity.Property(e => e.ID).HasColumnName("ID").ValueGeneratedOnAdd();
            entity.Property(e => e.FullName).HasColumnName("FullName").HasMaxLength(100);
            entity.Property(e => e.GmailAddress).HasColumnName("GmailAddress").HasMaxLength(100);
            entity.Property(e => e.Password).HasColumnName("Password").HasMaxLength(50);
            entity.Property(e => e.CreatedDateTime).HasColumnName("CreatedDateTime");
            entity.Property(e => e.JobTitle).HasColumnName("JobTitle").HasMaxLength(50);
            entity.Property(e => e.Department).HasColumnName("Department").HasMaxLength(50);
        });

        // Project configuration
        modelBuilder.Entity<Project>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Key).IsUnique();
            entity.Property(e => e.Key).HasMaxLength(10).IsRequired();
            entity.Ignore(e => e.Lead);
        });

        // ProjectAllowedIssueType configuration
        modelBuilder.Entity<ProjectAllowedIssueType>(entity =>
        {
            entity.HasOne(e => e.Project)
                .WithMany(p => p.AllowedIssueTypes)
                .HasForeignKey(e => e.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Sprint configuration
        modelBuilder.Entity<Sprint>(entity =>
        {
            entity.HasOne(e => e.Project)
                .WithMany(p => p.Sprints)
                .HasForeignKey(e => e.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Issue configuration
        modelBuilder.Entity<Issue>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Key).IsUnique();
            entity.Property(e => e.Key).HasMaxLength(20).IsRequired();
            entity.Ignore(e => e.Assignee);
            entity.Ignore(e => e.Reporter);

            entity.HasOne(e => e.Project)
                .WithMany(p => p.Issues)
                .HasForeignKey(e => e.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Sprint)
                .WithMany(s => s.Issues)
                .HasForeignKey(e => e.SprintId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // IssueLabel configuration
        modelBuilder.Entity<IssueLabel>(entity =>
        {
            entity.HasOne(e => e.Issue)
                .WithMany(i => i.Labels)
                .HasForeignKey(e => e.IssueId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Subtask configuration
        modelBuilder.Entity<Subtask>(entity =>
        {
            entity.HasOne(e => e.Issue)
                .WithMany(i => i.Subtasks)
                .HasForeignKey(e => e.IssueId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Comment configuration
        modelBuilder.Entity<Comment>(entity =>
        {
            entity.Ignore(e => e.Author);
            entity.HasOne(e => e.Issue)
                .WithMany(i => i.Comments)
                .HasForeignKey(e => e.IssueId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // CommentMention configuration
        modelBuilder.Entity<CommentMention>(entity =>
        {
            entity.HasOne(e => e.Comment)
                .WithMany(c => c.Mentions)
                .HasForeignKey(e => e.CommentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Activity configuration
        modelBuilder.Entity<Activity>(entity =>
        {
            entity.Ignore(e => e.User);
            entity.HasOne(e => e.Issue)
                .WithMany(i => i.Activities)
                .HasForeignKey(e => e.IssueId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // KanbanColumn configuration
        modelBuilder.Entity<KanbanColumn>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasMaxLength(50);
        });

        // Notification configuration
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.Ignore(e => e.User);
            entity.Ignore(e => e.Author);
        });

        // RefreshToken configuration
        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.Ignore(e => e.User);
            entity.HasIndex(e => e.Token).IsUnique();
        });

        SeedData(modelBuilder);
    }

    private void SeedData(ModelBuilder modelBuilder)
    {
        var now = DateTime.UtcNow;

        // Seed KanbanColumns
        var columns = new[]
        {
            new KanbanColumn { Id = "backlog", Name = "Backlog", WipLimit = 0, Color = "#64748b", Category = "todo", DisplayOrder = 1, CreatedAt = now, UpdatedAt = now },
            new KanbanColumn { Id = "todo", Name = "To Do", WipLimit = 8, Color = "#2563eb", Category = "todo", DisplayOrder = 2, CreatedAt = now, UpdatedAt = now },
            new KanbanColumn { Id = "in_progress", Name = "In Progress", WipLimit = 4, Color = "#d97706", Category = "in_progress", DisplayOrder = 3, CreatedAt = now, UpdatedAt = now },
            new KanbanColumn { Id = "code_review", Name = "Code Review", WipLimit = 3, Color = "#7c3aed", Category = "in_progress", DisplayOrder = 4, CreatedAt = now, UpdatedAt = now },
            new KanbanColumn { Id = "qa_staging", Name = "QA & Staging", WipLimit = 3, Color = "#db2777", Category = "in_progress", DisplayOrder = 5, CreatedAt = now, UpdatedAt = now },
            new KanbanColumn { Id = "done", Name = "Done", WipLimit = 0, Color = "#059669", Category = "done", DisplayOrder = 6, CreatedAt = now, UpdatedAt = now }
        };
        modelBuilder.Entity<KanbanColumn>().HasData(columns);
    }
}
