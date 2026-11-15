# Design Document: .NET Core Migration

## Overview

This document specifies the technical design for migrating the Vision project management application from a Node.js/Express backend with Clerk authentication to a .NET Core backend with Microsoft SQL Server and custom JWT authentication. The migration transforms a single-tier prototype into a production-ready three-tier architecture while preserving the existing React frontend with minimal changes.

## Architecture

### High-Level Architecture

The system follows a three-layer architecture pattern:

```
┌─────────────────────────────────────────┐
│     React Frontend (Existing)           │
│  - TypeScript/React/Vite                │
│  - TailwindCSS/Lucide                   │
│  - Custom Auth Context                  │
└──────────────┬──────────────────────────┘
               │ HTTP/REST + JWT
┌──────────────┴──────────────────────────┐
│     Vision.API (ASP.NET Core)           │
│  - Controllers                          │
│  - Middleware (Auth, CORS, Logging)     │
│  - DTO Models                           │
└──────────────┬──────────────────────────┘
               │ Service Interfaces
┌──────────────┴──────────────────────────┐
│     Vision.Business (Class Library)     │
│  - Services (Auth, Project, Issue)      │
│  - Business Logic                       │
│  - Validation                           │
└──────────────┬──────────────────────────┘
               │ Repository Interfaces
┌──────────────┴──────────────────────────┐
│     Vision.Data (Class Library)         │
│  - EF Core DbContext                    │
│  - Entity Models                        │
│  - Repositories                         │
└──────────────┬──────────────────────────┘
               │ ADO.NET/EF Core
┌──────────────┴──────────────────────────┐
│     Microsoft SQL Server                │
│  - Relational Database                  │
│  - Stored Procedures (optional)         │
└─────────────────────────────────────────┘
```

### Component Responsibilities

**Vision.API Layer:**
- HTTP request/response handling
- Route definitions and mapping
- Authentication/authorization middleware
- Input validation and DTO transformation
- CORS and security policies
- Error handling and standardized responses
- API documentation (Swagger)

**Vision.Business Layer:**
- Business logic and rules
- Service orchestration
- DTO mapping to/from entities
- Domain validation
- Transaction coordination
- Business exception handling

**Vision.Data Layer:**
- Entity Framework Core DbContext
- Database entity definitions
- Repository pattern implementation
- Database migrations
- Query optimization
- Data access abstraction

## Solution Structure

```
Vision/
├── Vision.sln
├── Vision.API/
│   ├── Controllers/
│   │   ├── AuthController.cs
│   │   ├── ProjectsController.cs
│   │   ├── IssuesController.cs
│   │   ├── SprintsController.cs
│   │   ├── KanbanColumnsController.cs
│   │   └── NotificationsController.cs
│   ├── Middleware/
│   │   ├── GlobalExceptionMiddleware.cs
│   │   ├── RateLimitingMiddleware.cs
│   │   └── RequestLoggingMiddleware.cs
│   ├── Models/
│   │   ├── ApiResponse.cs
│   │   ├── ApiError.cs
│   │   └── PaginatedResponse.cs
│   ├── Program.cs
│   ├── appsettings.json
│   ├── appsettings.Development.json
│   └── appsettings.Production.json
├── Vision.Business/
│   ├── Services/
│   │   ├── IAuthService.cs
│   │   ├── AuthService.cs
│   │   ├── IProjectService.cs
│   │   ├── ProjectService.cs
│   │   ├── IIssueService.cs
│   │   ├── IssueService.cs
│   │   ├── ISprintService.cs
│   │   └── SprintService.cs
│   ├── DTOs/
│   │   ├── Auth/
│   │   │   ├── RegisterRequestDto.cs
│   │   │   ├── LoginRequestDto.cs
│   │   │   ├── LoginResponseDto.cs
│   │   │   └── TokenRefreshDto.cs
│   │   ├── Projects/
│   │   │   ├── ProjectDto.cs
│   │   │   ├── CreateProjectDto.cs
│   │   │   └── UpdateProjectDto.cs
│   │   ├── Issues/
│   │   │   ├── IssueDto.cs
│   │   │   ├── CreateIssueDto.cs
│   │   │   └── UpdateIssueDto.cs
│   │   └── Common/
│   │       ├── UserDto.cs
│   │       └── PaginationDto.cs
│   ├── Validators/
│   │   ├── RegisterRequestValidator.cs
│   │   ├── CreateProjectValidator.cs
│   │   └── CreateIssueValidator.cs
│   └── Exceptions/
│       ├── BusinessException.cs
│       ├── ValidationException.cs
│       └── NotFoundException.cs
├── Vision.Data/
│   ├── Entities/
│   │   ├── User.cs
│   │   ├── Project.cs
│   │   ├── Issue.cs
│   │   ├── Sprint.cs
│   │   ├── Comment.cs
│   │   ├── Activity.cs
│   │   ├── Subtask.cs
│   │   ├── KanbanColumn.cs
│   │   ├── Notification.cs
│   │   └── RefreshToken.cs
│   ├── Repositories/
│   │   ├── IRepository.cs
│   │   ├── Repository.cs
│   │   ├── IUserRepository.cs
│   │   ├── UserRepository.cs
│   │   ├── IProjectRepository.cs
│   │   ├── ProjectRepository.cs
│   │   ├── IIssueRepository.cs
│   │   └── IssueRepository.cs
│   ├── VisionDbContext.cs
│   ├── DbInitializer.cs
│   └── Migrations/
│       └── [EF Core Migrations]
└── Vision.Tests/
    ├── Unit/
    │   ├── Services/
    │   │   ├── AuthServiceTests.cs
    │   │   └── ProjectServiceTests.cs
    │   └── Repositories/
    │       └── UserRepositoryTests.cs
    └── Integration/
        ├── Controllers/
        │   ├── AuthControllerTests.cs
        │   └── ProjectsControllerTests.cs
        └── TestFixtures/
            └── WebApplicationFactory.cs
```

## Database Schema Design

### Entity Relationship Diagram

