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

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Email).HasMaxLength(320).IsRequired();
            entity.Property(e => e.PasswordHash).HasMaxLength(256).IsRequired();
        });

        // Project configuration
        modelBuilder.Entity<Project>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Key).IsUnique();
            entity.Property(e => e.Key).HasMaxLength(10).IsRequired();

            entity.HasOne(e => e.Lead)
                .WithMany(u => u.LeadProjects)
                .HasForeignKey(e => e.LeadId)
                .OnDelete(DeleteBehavior.Restrict);
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

            entity.HasOne(e => e.Project)
                .WithMany(p => p.Issues)
                .HasForeignKey(e => e.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Assignee)
                .WithMany(u => u.AssignedIssues)
                .HasForeignKey(e => e.AssigneeId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.Reporter)
                .WithMany(u => u.ReportedIssues)
                .HasForeignKey(e => e.ReporterId)
                .OnDelete(DeleteBehavior.Restrict);

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
            entity.HasOne(e => e.Issue)
                .WithMany(i => i.Comments)
                .HasForeignKey(e => e.IssueId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Author)
                .WithMany(u => u.Comments)
                .HasForeignKey(e => e.AuthorId)
                .OnDelete(DeleteBehavior.Restrict);
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
            entity.HasOne(e => e.Issue)
                .WithMany(i => i.Activities)
                .HasForeignKey(e => e.IssueId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                .WithMany(u => u.Activities)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);
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
            entity.HasOne(e => e.User)
                .WithMany(u => u.Notifications)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Author)
                .WithMany()
                .HasForeignKey(e => e.AuthorId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // RefreshToken configuration
        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasIndex(e => e.Token).IsUnique();

            entity.HasOne(e => e.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        SeedData(modelBuilder);
    }

    private void SeedData(ModelBuilder modelBuilder)
    {
        var now = DateTime.UtcNow;
        
        // Seed Users (password: Password123!)
        var users = new[]
        {
            new User
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                Name = "Sarah Jenkins",
                Email = "sarah.jenkins@vision.dev",
                Avatar = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
                Role = "Staff Product Manager",
                Department = "Platform Systems",
                Status = "online",
                PasswordHash = "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIpWy7p5fq",
                CreatedAt = now,
                UpdatedAt = now
            },
            new User
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                Name = "Alex Rivera",
                Email = "alex.rivera@vision.dev",
                Avatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
                Role = "Principal Architect",
                Department = "Engineering",
                Status = "online",
                PasswordHash = "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIpWy7p5fq",
                CreatedAt = now,
                UpdatedAt = now
            }
        };
        modelBuilder.Entity<User>().HasData(users);

        // Seed KanbanColumns
        var columns = new[]
        {
            new KanbanColumn { Id = "backlog", Name = "Backlog", WipLimit = 0, Color = "#64748b", Category = "todo", DisplayOrder = 1, CreatedAt = now, UpdatedAt = now },
            new KanbanColumn { Id = "todo", Name = "To Do", WipLimit = 8, Color = "#2563eb", Category = "todo", DisplayOrder = 2, CreatedAt = now, UpdatedAt = now },
            new KanbanColumn { Id = "in_progress", Name = "In Progress", WipLimit = 4, Color = "#d97706", Category = "in_progress", DisplayOrder = 3, CreatedAt = now, UpdatedAt = now },
            new KanbanColumn { Id = "done", Name = "Done", WipLimit = 0, Color = "#059669", Category = "done", DisplayOrder = 4, CreatedAt = now, UpdatedAt = now }
        };
        modelBuilder.Entity<KanbanColumn>().HasData(columns);

        // Seed Projects
        var projects = new[]
        {
            new Project
            {
                Id = Guid.Parse("10000000-0000-0000-0000-000000000001"),
                Name = "Platform Engineering",
                Key = "OP",
                Description = "Core platform development",
                LeadId = users[1].Id,
                Template = "Scrum",
                DefaultAssignee = "unassigned",
                IconGradient = "from-blue-600 to-sky-500",
                CreatedAt = now,
                UpdatedAt = now
            }
        };
        modelBuilder.Entity<Project>().HasData(projects);
    }
}
