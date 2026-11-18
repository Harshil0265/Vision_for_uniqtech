using Microsoft.EntityFrameworkCore;
using Vision.API.Models;

namespace Vision.API
{
    public class VisionDbContext : DbContext
    {
        public VisionDbContext(DbContextOptions<VisionDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Project> Projects { get; set; }
        public DbSet<ProjectMember> ProjectMembers { get; set; }
        public DbSet<ProjectWorkItemType> ProjectWorkItemTypes { get; set; }
        public DbSet<WorkItemTypeEntity> WorkItemTypes { get; set; }
        public DbSet<WorkItemPriority> WorkItemPriorities { get; set; }
        public DbSet<WorkItemStatus> WorkItemStatuses { get; set; }
        public DbSet<WorkItemStoryPoint> WorkItemStoryPoints { get; set; }
        public DbSet<Sprint> Sprints { get; set; }
        public DbSet<WorkItem> WorkItems { get; set; }
        public DbSet<WorkItemLabel> WorkItemLabels { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<ProjectMember>()
                .HasKey(pm => new { pm.ProjectId, pm.UserId });

            modelBuilder.Entity<ProjectWorkItemType>()
                .HasKey(pwt => new { pwt.ProjectId, pwt.WorkItemTypeId });
        }
    }
}