```
┌─────────────────────┐
│      Users          │
│─────────────────────│
│ Id (PK)             │◄─────┐
│ Name                │      │
│ Email (unique)      │      │
│ Avatar              │      │
│ Role                │      │
│ Department          │      │
│ Status              │      │
│ PasswordHash        │      │
│ CreatedAt           │      │
│ UpdatedAt           │      │
└─────────────────────┘      │
         ▲                   │
         │                   │
         │                   │
┌────────┴────────────┐      │
│   RefreshTokens     │      │
│─────────────────────│      │
│ Id (PK)             │      │
│ UserId (FK)         ├──────┘
│ Token (unique)      │
│ ExpiresAt           │
│ CreatedAt           │
│ RevokedAt           │
└─────────────────────┘

┌─────────────────────┐
│     Projects        │
│─────────────────────│
│ Id (PK)             │◄────────┐
│ Name                │         │
│ Key (unique)        │         │
│ Description         │         │
│ LeadId (FK Users)   │         │
│ Template            │         │
│ DefaultAssignee     │         │
│ IconGradient        │         │
│ CreatedAt           │         │
│ UpdatedAt           │         │
└─────────────────────┘         │
         ▲                      │
         │                      │
┌────────┴─────────────────┐   │
│ ProjectAllowedIssueTypes │   │
│──────────────────────────│   │
│ Id (PK)                  │   │
│ ProjectId (FK)           ├───┘
│ IssueType                │
└──────────────────────────┘

┌─────────────────────┐
│      Sprints        │
│─────────────────────│
│ Id (PK)             │◄────┐
│ ProjectId (FK)      │     │
│ Name                │     │
│ Goal                │     │
│ StartDate           │     │
│ EndDate             │     │
│ Status              │     │
│ CompletedAt         │     │
│ PlannedPoints       │     │
│ CompletedPoints     │     │
│ CreatedAt           │     │
│ UpdatedAt           │     │
└─────────────────────┘     │
                            │
┌─────────────────────┐     │
│      Issues         │     │
│─────────────────────│     │
│ Id (PK)             │     │
│ Key (unique)        │     │
│ ProjectId (FK)      │     │
│ Title               │     │
│ Description         │     │
│ Type                │     │
│ Priority            │     │
│ Status              │     │
│ AssigneeId (FK)     │     │
│ ReporterId (FK)     │     │
│ SprintId (FK)       ├─────┘
│ StoryPoints         │
│ EpicKey             │
│ EpicTitle           │
│ DueDate             │
│ CreatedAt           │
│ UpdatedAt           │
└─────────────────────┘
         ▲
         │
         ├──────────────────┐
         │                  │
┌────────┴────────┐  ┌──────┴──────────┐
│   Subtasks      │  │   Comments      │
│─────────────────│  │─────────────────│
│ Id (PK)         │  │ Id (PK)         │
│ IssueId (FK)    │  │ IssueId (FK)    │
│ Title           │  │ AuthorId (FK)   │
│ Completed       │  │ Content         │
│ CreatedAt       │  │ CreatedAt       │
│ UpdatedAt       │  │ UpdatedAt       │
└─────────────────┘  └─────────────────┘
                              ▲
                              │
                     ┌────────┴────────────┐
                     │  CommentMentions    │
                     │─────────────────────│
                     │ Id (PK)             │
                     │ CommentId (FK)      │
                     │ MentionedText       │
                     └─────────────────────┘

┌─────────────────────┐
│   Activities        │
│─────────────────────│
│ Id (PK)             │
│ IssueId (FK)        │
│ UserId (FK)         │
│ Action              │
│ Details             │
│ Timestamp           │
└─────────────────────┘

┌─────────────────────┐
│  KanbanColumns      │
│─────────────────────│
│ Id (PK)             │
│ Name                │
│ WipLimit            │
│ Color               │
│ Category            │
│ DisplayOrder        │
│ CreatedAt           │
│ UpdatedAt           │
└─────────────────────┘

┌─────────────────────┐
│  Notifications      │
│─────────────────────│
│ Id (PK)             │
│ UserId (FK)         │
│ Title               │
│ Message             │
│ Timestamp           │
│ Read                │
│ Type                │
│ IssueKey            │
│ AuthorId (FK)       │
└─────────────────────┘
```

### Entity Definitions

#### User Entity

```csharp
public class User
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Avatar { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Status { get; set; } = "offline"; // online, busy, away, offline
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public ICollection<Project> LeadProjects { get; set; } = new List<Project>();
    public ICollection<Issue> AssignedIssues { get; set; } = new List<Issue>();
    public ICollection<Issue> ReportedIssues { get; set; } = new List<Issue>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<Activity> Activities { get; set; } = new List<Activity>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}
```

#### Project Entity

```csharp
public class Project
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Key { get; set; } = string.Empty; // e.g., OP, MOB, SEC
    public string Description { get; set; } = string.Empty;
    public Guid LeadId { get; set; }
    public string Template { get; set; } = string.Empty; // Scrum, Kanban, Bug Tracking
    public string DefaultAssignee { get; set; } = "unassigned"; // unassigned, lead
    public string IconGradient { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public User Lead { get; set; } = null!;
    public ICollection<ProjectAllowedIssueType> AllowedIssueTypes { get; set; } = new List<ProjectAllowedIssueType>();
    public ICollection<Issue> Issues { get; set; } = new List<Issue>();
    public ICollection<Sprint> Sprints { get; set; } = new List<Sprint>();
}
```

#### ProjectAllowedIssueType Entity

```csharp
public class ProjectAllowedIssueType
{
    public int Id { get; set; }
    public Guid ProjectId { get; set; }
    public string IssueType { get; set; } = string.Empty; // epic, story, task, bug, spike, subtask, incident

    // Navigation property
    public Project Project { get; set; } = null!;
}
```

#### Sprint Entity

```csharp
public class Sprint
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Goal { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string Status { get; set; } = "planned"; // planned, active, completed
    public DateTime? CompletedAt { get; set; }
    public int PlannedPoints { get; set; }
    public int CompletedPoints { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public Project Project { get; set; } = null!;
    public ICollection<Issue> Issues { get; set; } = new List<Issue>();
}
```

#### Issue Entity

```csharp
public class Issue
{
    public Guid Id { get; set; }
    public string Key { get; set; } = string.Empty; // e.g., OP-101
    public Guid ProjectId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // epic, story, task, bug, spike, subtask, incident
    public string Priority { get; set; } = "medium"; // blocker, high, medium, low, lowest
    public string Status { get; set; } = "backlog"; // References KanbanColumn.Id
    public Guid? AssigneeId { get; set; }
    public Guid ReporterId { get; set; }
    public Guid? SprintId { get; set; }
    public int StoryPoints { get; set; }
    public string? EpicKey { get; set; }
    public string? EpicTitle { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public Project Project { get; set; } = null!;
    public User? Assignee { get; set; }
    public User Reporter { get; set; } = null!;
    public Sprint? Sprint { get; set; }
    public ICollection<IssueLabel> Labels { get; set; } = new List<IssueLabel>();
    public ICollection<Subtask> Subtasks { get; set; } = new List<Subtask>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<Activity> Activities { get; set; } = new List<Activity>();
}
```

