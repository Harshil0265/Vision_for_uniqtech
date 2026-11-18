using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Vision.API.Models;

namespace Vision.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ProjectController : ControllerBase
    {
        private static readonly Regex KeyRegex = new(@"^[A-Z][A-Z0-9]{1,5}$", RegexOptions.Compiled);

        private readonly VisionDbContext _context;

        public ProjectController(VisionDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Route("GetUsers")]
        public async Task<IActionResult> GetUsers()
        {
            try
            {
                var users = await _context.Users
                    .Where(u => u.IsActive)
                    .OrderBy(u => u.FullName)
                    .ToListAsync();

                return Ok(new { success = true, status = true, users = users.Select(MapUserDto) });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, status = false, error = "Failed to load users.", message = ex.Message });
            }
        }

        [HttpGet]
        [Route("GetProjectList")]
        public async Task<IActionResult> GetProjectList()
        {
            try
            {
                var projects = await _context.Projects
                    .Where(p => !p.IsArchived)
                    .OrderByDescending(p => p.CreatedAt)
                    .ThenByDescending(p => p.Id)
                    .ToListAsync();

                var usersById = await _context.Users.ToDictionaryAsync(u => u.Id);
                var typesById = await _context.WorkItemTypes.ToDictionaryAsync(t => t.Id, t => t.TypeKey);
                var membersByProject = (await _context.ProjectMembers.ToListAsync())
                    .GroupBy(m => m.ProjectId)
                    .ToDictionary(g => g.Key, g => g.ToList());
                var typesByProject = (await _context.ProjectWorkItemTypes.ToListAsync())
                    .GroupBy(t => t.ProjectId)
                    .ToDictionary(g => g.Key, g => g.Select(x => x.WorkItemTypeId).ToList());

                var result = projects.Select(p => MapProjectDto(
                    p,
                    usersById,
                    membersByProject.GetValueOrDefault(p.Id) ?? new List<ProjectMember>(),
                    typesByProject.GetValueOrDefault(p.Id) ?? new List<int>(),
                    typesById));

                return Ok(new { success = true, status = true, projects = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, status = false, error = "Failed to load projects.", message = ex.Message });
            }
        }

        [HttpGet]
        [Route("GetProjectById/{id}")]
        public async Task<IActionResult> GetProjectById(int id)
        {
            try
            {
                var project = await _context.Projects.FindAsync(id);
                if (project == null)
                    return NotFound(new { success = false, status = false, error = "Project not found.", message = "Project not found." });

                var usersById = await _context.Users.ToDictionaryAsync(u => u.Id);
                var typesById = await _context.WorkItemTypes.ToDictionaryAsync(t => t.Id, t => t.TypeKey);
                var members = await _context.ProjectMembers.Where(m => m.ProjectId == id).ToListAsync();
                var typeIds = await _context.ProjectWorkItemTypes.Where(t => t.ProjectId == id).Select(t => t.WorkItemTypeId).ToListAsync();

                return Ok(new
                {
                    success = true,
                    status = true,
                    project = MapProjectDto(project, usersById, members, typeIds, typesById)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, status = false, error = "Failed to load project.", message = ex.Message });
            }
        }

        [HttpPost]
        [Route("SaveProject")]
        public async Task<IActionResult> SaveProject([FromBody] ProjectRequest request)
        {
            try
            {
                if (request == null)
                    return BadRequest(new { success = false, status = false, error = "Invalid request.", message = "Invalid request." });

                var name = (request.Name ?? string.Empty).Trim();
                var key = (request.Key ?? string.Empty).Trim().ToUpperInvariant();
                var description = (request.Description ?? string.Empty).Trim();

                if (name.Length < 3 || name.Length > 80)
                    return BadRequest(new { success = false, status = false, error = "Project name must be 3 to 80 characters.", message = "Project name must be 3 to 80 characters." });

                if (!KeyRegex.IsMatch(key))
                    return BadRequest(new { success = false, status = false, error = "Project key must be 2–6 characters starting with a letter.", message = "Project key must be 2–6 characters starting with a letter." });

                if (description.Length > 500)
                    return BadRequest(new { success = false, status = false, error = "Description must be 500 characters or fewer.", message = "Description must be 500 characters or fewer." });

                var requestedKeys = (request.AllowedIssueTypes ?? new List<string>())
                    .Select(t => (t ?? string.Empty).Trim().ToLowerInvariant())
                    .Distinct()
                    .ToList();

                var allTypes = await _context.WorkItemTypes.Where(t => t.IsActive).ToListAsync();
                var matchedTypes = allTypes.Where(t => requestedKeys.Contains(t.TypeKey.ToLowerInvariant())).ToList();
                if (matchedTypes.Count == 0)
                    return BadRequest(new { success = false, status = false, error = "Enable at least one work item type.", message = "Enable at least one work item type." });

                if (await _context.Projects.AnyAsync(p => p.ProjectKey.ToUpper() == key))
                    return Conflict(new { success = false, status = false, error = $"The key {key} is already used by another project.", message = $"The key {key} is already used by another project." });

                var currentUserId = GetCurrentUserId();
                var leadId = request.LeadId > 0 ? request.LeadId : currentUserId;
                if (!await _context.Users.AnyAsync(u => u.Id == leadId && u.IsActive))
                    return BadRequest(new { success = false, status = false, error = "Selected project lead does not exist.", message = "Selected project lead does not exist." });

                var now = DateTime.UtcNow;
                var isLeadAssignee = string.Equals(request.DefaultAssignee, "lead", StringComparison.OrdinalIgnoreCase);

                var project = new Project
                {
                    ProjectName = name,
                    ProjectKey = key,
                    Description = description,
                    ProjectLeadId = leadId,
                    Template = "Scrum",
                    DefaultAssigneeMode = isLeadAssignee ? "lead" : "unassigned",
                    DefaultAssigneeId = isLeadAssignee ? leadId : null,
                    IconGradient = "from-blue-600 via-indigo-600 to-sky-500",
                    IssueSequence = 100,
                    IsArchived = false,
                    CreatedAt = now,
                    UpdatedAt = now
                };

                using var transaction = await _context.Database.BeginTransactionAsync();

                _context.Projects.Add(project);
                await _context.SaveChangesAsync();

                foreach (var wt in matchedTypes)
                {
                    _context.ProjectWorkItemTypes.Add(new ProjectWorkItemType
                    {
                        ProjectId = project.Id,
                        WorkItemTypeId = wt.Id
                    });
                }

                var memberRoles = new Dictionary<int, string> { [leadId] = "owner" };
                if (currentUserId > 0 && !memberRoles.ContainsKey(currentUserId))
                    memberRoles[currentUserId] = "admin";
                if (request.MemberIds != null)
                {
                    foreach (var mid in request.MemberIds.Where(m => m > 0))
                    {
                        if (!memberRoles.ContainsKey(mid))
                            memberRoles[mid] = "member";
                    }
                }

                var validUserIds = await _context.Users
                    .Where(u => memberRoles.Keys.Contains(u.Id) && u.IsActive)
                    .Select(u => u.Id)
                    .ToListAsync();

                var savedMembers = new List<ProjectMember>();
                foreach (var uid in validUserIds)
                {
                    var pm = new ProjectMember
                    {
                        ProjectId = project.Id,
                        UserId = uid,
                        ProjectRole = memberRoles[uid],
                        AddedAt = now,
                        AddedByUserId = currentUserId > 0 ? currentUserId : null
                    };
                    _context.ProjectMembers.Add(pm);
                    savedMembers.Add(pm);
                }

                var firstWord = name.Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault() ?? key;
                _context.Sprints.Add(new Sprint
                {
                    ProjectId = project.Id,
                    SprintName = $"{firstWord} Sprint 1",
                    Goal = "Initial sprint delivery.",
                    StartDate = now.Date,
                    EndDate = now.Date.AddDays(14),
                    Status = "active",
                    PlannedPoints = 0,
                    CompletedPoints = 0,
                    CreatedAt = now,
                    UpdatedAt = now
                });

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                var usersById = await _context.Users.ToDictionaryAsync(u => u.Id);
                var typesById = allTypes.ToDictionary(t => t.Id, t => t.TypeKey);

                return StatusCode(StatusCodes.Status201Created, new
                {
                    success = true,
                    status = true,
                    message = "Project created successfully!",
                    project = MapProjectDto(project, usersById, savedMembers, matchedTypes.Select(t => t.Id).ToList(), typesById)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, status = false, error = "An error occurred while creating the project.", message = ex.Message });
            }
        }

        [HttpPut]
        [Route("UpdateProject/{id}")]
        public async Task<IActionResult> UpdateProject(int id, [FromBody] ProjectRequest request)
        {
            try
            {
                var project = await _context.Projects.FindAsync(id);
                if (project == null)
                    return NotFound(new { success = false, status = false, error = "Project not found.", message = "Project not found." });

                var name = (request.Name ?? string.Empty).Trim();
                var description = (request.Description ?? string.Empty).Trim();

                if (name.Length < 3 || name.Length > 80)
                    return BadRequest(new { success = false, status = false, error = "Project name must be 3 to 80 characters.", message = "Project name must be 3 to 80 characters." });

                if (description.Length > 500)
                    return BadRequest(new { success = false, status = false, error = "Description must be 500 characters or fewer.", message = "Description must be 500 characters or fewer." });

                var requestedKeys = (request.AllowedIssueTypes ?? new List<string>())
                    .Select(t => (t ?? string.Empty).Trim().ToLowerInvariant())
                    .Distinct()
                    .ToList();

                var allTypes = await _context.WorkItemTypes.Where(t => t.IsActive).ToListAsync();
                var matchedTypes = allTypes.Where(t => requestedKeys.Contains(t.TypeKey.ToLowerInvariant())).ToList();
                if (matchedTypes.Count == 0)
                    return BadRequest(new { success = false, status = false, error = "Enable at least one work item type.", message = "Enable at least one work item type." });

                var leadId = request.LeadId > 0 ? request.LeadId : project.ProjectLeadId;
                if (!await _context.Users.AnyAsync(u => u.Id == leadId && u.IsActive))
                    return BadRequest(new { success = false, status = false, error = "Selected project lead does not exist.", message = "Selected project lead does not exist." });

                var now = DateTime.UtcNow;
                var isLeadAssignee = string.Equals(request.DefaultAssignee, "lead", StringComparison.OrdinalIgnoreCase);

                project.ProjectName = name;
                project.Description = description;
                project.ProjectLeadId = leadId;
                project.DefaultAssigneeMode = isLeadAssignee ? "lead" : "unassigned";
                project.DefaultAssigneeId = isLeadAssignee ? leadId : null;
                project.UpdatedAt = now;

                var existingTypes = await _context.ProjectWorkItemTypes.Where(t => t.ProjectId == id).ToListAsync();
                _context.ProjectWorkItemTypes.RemoveRange(existingTypes);
                foreach (var wt in matchedTypes)
                {
                    _context.ProjectWorkItemTypes.Add(new ProjectWorkItemType { ProjectId = id, WorkItemTypeId = wt.Id });
                }

                var leadMember = await _context.ProjectMembers.FirstOrDefaultAsync(m => m.ProjectId == id && m.UserId == leadId);
                if (leadMember == null)
                {
                    _context.ProjectMembers.Add(new ProjectMember
                    {
                        ProjectId = id,
                        UserId = leadId,
                        ProjectRole = "owner",
                        AddedAt = now
                    });
                }

                await _context.SaveChangesAsync();

                var usersById = await _context.Users.ToDictionaryAsync(u => u.Id);
                var typesById = allTypes.ToDictionary(t => t.Id, t => t.TypeKey);
                var members = await _context.ProjectMembers.Where(m => m.ProjectId == id).ToListAsync();

                return Ok(new
                {
                    success = true,
                    status = true,
                    message = "Project updated successfully!",
                    project = MapProjectDto(project, usersById, members, matchedTypes.Select(t => t.Id).ToList(), typesById)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, status = false, error = "An error occurred while updating the project.", message = ex.Message });
            }
        }

        [HttpDelete]
        [Route("DeleteProject/{id}")]
        public async Task<IActionResult> DeleteProject(int id)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var project = await _context.Projects.FindAsync(id);
                if (project == null)
                    return NotFound(new { success = false, status = false, error = "Project not found.", message = "Project not found." });

                var workItems = await _context.WorkItems.Where(w => w.ProjectId == id).ToListAsync();
                foreach (var wi in workItems)
                {
                    wi.ParentEpicId = null;
                    wi.SprintId = null;
                }
                await _context.SaveChangesAsync();

                _context.Projects.Remove(project);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { success = true, status = true, message = "Project deleted successfully!" });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { success = false, status = false, error = "An error occurred while deleting the project.", message = ex.Message });
            }
        }

        private int GetCurrentUserId()
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier)
                        ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            return int.TryParse(claim, out var id) ? id : 0;
        }

        private static object MapUserDto(User user)
        {
            return new
            {
                id = user.Id.ToString(),
                name = user.FullName,
                email = user.Email,
                avatar = user.AvatarUrl,
                role = user.JobTitle,
                department = user.Department,
                status = user.Status
            };
        }

        private static object MapProjectDto(
            Project project,
            Dictionary<int, User> usersById,
            List<ProjectMember> members,
            List<int> typeIds,
            Dictionary<int, string> typesById)
        {
            var lead = usersById.TryGetValue(project.ProjectLeadId, out var leadUser)
                ? MapUserDto(leadUser)
                : new { id = project.ProjectLeadId.ToString(), name = "Unknown", email = string.Empty, avatar = string.Empty, role = string.Empty, department = string.Empty, status = "offline" };

            var allowedTypes = typeIds
                .Where(typesById.ContainsKey)
                .Select(id => typesById[id])
                .ToList();

            var memberDtos = members.Select(m => new
            {
                userId = m.UserId.ToString(),
                role = m.ProjectRole,
                addedAt = m.AddedAt.ToString("o")
            }).ToList();

            return new
            {
                id = project.Id.ToString(),
                name = project.ProjectName,
                key = project.ProjectKey,
                description = project.Description,
                lead,
                template = project.Template,
                allowedIssueTypes = allowedTypes,
                defaultAssignee = project.DefaultAssigneeMode,
                iconGradient = project.IconGradient,
                createdAt = project.CreatedAt.ToString("o"),
                members = memberDtos
            };
        }
    }
}