#### IssueLabel Entity

```csharp
public class IssueLabel
{
    public int Id { get; set; }
    public Guid IssueId { get; set; }
    public string Label { get; set; } = string.Empty;

    // Navigation property
    public Issue Issue { get; set; } = null!;
}
```

#### Subtask Entity

```csharp
public class Subtask
{
    public Guid Id { get; set; }
    public Guid IssueId { get; set; }
    public string Title { get; set; } = string.Empty;
    public bool Completed { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation property
    public Issue Issue { get; set; } = null!;
}
```

#### Comment Entity

```csharp
public class Comment
{
    public Guid Id { get; set; }
    public Guid IssueId { get; set; }
    public Guid AuthorId { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public Issue Issue { get; set; } = null!;
    public User Author { get; set; } = null!;
    public ICollection<CommentMention> Mentions { get; set; } = new List<CommentMention>();
}
```

#### CommentMention Entity

```csharp
public class CommentMention
{
    public int Id { get; set; }
    public Guid CommentId { get; set; }
    public string MentionedText { get; set; } = string.Empty;

    // Navigation property
    public Comment Comment { get; set; } = null!;
}
```

#### Activity Entity

```csharp
public class Activity
{
    public Guid Id { get; set; }
    public Guid IssueId { get; set; }
    public Guid UserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? Details { get; set; }
    public DateTime Timestamp { get; set; }

    // Navigation properties
    public Issue Issue { get; set; } = null!;
    public User User { get; set; } = null!;
}
```

#### KanbanColumn Entity

```csharp
public class KanbanColumn
{
    public string Id { get; set; } = string.Empty; // backlog, todo, in-progress, etc.
    public string Name { get; set; } = string.Empty;
    public int WipLimit { get; set; } // 0 = no limit
    public string Color { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty; // todo, in_progress, done
    public int DisplayOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

#### Notification Entity

```csharp
public class Notification
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public bool Read { get; set; }
    public string Type { get; set; } = string.Empty; // assignment, mention, priority, sprint, status
    public string? IssueKey { get; set; }
    public Guid? AuthorId { get; set; }

    // Navigation properties
    public User User { get; set; } = null!;
    public User? Author { get; set; }
}
```

#### RefreshToken Entity

```csharp
public class RefreshToken
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? RevokedAt { get; set; }

    // Navigation property
    public User User { get; set; } = null!;
}
```

### DbContext Configuration

```csharp
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
            entity.Property(e => e.Avatar).HasMaxLength(2000);
            entity.Property(e => e.Role).HasMaxLength(100);
            entity.Property(e => e.Department).HasMaxLength(100);
            entity.Property(e => e.Status).HasMaxLength(20);
            entity.Property(e => e.PasswordHash).HasMaxLength(256).IsRequired();
        });

        // Project configuration
        modelBuilder.Entity<Project>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Key).IsUnique();
            entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Key).HasMaxLength(10).IsRequired();
            entity.Property(e => e.Template).HasMaxLength(50);
            entity.Property(e => e.DefaultAssignee).HasMaxLength(50);
            entity.Property(e => e.IconGradient).HasMaxLength(200);

            entity.HasOne(e => e.Lead)
                .WithMany(u => u.LeadProjects)
                .HasForeignKey(e => e.LeadId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ProjectAllowedIssueType configuration
        modelBuilder.Entity<ProjectAllowedIssueType>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.IssueType).HasMaxLength(50).IsRequired();

            entity.HasOne(e => e.Project)
                .WithMany(p => p.AllowedIssueTypes)
                .HasForeignKey(e => e.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Sprint configuration
        modelBuilder.Entity<Sprint>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Status).HasMaxLength(20);

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
            entity.Property(e => e.Title).HasMaxLength(500).IsRequired();
            entity.Property(e => e.Type).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Priority).HasMaxLength(20);
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.Property(e => e.EpicKey).HasMaxLength(20);
            entity.Property(e => e.EpicTitle).HasMaxLength(500);

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
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Label).HasMaxLength(100).IsRequired();

            entity.HasOne(e => e.Issue)
                .WithMany(i => i.Labels)
                .HasForeignKey(e => e.IssueId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Subtask configuration
        modelBuilder.Entity<Subtask>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).HasMaxLength(500).IsRequired();

            entity.HasOne(e => e.Issue)
                .WithMany(i => i.Subtasks)
                .HasForeignKey(e => e.IssueId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Comment configuration
        modelBuilder.Entity<Comment>(entity =>
        {
            entity.HasKey(e => e.Id);

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
            entity.HasKey(e => e.Id);
            entity.Property(e => e.MentionedText).HasMaxLength(200);

            entity.HasOne(e => e.Comment)
                .WithMany(c => c.Mentions)
                .HasForeignKey(e => e.CommentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Activity configuration
        modelBuilder.Entity<Activity>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Action).HasMaxLength(200).IsRequired();

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
            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Color).HasMaxLength(20);
            entity.Property(e => e.Category).HasMaxLength(20);
        });

        // Notification configuration
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Message).HasMaxLength(1000).IsRequired();
            entity.Property(e => e.Type).HasMaxLength(50);
            entity.Property(e => e.IssueKey).HasMaxLength(20);

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
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Token).IsUnique();
            entity.Property(e => e.Token).HasMaxLength(256).IsRequired();

            entity.HasOne(e => e.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Seed data configuration
        SeedData(modelBuilder);
    }

    private void SeedData(ModelBuilder modelBuilder)
    {
        // Seed users with bcrypt hashed passwords (Password123!)
        var users = new[]
        {
            new User
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                Name = "Sarah Jenkins",
                Email = "sarah.jenkins@vision.dev",
                Avatar = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
                Role = "Staff Product Manager",
                Department = "Platform Systems",
                Status = "online",
                PasswordHash = "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIpWy7p5fq", // Password123!
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new User
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                Name = "Alex Rivera",
                Email = "alex.rivera@vision.dev",
                Avatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
                Role = "Principal Architect & Tech Lead",
                Department = "Platform Engineering",
                Status = "online",
                PasswordHash = "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIpWy7p5fq",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            // Additional users...
        };

        modelBuilder.Entity<User>().HasData(users);

        // Seed projects, sprints, issues, etc.
        // ... (seed data implementation)
    }
}
```

## Repository Pattern Implementation

### Generic Repository Interface

```csharp
public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(Guid id);
    Task<IEnumerable<T>> GetAllAsync();
    Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);
    Task<T> AddAsync(T entity);
    Task<T> UpdateAsync(T entity);
    Task<bool> DeleteAsync(Guid id);
    Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate);
    Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null);
}
```

### Generic Repository Implementation

```csharp
public class Repository<T> : IRepository<T> where T : class
{
    protected readonly VisionDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public Repository(VisionDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public virtual async Task<T?> GetByIdAsync(Guid id)
    {
        return await _dbSet.FindAsync(id);
    }

    public virtual async Task<IEnumerable<T>> GetAllAsync()
    {
        return await _dbSet.ToListAsync();
    }

    public virtual async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
    {
        return await _dbSet.Where(predicate).ToListAsync();
    }

    public virtual async Task<T> AddAsync(T entity)
    {
        await _dbSet.AddAsync(entity);
        await _context.SaveChangesAsync();
        return entity;
    }

    public virtual async Task<T> UpdateAsync(T entity)
    {
        _dbSet.Update(entity);
        await _context.SaveChangesAsync();
        return entity;
    }

    public virtual async Task<bool> DeleteAsync(Guid id)
    {
        var entity = await GetByIdAsync(id);
        if (entity == null) return false;

        _dbSet.Remove(entity);
        await _context.SaveChangesAsync();
        return true;
    }

    public virtual async Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate)
    {
        return await _dbSet.AnyAsync(predicate);
    }

    public virtual async Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null)
    {
        return predicate == null
            ? await _dbSet.CountAsync()
            : await _dbSet.CountAsync(predicate);
    }
}
```

### Specialized Repository Examples

```csharp
public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByEmailAsync(string email);
    Task<bool> EmailExistsAsync(string email);
}

public class UserRepository : Repository<User>, IUserRepository
{
    public UserRepository(VisionDbContext context) : base(context) { }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _dbSet.FirstOrDefaultAsync(u => u.Email == email);
    }

    public async Task<bool> EmailExistsAsync(string email)
    {
        return await _dbSet.AnyAsync(u => u.Email == email);
    }
}

public interface IIssueRepository : IRepository<Issue>
{
    Task<Issue?> GetByKeyAsync(string key);
    Task<IEnumerable<Issue>> GetByProjectIdAsync(Guid projectId, int page = 1, int pageSize = 100);
    Task<IEnumerable<Issue>> GetBySprintIdAsync(Guid sprintId);
    Task<Issue?> GetDetailedByIdAsync(Guid id);
}

public class IssueRepository : Repository<Issue>, IIssueRepository
{
    public IssueRepository(VisionDbContext context) : base(context) { }

    public async Task<Issue?> GetByKeyAsync(string key)
    {
        return await _dbSet
            .Include(i => i.Assignee)
            .Include(i => i.Reporter)
            .Include(i => i.Project)
            .FirstOrDefaultAsync(i => i.Key == key);
    }

    public async Task<IEnumerable<Issue>> GetByProjectIdAsync(Guid projectId, int page = 1, int pageSize = 100)
    {
        return await _dbSet
            .Where(i => i.ProjectId == projectId)
            .Include(i => i.Assignee)
            .Include(i => i.Reporter)
            .OrderByDescending(i => i.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<IEnumerable<Issue>> GetBySprintIdAsync(Guid sprintId)
    {
        return await _dbSet
            .Where(i => i.SprintId == sprintId)
            .Include(i => i.Assignee)
            .Include(i => i.Reporter)
            .ToListAsync();
    }

    public async Task<Issue?> GetDetailedByIdAsync(Guid id)
    {
        return await _dbSet
            .Include(i => i.Assignee)
            .Include(i => i.Reporter)
            .Include(i => i.Project)
            .Include(i => i.Sprint)
            .Include(i => i.Labels)
            .Include(i => i.Subtasks)
            .Include(i => i.Comments)
                .ThenInclude(c => c.Author)
            .Include(i => i.Comments)
                .ThenInclude(c => c.Mentions)
            .Include(i => i.Activities)
                .ThenInclude(a => a.User)
            .FirstOrDefaultAsync(i => i.Id == id);
    }
}
```

## JWT Authentication System

### Authentication Service Interface

```csharp
public interface IAuthService
{
    Task<LoginResponseDto> RegisterAsync(RegisterRequestDto request);
    Task<LoginResponseDto> LoginAsync(LoginRequestDto request);
    Task<LoginResponseDto> RefreshTokenAsync(string refreshToken);
    Task RevokeTokenAsync(string refreshToken);
    Task<UserDto?> GetCurrentUserAsync(Guid userId);
    Task<bool> ValidateTokenAsync(string token);
}
```

### Authentication Service Implementation

```csharp
public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly VisionDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(
        IUserRepository userRepository,
        VisionDbContext context,
        IConfiguration configuration)
    {
        _userRepository = userRepository;
        _context = context;
        _configuration = configuration;
    }

    public async Task<LoginResponseDto> RegisterAsync(RegisterRequestDto request)
    {
        // Validate email uniqueness
        if (await _userRepository.EmailExistsAsync(request.Email))
        {
            throw new ValidationException("Email already exists");
        }

        // Validate password strength (minimum 8 characters)
        if (request.Password.Length < 8)
        {
            throw new ValidationException("Password must be at least 8 characters");
        }

        // Hash password with bcrypt (cost factor 12)
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, 12);

        // Create user
        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Email = request.Email,
            Avatar = request.Avatar ?? "",
            Role = request.Role,
            Department = request.Department,
            Status = "online",
            PasswordHash = passwordHash,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _userRepository.AddAsync(user);

        // Generate tokens
        var accessToken = GenerateAccessToken(user);
        var refreshToken = await GenerateRefreshTokenAsync(user.Id);

        return new LoginResponseDto
        {
            User = MapToUserDto(user),
            Session = new SessionDto
            {
                Token = accessToken,
                ExpiresAt = DateTime.UtcNow.AddMinutes(15)
            },
            RefreshToken = refreshToken
        };
    }

    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto request)
    {
        // Get user by email
        var user = await _userRepository.GetByEmailAsync(request.Email);
        if (user == null)
        {
            throw new ValidationException("Invalid email or password");
        }

        // Verify password
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            throw new ValidationException("Invalid email or password");
        }

        // Update status to online
        user.Status = "online";
        user.UpdatedAt = DateTime.UtcNow;
        await _userRepository.UpdateAsync(user);

        // Generate tokens
        var accessToken = GenerateAccessToken(user);
        var refreshToken = await GenerateRefreshTokenAsync(user.Id);

        return new LoginResponseDto
        {
            User = MapToUserDto(user),
            Session = new SessionDto
            {
                Token = accessToken,
                ExpiresAt = DateTime.UtcNow.AddMinutes(15)
            },
            RefreshToken = refreshToken
        };
    }

    public async Task<LoginResponseDto> RefreshTokenAsync(string refreshToken)
    {
        // Validate refresh token
        var token = await _context.RefreshTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == refreshToken && t.RevokedAt == null);

        if (token == null || token.ExpiresAt < DateTime.UtcNow)
        {
            throw new ValidationException("Invalid or expired refresh token");
        }

        // Generate new access token
        var accessToken = GenerateAccessToken(token.User);

        return new LoginResponseDto
        {
            User = MapToUserDto(token.User),
            Session = new SessionDto
            {
                Token = accessToken,
                ExpiresAt = DateTime.UtcNow.AddMinutes(15)
            },
            RefreshToken = refreshToken
        };
    }

    public async Task RevokeTokenAsync(string refreshToken)
    {
        var token = await _context.RefreshTokens
            .FirstOrDefaultAsync(t => t.Token == refreshToken);

        if (token != null)
        {
            token.RevokedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    private string GenerateAccessToken(User user)
    {
        var jwtSettings = _configuration.GetSection("Jwt");
        var secretKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtSettings["Secret"]!));

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var credentials = new SigningCredentials(secretKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(15),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private async Task<string> GenerateRefreshTokenAsync(Guid userId)
    {
        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)),
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
        };

        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync();

        return refreshToken.Token;
    }

    private UserDto MapToUserDto(User user)
    {
        return new UserDto
        {
            Id = user.Id.ToString(),
            Name = user.Name,
            Email = user.Email,
            Avatar = user.Avatar,
            Role = user.Role,
            Department = user.Department,
            Status = user.Status
        };
    }
}
```

### JWT Configuration in Program.cs

```csharp
// JWT Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = Encoding.UTF8.GetBytes(jwtSettings["Secret"]!);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(secretKey),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();
```

## API Endpoint Design

### Authentication Endpoints

**POST /api/auth/register**

Request:
```json
{
  "name": "John Doe",
  "email": "john.doe@vision.dev",
  "password": "SecurePassword123!",
  "role": "Software Engineer",
  "department": "Engineering",
  "avatar": "https://example.com/avatar.jpg"
}
```

Response (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "guid",
      "name": "John Doe",
      "email": "john.doe@vision.dev",
      "avatar": "https://example.com/avatar.jpg",
      "role": "Software Engineer",
      "department": "Engineering",
      "status": "online"
    },
    "session": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresAt": "2024-01-20T10:30:00Z"
    },
    "refreshToken": "base64-encoded-refresh-token"
  }
}
```

**POST /api/auth/login**

Request:
```json
{
  "email": "john.doe@vision.dev",
  "password": "SecurePassword123!"
}
```

Response (200 OK): Same as register response

**POST /api/auth/refresh**

Request:
```json
{
  "refreshToken": "base64-encoded-refresh-token"
}
```

Response (200 OK): Same as login response

**POST /api/auth/logout**

Request:
```json
{
  "refreshToken": "base64-encoded-refresh-token"
}
```

Response (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

**GET /api/auth/me**

Headers: `Authorization: Bearer <access-token>`

Response (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "guid",
      "name": "John Doe",
      "email": "john.doe@vision.dev",
      "avatar": "https://example.com/avatar.jpg",
      "role": "Software Engineer",
      "department": "Engineering",
      "status": "online"
    },
    "session": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresAt": "2024-01-20T10:30:00Z"
    }
  }
}
```

**GET /api/auth/users**

Headers: `Authorization: Bearer <access-token>`

Response (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "guid",
      "name": "Sarah Jenkins",
      "email": "sarah.jenkins@vision.dev",
      "avatar": "https://...",
      "role": "Staff Product Manager",
      "department": "Platform Systems",
      "status": "online"
    }
  ]
}
```

### Project Endpoints

**GET /api/projects**

Headers: `Authorization: Bearer <access-token>`

Response (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "guid",
      "name": "Platform Engineering & Cloud Infrastructure",
      "key": "OP",
      "description": "Core microservices...",
      "lead": {
        "id": "guid",
        "name": "Alex Rivera",
        "email": "alex.rivera@vision.dev",
        "avatar": "...",
        "role": "Principal Architect & Tech Lead",
        "department": "Platform Engineering",
        "status": "online"
      },
      "template": "Scrum",
      "allowedIssueTypes": ["epic", "story", "task", "bug", "spike"],
      "defaultAssignee": "unassigned",
      "iconGradient": "from-blue-600 via-indigo-600 to-sky-500",
      "createdAt": "2026-09-01T08:00:00Z"
    }
  ]
}
```

**POST /api/projects**

Request:
```json
{
  "name": "New Project",
  "key": "NP",
  "description": "Project description",
  "leadId": "guid",
  "template": "Kanban",
  "allowedIssueTypes": ["task", "bug"],
  "defaultAssignee": "lead",
  "iconGradient": "from-red-600 to-orange-500"
}
```

Response (201 Created): Returns created project object

**GET /api/projects/:id**

Response (200 OK): Returns single project with full details

**PUT /api/projects/:id**

Request: Same structure as POST

Response (200 OK): Returns updated project

**DELETE /api/projects/:id**

Response (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Project deleted successfully"
  }
}
```

### Issue Endpoints

**GET /api/issues**

Query Parameters:
- `projectId` (optional): Filter by project
- `sprintId` (optional): Filter by sprint
- `assigneeId` (optional): Filter by assignee
- `status` (optional): Filter by status
- `type` (optional): Filter by type
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 100, max: 100)

Response (200 OK):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "guid",
        "key": "OP-101",
        "projectId": "guid",
        "title": "Implement API Gateway",
        "description": "...",
        "type": "story",
        "priority": "high",
        "status": "in-progress",
        "assignee": { /* user object */ },
        "reporter": { /* user object */ },
        "sprintId": "guid",
        "storyPoints": 5,
        "labels": ["backend", "api"],
        "epicKey": "OP-100",
        "epicTitle": "Platform Infrastructure",
        "dueDate": "2024-02-01T00:00:00Z",
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-20T14:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 100,
      "totalItems": 150,
      "totalPages": 2
    }
  }
}
```

**POST /api/issues**

Request:
```json
{
  "projectId": "guid",
  "title": "New issue",
  "description": "Issue description",
  "type": "task",
  "priority": "medium",
  "assigneeId": "guid",
  "reporterId": "guid",
  "sprintId": "guid",
  "storyPoints": 3,
  "labels": ["feature"],
  "dueDate": "2024-02-15T00:00:00Z",
  "subtasks": [
    {
      "title": "Subtask 1",
      "completed": false
    }
  ]
}
```

Response (201 Created): Returns created issue

**GET /api/issues/:id**

Response (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "guid",
    "key": "OP-101",
    "projectId": "guid",
    "title": "...",
    "description": "...",
    "type": "story",
    "priority": "high",
    "status": "in-progress",
    "assignee": { /* full user object */ },
    "reporter": { /* full user object */ },
    "sprintId": "guid",
    "storyPoints": 5,
    "labels": ["backend", "api"],
    "subtasks": [
      {
        "id": "guid",
        "title": "Subtask 1",
        "completed": true,
        "createdAt": "...",
        "updatedAt": "..."
      }
    ],
    "comments": [
      {
        "id": "guid",
        "author": { /* full user object */ },
        "content": "Comment text",
        "mentions": ["@user1"],
        "createdAt": "...",
        "updatedAt": "..."
      }
    ],
    "activities": [
      {
        "id": "guid",
        "user": { /* full user object */ },
        "action": "Status changed",
        "details": "from 'To Do' to 'In Progress'",
        "timestamp": "..."
      }
    ],
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**PUT /api/issues/:id**

Request: Same structure as POST

Response (200 OK): Returns updated issue

**DELETE /api/issues/:id**

Response (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Issue deleted successfully"
  }
}
```

### Sprint Endpoints

**GET /api/sprints**

Query Parameters:
- `projectId` (optional): Filter by project

Response (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "guid",
      "projectId": "guid",
      "name": "Sprint 1",
      "goal": "Complete authentication",
      "startDate": "2024-01-15",
      "endDate": "2024-01-29",
      "status": "active",
      "completedAt": null,
      "plannedPoints": 50,
      "completedPoints": 25,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

**POST /api/sprints**

Request:
```json
{
  "projectId": "guid",
  "name": "Sprint 2",
  "goal": "Complete API layer",
  "startDate": "2024-01-29",
  "endDate": "2024-02-12",
  "status": "planned",
  "plannedPoints": 60
}
```

Response (201 Created): Returns created sprint

**PUT /api/sprints/:id**

Request: Same structure as POST

Response (200 OK): Returns updated sprint

### Kanban Column Endpoints

**GET /api/kanban-columns**

Response (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "backlog",
      "name": "Backlog",
      "wipLimit": 0,
      "color": "#64748b",
      "category": "todo",
      "displayOrder": 1
    }
  ]
}
```

**POST /api/kanban-columns**

Request:
```json
{
  "id": "custom-status",
  "name": "Code Review",
  "wipLimit": 5,
  "color": "#3b82f6",
  "category": "in_progress",
  "displayOrder": 4
}
```

Response (201 Created): Returns created column

**PUT /api/kanban-columns/:id**

Request: Same structure as POST

Response (200 OK): Returns updated column

### Notification Endpoints

**GET /api/notifications**

Query Parameters:
- `userId` (required): Filter by user
- `read` (optional): Filter by read status (true/false)

Response (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "guid",
      "title": "New assignment",
      "message": "You were assigned to OP-101",
      "timestamp": "2024-01-20T10:00:00Z",
      "read": false,
      "type": "assignment",
      "issueKey": "OP-101",
      "author": { /* user object */ }
    }
  ]
}
```

**PUT /api/notifications/:id/read**

Response (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Notification marked as read"
  }
}
```

### Error Response Format

All error responses follow this structure:

```json
{
  "success": false,
  "error": "Error message describing what went wrong",
  "statusCode": 400,
  "timestamp": "2024-01-20T10:00:00Z"
}
```

Status codes:
- 400: Bad Request (validation errors)
- 401: Unauthorized (missing or invalid token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 409: Conflict (unique constraint violation)
- 500: Internal Server Error

## Frontend Integration Strategy

### Authentication Context

Create a custom authentication context to replace Clerk:

```typescript
// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  department: string;
  status: string;
}

interface Session {
  token: string;
  expiresAt: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load session from localStorage on mount
    const storedSession = localStorage.getItem('session');
    const storedUser = localStorage.getItem('user');
    
    if (storedSession && storedUser) {
      const parsedSession = JSON.parse(storedSession);
      const parsedUser = JSON.parse(storedUser);
      
      // Check if token is expired
      if (new Date(parsedSession.expiresAt) > new Date()) {
        setSession(parsedSession);
        setUser(parsedUser);
        setupAxiosInterceptors(parsedSession.token);
      } else {
        // Try to refresh token
        refreshToken();
      }
    }
    
    setIsLoading(false);
  }, []);

  const setupAxiosInterceptors = (token: string) => {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const login = async (email: string, password: string) => {
    const response = await axios.post('/api/auth/login', { email, password });
    const { user, session, refreshToken } = response.data.data;
    
    setUser(user);
    setSession(session);
    
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('session', JSON.stringify(session));
    localStorage.setItem('refreshToken', refreshToken);
    
    setupAxiosInterceptors(session.token);
  };

  const register = async (data: RegisterData) => {
    const response = await axios.post('/api/auth/register', data);
    const { user, session, refreshToken } = response.data.data;
    
    setUser(user);
    setSession(session);
    
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('session', JSON.stringify(session));
    localStorage.setItem('refreshToken', refreshToken);
    
    setupAxiosInterceptors(session.token);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (refreshToken) {
      await axios.post('/api/auth/logout', { refreshToken });
    }
    
    setUser(null);
    setSession(null);
    
    localStorage.removeItem('user');
    localStorage.removeItem('session');
    localStorage.removeItem('refreshToken');
    
    delete axios.defaults.headers.common['Authorization'];
  };

  const refreshToken = async () => {
    const storedRefreshToken = localStorage.getItem('refreshToken');
    
    if (!storedRefreshToken) return;
    
    try {
      const response = await axios.post('/api/auth/refresh', {
        refreshToken: storedRefreshToken
      });
      
      const { user, session } = response.data.data;
      
      setUser(user);
      setSession(session);
      
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('session', JSON.stringify(session));
      
      setupAxiosInterceptors(session.token);
    } catch (error) {
      // Refresh failed, logout
      await logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### Axios Configuration

```typescript
// src/lib/axios.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000'
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const session = localStorage.getItem('session');
    if (session) {
      const { token } = JSON.parse(session);
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        try {
          const response = await axios.post('/api/auth/refresh', {
            refreshToken
          });
          
          const { session } = response.data.data;
          
          localStorage.setItem('session', JSON.stringify(session));
          
          originalRequest.headers.Authorization = `Bearer ${session.token}`;
          
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

### Environment Configuration

Create `.env` file:

```env
VITE_API_URL=http://localhost:5000
```

### Update Type Definitions

Remove `ClerkSession` type and update imports:

```typescript
// Remove from src/types/index.ts
// export interface ClerkSession { ... }

// Update to use custom session type
export interface Session {
  token: string;
  expiresAt: string;
}
```

## Configuration Management

### appsettings.json

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Information"
    }
  },
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=VisionDb;Trusted_Connection=true;MultipleActiveResultSets=true"
  },
  "Jwt": {
    "Secret": "your-256-bit-secret-key-here-minimum-32-characters",
    "Issuer": "https://localhost:5001",
    "Audience": "http://localhost:5173",
    "AccessTokenExpirationMinutes": 15,
    "RefreshTokenExpirationDays": 7
  },
  "Cors": {
    "AllowedOrigins": ["http://localhost:5173"]
  }
}
```

### appsettings.Development.json

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "Microsoft.AspNetCore": "Information",
      "Microsoft.EntityFrameworkCore": "Information"
    }
  },
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=VisionDb_Dev;Trusted_Connection=true;MultipleActiveResultSets=true"
  }
}
```

### appsettings.Production.json

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Warning",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Warning"
    }
  }
}
```

### User Secrets Configuration

For development, store sensitive configuration in user secrets:

```bash
dotnet user-secrets init --project Vision.API
dotnet user-secrets set "Jwt:Secret" "your-secure-secret-key-with-minimum-32-characters" --project Vision.API
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=localhost;Database=VisionDb;User Id=sa;Password=YourPassword;" --project Vision.API
```

## Deployment Strategy

### Database Migration Steps

1. **Install EF Core Tools:**
   ```bash
   dotnet tool install --global dotnet-ef
   ```

2. **Create Initial Migration:**
   ```bash
   cd Vision.Data
   dotnet ef migrations add InitialCreate --startup-project ../Vision.API
   ```

3. **Apply Migration:**
   ```bash
   dotnet ef database update --startup-project ../Vision.API
   ```

4. **Generate SQL Script (for production):**
   ```bash
   dotnet ef migrations script --startup-project ../Vision.API --output migration.sql
   ```

### Build and Run

**Development:**
```bash
# Backend
cd Vision.API
dotnet run

# Frontend
cd ../../
npm run dev
```

**Production:**
```bash
# Backend
cd Vision.API
dotnet publish -c Release -o ./publish

# Frontend
npm run build
```

### Docker Deployment (Optional)

```dockerfile
# Vision.API/Dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["Vision.API/Vision.API.csproj", "Vision.API/"]
COPY ["Vision.Business/Vision.Business.csproj", "Vision.Business/"]
COPY ["Vision.Data/Vision.Data.csproj", "Vision.Data/"]
RUN dotnet restore "Vision.API/Vision.API.csproj"
COPY . .
WORKDIR "/src/Vision.API"
RUN dotnet build "Vision.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Vision.API.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Vision.API.dll"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  sqlserver:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      ACCEPT_EULA: "Y"
      SA_PASSWORD: "YourStrong!Passw0rd"
    ports:
      - "1433:1433"
    volumes:
      - sqlserver-data:/var/opt/mssql

  api:
    build:
      context: .
      dockerfile: Vision.API/Dockerfile
    ports:
      - "5000:80"
    environment:
      ConnectionStrings__DefaultConnection: "Server=sqlserver;Database=VisionDb;User Id=sa;Password=YourStrong!Passw0rd;TrustServerCertificate=true"
      Jwt__Secret: "your-256-bit-secret-key-here"
    depends_on:
      - sqlserver

volumes:
  sqlserver-data:
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Password Hashing Strength

*For any* user registration with a valid password, the system SHALL hash the password using bcrypt algorithm with a cost factor of at least 12, and the resulting hash SHALL successfully verify against the original password.

**Validates: Requirements 5.10, 9.10**

### Property 2: JWT Token Expiration Consistency

*For any* successful user login, the system SHALL generate a JWT access token that expires exactly 15 minutes from the time of generation, as indicated by both the token's exp claim and the session's expiresAt field.

**Validates: Requirements 5.11**

### Property 3: Refresh Token Expiration Consistency

*For any* successful user login, the system SHALL generate a refresh token that expires exactly 7 days from the time of generation and remains valid until either expiration or explicit revocation.

**Validates: Requirements 5.12**

### Property 4: Token Refresh Round Trip

*For any* user with a valid refresh token and an expired access token, requesting a token refresh SHALL produce a new valid access token with the same user claims and a 15-minute expiration, while the refresh token remains unchanged and valid.

**Validates: Requirements 5.15**

### Property 5: Email Uniqueness Validation

*For any* registration attempt, if the provided email already exists in the system, the registration SHALL fail with a validation error, and no new user record SHALL be created.

**Validates: Requirements 5.9**

### Property 6: Password Strength Validation

*For any* registration attempt with a password containing fewer than 8 characters, the registration SHALL fail with a validation error indicating insufficient password strength.

**Validates: Requirements 5.9**

### Property 7: API Response Consistency

*For any* API endpoint that returns an error condition, the response SHALL contain a JSON object with properties `success` (boolean, false), `error` (string message), `statusCode` (integer), and `timestamp` (ISO 8601 datetime).

**Validates: Requirements 6.25, 11.2**

### Property 8: Authentication Protection

*For any* API endpoint except authentication endpoints (/api/auth/*), requests without a valid JWT token in the Authorization header SHALL receive a 401 Unauthorized response.

**Validates: Requirements 5.18**

### Property 9: Pagination Limit Enforcement

*For any* list endpoint query requesting more than 100 items per page, the system SHALL return at most 100 items regardless of the requested page size.

**Validates: Requirements 15.5**

### Property 10: DateTime ISO 8601 Format

*For any* API response containing datetime values, all datetime fields SHALL be serialized in ISO 8601 format with UTC timezone (e.g., "2024-01-20T10:30:00Z").

**Validates: Requirements 6.24**

### Property 11: Rate Limiting Enforcement

*For any* IP address, when more than 5 authentication requests are made to any /api/auth endpoint within a 60-second window, the 6th and subsequent requests within that window SHALL receive a 429 Too Many Requests response.

**Validates: Requirements 9.5**

### Property 12: Eager Loading Prevention of N+1

*For any* issue detail query (GET /api/issues/:id), the system SHALL load the issue with all related entities (assignee, reporter, subtasks, comments with authors, activities with users) using a single database query with explicit Include statements, avoiding N+1 query problems.

**Validates: Requirements 15.3**

### Property 13: Foreign Key Cascade Behavior

*For any* project deletion, all related records (sprints, issues, and their nested entities) SHALL be automatically deleted through cascade delete constraints, and the deletion SHALL complete successfully without orphaned records.

**Validates: Requirements 3.16**

### Property 14: Unique Constraint Enforcement

*For any* attempt to create a user with an email that already exists, or a project with a key that already exists, or an issue with a key that already exists, the operation SHALL fail with a 409 Conflict response.

**Validates: Requirements 3.1, 3.2, 3.5**

### Property 15: Token Revocation Finality

*For any* refresh token, once revoked (RevokedAt timestamp set), any subsequent attempt to use that token for refreshing an access token SHALL fail with a validation error, even if the token has not yet expired.

**Validates: Requirements 5.16**

## Error Handling Strategy

### Global Exception Middleware

```csharp
public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        _logger.LogError(exception, "An unhandled exception occurred");

        var statusCode = exception switch
        {
            ValidationException => StatusCodes.Status400BadRequest,
            NotFoundException => StatusCodes.Status404NotFound,
            UnauthorizedException => StatusCodes.Status401Unauthorized,
            _ => StatusCodes.Status500InternalServerError
        };

        var response = new
        {
            success = false,
            error = exception.Message,
            statusCode,
            timestamp = DateTime.UtcNow
        };

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = statusCode;

        await context.Response.WriteAsJsonAsync(response);
    }
}
```

### Custom Business Exceptions

```csharp
public class BusinessException : Exception
{
    public BusinessException(string message) : base(message) { }
}

public class ValidationException : BusinessException
{
    public ValidationException(string message) : base(message) { }
}

public class NotFoundException : BusinessException
{
    public NotFoundException(string message) : base(message) { }
}

public class UnauthorizedException : BusinessException
{
    public UnauthorizedException(string message) : base(message) { }
}
```

## Testing Strategy

### Unit Tests

**AuthService Tests:**
- Password hashing with bcrypt cost factor 12
- Email uniqueness validation
- Password strength validation (minimum 8 characters)
- JWT token generation with correct claims and expiration
- Refresh token generation with 7-day expiration
- Token refresh logic

**Repository Tests:**
- CRUD operations using in-memory database
- Query filtering and pagination
- Eager loading with Include
- Unique constraint violations

### Integration Tests

**Authentication Endpoint Tests:**
- POST /api/auth/register success and validation failures
- POST /api/auth/login with valid and invalid credentials
- POST /api/auth/refresh with valid and expired tokens
- POST /api/auth/logout token revocation
- GET /api/auth/me with and without authentication

**Project/Issue Endpoint Tests:**
- CRUD operations with authentication
- Query filtering and pagination
- Foreign key constraints and cascade deletes
- 401 responses for unauthenticated requests

### Test Data Builders

```csharp
public class UserBuilder
{
    private readonly User _user = new()
    {
        Id = Guid.NewGuid(),
        Name = "Test User",
        Email = "test@vision.dev",
        Role = "Developer",
        Department = "Engineering",
        Status = "online",
        PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!", 12),
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    public UserBuilder WithEmail(string email)
    {
        _user.Email = email;
        return this;
    }

    public UserBuilder WithRole(string role)
    {
        _user.Role = role;
        return this;
    }

    public User Build() => _user;
}
```

## Performance Considerations

### Database Indexing

Create indexes on frequently queried columns:
- Users.Email (unique index)
- Projects.Key (unique index)
- Issues.Key (unique index)
- Issues.ProjectId (foreign key index)
- Issues.SprintId (foreign key index)
- Issues.AssigneeId (foreign key index)
- RefreshTokens.Token (unique index)

### Query Optimization

- Use `AsNoTracking()` for read-only queries
- Implement projection queries selecting only required columns
- Use pagination for all list endpoints
- Eager load related entities with `Include()` to prevent N+1 queries
- Implement response caching for frequently accessed data

### Connection Pooling

Configure connection pooling in connection string:
```
Server=localhost;Database=VisionDb;User Id=sa;Password=pass;Min Pool Size=5;Max Pool Size=100;
```

## Security Checklist

- ✅ All passwords hashed with bcrypt (cost factor 12)
- ✅ JWT tokens signed with 256-bit secret key
- ✅ HTTPS enabled in production
- ✅ CORS configured for specific origins only
- ✅ Input validation on all endpoints
- ✅ SQL injection prevention through parameterized queries (EF Core)
- ✅ Rate limiting on authentication endpoints
- ✅ Sensitive configuration in user secrets/environment variables
- ✅ Authorization required on all non-auth endpoints
- ✅ Token refresh mechanism for session management
- ✅ Refresh token revocation on logout

## Migration Checklist

### Backend Setup
- [ ] Create .NET solution and projects (API, Business, Data)
- [ ] Configure project references
- [ ] Install required NuGet packages
- [ ] Create entity models
- [ ] Configure DbContext with relationships
- [ ] Create initial EF Core migration
- [ ] Implement repository pattern
- [ ] Implement authentication service with JWT
- [ ] Create API controllers
- [ ] Configure middleware (CORS, authentication, error handling)
- [ ] Add seed data
- [ ] Configure appsettings.json
- [ ] Set up user secrets for development

### Frontend Updates
- [ ] Remove Clerk dependencies from package.json
- [ ] Delete ClerkAuthModal.tsx and AuthWrapper.tsx
- [ ] Create custom AuthContext
- [ ] Implement useAuth hook
- [ ] Configure axios with interceptors
- [ ] Update type definitions (remove ClerkSession)
- [ ] Create login/register components
- [ ] Update Navbar to use custom auth
- [ ] Update API base URL in .env

### Testing
- [ ] Create unit tests for AuthService
- [ ] Create unit tests for repositories
- [ ] Create integration tests for controllers
- [ ] Test authentication flow end-to-end
- [ ] Test CRUD operations for all entities
- [ ] Test error handling and validation
- [ ] Test rate limiting

### Deployment
- [ ] Create production appsettings
- [ ] Generate migration SQL scripts
- [ ] Set up production database
- [ ] Configure production secrets
- [ ] Build and publish API
- [ ] Build frontend
- [ ] Deploy and verify

## Conclusion

This design document provides a comprehensive blueprint for migrating the Vision application from Node.js/Express to .NET Core. The three-tier architecture ensures separation of concerns, maintainability, and scalability. The custom JWT authentication system replaces Clerk while maintaining security best practices. The Entity Framework Core data layer with repository pattern provides a clean abstraction over database operations. The API contract preservation ensures minimal changes to the React frontend, making the migration incremental and low-risk.
