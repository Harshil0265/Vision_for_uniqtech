using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Vision.API.Models;

namespace Vision.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class WorkItemController : ControllerBase
    {
        private static readonly HashSet<int> ValidPoints = new() { 0, 1, 2, 3, 5, 8, 13, 21 };

        private readonly VisionDbContext _context;

        public WorkItemController(VisionDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Route("GetLookups")]
        public async Task<IActionResult> GetLookups()
        {
            try
            {
                var statuses = await _context.WorkItemStatuses
                    .Where(s => s.IsActive)
                    .OrderBy(s => s.DisplayOrder)
                    .Select(s => new
                    {
                        id = s.StatusKey,
                        name = s.StatusName,
                        wipLimit = s.WipLimit,
                        color = s.ColorHex,
                        category = s.Category
                    })
                    .ToListAsync();

                var priorities = await _context.WorkItemPriorities
                    .Where(p => p.IsActive)
                    .OrderBy(p => p.DisplayOrder)
                    .Select(p => new
                    {
                        id = p.PriorityKey,
                        name = p.PriorityName,
                        color = p.ColorHex
                    })
                    .ToListAsync();

                var types = await _context.WorkItemTypes
                    .Where(t => t.IsActive)
                    .OrderBy(t => t.DisplayOrder)
                    .Select(t => new
                    {
                        id = t.TypeKey,
                        name = t.TypeName,
                        description = t.Description ?? string.Empty
                    })
                    .ToListAsync();

                var storyPoints = await _context.WorkItemStoryPoints
                    .OrderBy(sp => sp.DisplayOrder)
                    .Select(sp => new
                    {
                        id = sp.Id,
                        label = sp.PointLabel,
                        value = sp.NumericValue
                    })
                    .ToListAsync();

                var sprints = await _context.Sprints
                    .OrderByDescending(s => s.StartDate)
                    .Select(s => new
                    {
                        id = s.Id.ToString(),
                        projectId = s.ProjectId.ToString(),
                        name = s.SprintName,
                        goal = s.Goal,
                        startDate = s.StartDate.ToString("yyyy-MM-dd"),
                        endDate = s.EndDate.ToString("yyyy-MM-dd"),
                        status = s.Status,
                        completedAt = s.CompletedAt.HasValue ? s.CompletedAt.Value.ToString("o") : null,
                        plannedPoints = s.PlannedPoints,
                        completedPoints = s.CompletedPoints
                    })
                    .ToListAsync();

                return Ok(new
                {
                    success = true,
                    status = true,
                    columns = statuses,
                    priorities,
                    types,
                    storyPoints,
                    sprints
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, status = false, error = "Failed to load work item lookups.", message = ex.Message });
            }
        }

        [HttpGet]
        [Route("GetWorkItemList")]
        public async Task<IActionResult> GetWorkItemList([FromQuery] int? projectId = null)
        {
            try
            {
                var query = _context.WorkItems.AsQueryable();
                if (projectId.HasValue && projectId.Value > 0)
                    query = query.Where(w => w.ProjectId == projectId.Value);

                var items = await query.OrderByDescending(w => w.CreatedAt).ToListAsync();
                var result = await MapWorkItemsAsync(items);

                return Ok(new { success = true, status = true, workItems = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, status = false, error = "Failed to load work items.", message = ex.Message });
            }
        }

        [HttpGet]
        [Route("GetWorkItemById/{id}")]
        public async Task<IActionResult> GetWorkItemById(int id)
        {
            try
            {
                var item = await _context.WorkItems.FindAsync(id);
                if (item == null)
                    return NotFound(new { success = false, status = false, error = "Work item not found.", message = "Work item not found." });

                var mapped = await MapWorkItemsAsync(new List<WorkItem> { item });
                return Ok(new { success = true, status = true, workItem = mapped.First() });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, status = false, error = "Failed to load work item.", message = ex.Message });
            }
        }

        [HttpPost]
        [Route("SaveWorkItem")]
        public async Task<IActionResult> SaveWorkItem([FromBody] WorkItemRequest request)
        {
            try
            {
                if (request == null)
                    return BadRequest(new { success = false, status = false, error = "Invalid request.", message = "Invalid request." });

                var title = (request.Title ?? string.Empty).Trim();
                var description = (request.Description ?? string.Empty).Trim();

                if (request.ProjectId <= 0)
                    return BadRequest(new { success = false, status = false, error = "Project is required.", message = "Project is required." });

                if (string.IsNullOrWhiteSpace(title) || title.Length > 200)
                    return BadRequest(new { success = false, status = false, error = "Summary must be 1 to 200 characters.", message = "Summary must be 1 to 200 characters." });

                if (description.Length > 5000)
                    return BadRequest(new { success = false, status = false, error = "Description must be 5000 characters or fewer.", message = "Description must be 5000 characters or fewer." });

                if (!ValidPoints.Contains(request.StoryPoints))
                    return BadRequest(new { success = false, status = false, error = "Invalid story points value.", message = "Invalid story points value." });

                var project = await _context.Projects.FindAsync(request.ProjectId);
                if (project == null)
                    return NotFound(new { success = false, status = false, error = "Project not found.", message = "Project not found." });

                var typeKey = (request.Type ?? "task").Trim().ToLowerInvariant();
                var typeEntity = await _context.WorkItemTypes.FirstOrDefaultAsync(t => t.TypeKey.ToLower() == typeKey && t.IsActive);
                if (typeEntity == null)
                    return BadRequest(new { success = false, status = false, error = "Invalid work item type.", message = "Invalid work item type." });

                var typeAllowed = await _context.ProjectWorkItemTypes
                    .AnyAsync(pt => pt.ProjectId == project.Id && pt.WorkItemTypeId == typeEntity.Id);
                if (!typeAllowed)
                    return BadRequest(new { success = false, status = false, error = $"Work item type '{typeEntity.TypeName}' is not enabled for this project.", message = $"Work item type '{typeEntity.TypeName}' is not enabled for this project." });

                var statusKey = (request.Status ?? "todo").Trim().ToLowerInvariant();
                var statusEntity = await _context.WorkItemStatuses.FirstOrDefaultAsync(s => s.StatusKey.ToLower() == statusKey && s.IsActive);
                if (statusEntity == null)
                    return BadRequest(new { success = false, status = false, error = "Invalid status.", message = "Invalid status." });

                var priorityKey = (request.Priority ?? "medium").Trim().ToLowerInvariant();
                var priorityEntity = await _context.WorkItemPriorities.FirstOrDefaultAsync(p => p.PriorityKey.ToLower() == priorityKey && p.IsActive);
                if (priorityEntity == null)
                    return BadRequest(new { success = false, status = false, error = "Invalid priority.", message = "Invalid priority." });

                var storyPointEntity = await _context.WorkItemStoryPoints.FirstOrDefaultAsync(sp => sp.NumericValue == request.StoryPoints);

                int? assigneeId = request.AssigneeId.HasValue && request.AssigneeId.Value > 0 ? request.AssigneeId.Value : null;
                if (assigneeId.HasValue && !await _context.Users.AnyAsync(u => u.Id == assigneeId.Value && u.IsActive))
                    return BadRequest(new { success = false, status = false, error = "Selected assignee does not exist.", message = "Selected assignee does not exist." });

                int? sprintId = request.SprintId.HasValue && request.SprintId.Value > 0 ? request.SprintId.Value : null;
                if (sprintId.HasValue && !await _context.Sprints.AnyAsync(s => s.Id == sprintId.Value && s.ProjectId == project.Id))
                    sprintId = null;

                int? parentEpicId = null;
                if (!string.IsNullOrWhiteSpace(request.EpicKey) && typeKey != "epic")
                {
                    var epicKey = request.EpicKey.Trim().ToUpperInvariant();
                    var epic = await _context.WorkItems.FirstOrDefaultAsync(w => w.ProjectId == project.Id && w.WorkItemKey.ToUpper() == epicKey);
                    parentEpicId = epic?.Id;
                }

                DateTime? dueDate = null;
                if (!string.IsNullOrWhiteSpace(request.DueDate))
                {
                    if (!DateTime.TryParse(request.DueDate, out var parsedDate))
                        return BadRequest(new { success = false, status = false, error = "Invalid due date.", message = "Invalid due date." });
                    dueDate = parsedDate.Date;
                }

                var reporterId = GetCurrentUserId();
                if (reporterId <= 0)
                    return Unauthorized(new { success = false, status = false, error = "Invalid user session.", message = "Invalid user session." });

                var labels = NormalizeLabels(request.Labels);
                var now = DateTime.UtcNow;

                using var transaction = await _context.Database.BeginTransactionAsync();

                project.IssueSequence += 1;
                project.UpdatedAt = now;

                var workItem = new WorkItem
                {
                    WorkItemKey = $"{project.ProjectKey}-{project.IssueSequence}",
                    ProjectId = project.Id,
                    StatusId = statusEntity.Id,
                    WorkItemTypeId = typeEntity.Id,
                    PriorityId = priorityEntity.Id,
                    Summary = title,
                    Description = description,
                    AssigneeId = assigneeId,
                    ReporterId = reporterId,
                    SprintId = sprintId,
                    ParentEpicId = parentEpicId,
                    StoryPointId = storyPointEntity?.Id,
                    StoryPoints = request.StoryPoints,
                    DueDate = dueDate,
                    StartedAt = statusEntity.Category == "in_progress" ? now : null,
                    CompletedAt = statusEntity.Category == "done" ? now : null,
                    CreatedAt = now,
                    UpdatedAt = now
                };

                _context.WorkItems.Add(workItem);
                await _context.SaveChangesAsync();

                foreach (var label in labels)
                {
                    _context.WorkItemLabels.Add(new WorkItemLabel
                    {
                        WorkItemId = workItem.Id,
                        LabelName = label
                    });
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                var mapped = await MapWorkItemsAsync(new List<WorkItem> { workItem });

                return StatusCode(StatusCodes.Status201Created, new
                {
                    success = true,
                    status = true,
                    message = $"Work item {workItem.WorkItemKey} created successfully!",
                    workItem = mapped.First()
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, status = false, error = "An error occurred while creating the work item.", message = ex.Message });
            }
        }

        [HttpPut]
        [Route("UpdateWorkItem/{id}")]
        public async Task<IActionResult> UpdateWorkItem(int id, [FromBody] WorkItemRequest request)
        {
            try
            {
                var workItem = await _context.WorkItems.FindAsync(id);
                if (workItem == null)
                    return NotFound(new { success = false, status = false, error = "Work item not found.", message = "Work item not found." });

                var now = DateTime.UtcNow;

                if (!string.IsNullOrWhiteSpace(request.Title))
                {
                    var title = request.Title.Trim();
                    if (title.Length > 200)
                        return BadRequest(new { success = false, status = false, error = "Summary must be 200 characters or fewer.", message = "Summary must be 200 characters or fewer." });
                    workItem.Summary = title;
                }

                if (request.Description != null)
                {
                    if (request.Description.Length > 5000)
                        return BadRequest(new { success = false, status = false, error = "Description must be 5000 characters or fewer.", message = "Description must be 5000 characters or fewer." });
                    workItem.Description = request.Description.Trim();
                }

                if (!string.IsNullOrWhiteSpace(request.Type))
                {
                    var typeKey = request.Type.Trim().ToLowerInvariant();
                    var typeEntity = await _context.WorkItemTypes.FirstOrDefaultAsync(t => t.TypeKey.ToLower() == typeKey && t.IsActive);
                    if (typeEntity != null) workItem.WorkItemTypeId = typeEntity.Id;
                }

                if (!string.IsNullOrWhiteSpace(request.Priority))
                {
                    var priorityKey = request.Priority.Trim().ToLowerInvariant();
                    var priorityEntity = await _context.WorkItemPriorities.FirstOrDefaultAsync(p => p.PriorityKey.ToLower() == priorityKey && p.IsActive);
                    if (priorityEntity != null) workItem.PriorityId = priorityEntity.Id;
                }

                if (!string.IsNullOrWhiteSpace(request.Status))
                {
                    var statusKey = request.Status.Trim().ToLowerInvariant();
                    var statusEntity = await _context.WorkItemStatuses.FirstOrDefaultAsync(s => s.StatusKey.ToLower() == statusKey && s.IsActive);
                    if (statusEntity != null)
                    {
                        workItem.StatusId = statusEntity.Id;
                        if (statusEntity.Category == "in_progress" && !workItem.StartedAt.HasValue)
                            workItem.StartedAt = now;
                        if (statusEntity.Category == "done")
                            workItem.CompletedAt = now;
                        else
                            workItem.CompletedAt = null;
                    }
                }

                if (ValidPoints.Contains(request.StoryPoints))
                {
                    var sp = await _context.WorkItemStoryPoints.FirstOrDefaultAsync(x => x.NumericValue == request.StoryPoints);
                    workItem.StoryPoints = request.StoryPoints;
                    workItem.StoryPointId = sp?.Id;
                }

                workItem.AssigneeId = request.AssigneeId.HasValue && request.AssigneeId.Value > 0 ? request.AssigneeId.Value : null;

                if (request.SprintId.HasValue && request.SprintId.Value > 0)
                {
                    var validSprint = await _context.Sprints.AnyAsync(s => s.Id == request.SprintId.Value && s.ProjectId == workItem.ProjectId);
                    workItem.SprintId = validSprint ? request.SprintId.Value : null;
                }
                else
                {
                    workItem.SprintId = null;
                }

                if (request.DueDate != null)
                {
                    workItem.DueDate = DateTime.TryParse(request.DueDate, out var parsed) ? parsed.Date : null;
                }

                if (request.EpicKey != null)
                {
                    if (string.IsNullOrWhiteSpace(request.EpicKey))
                    {
                        workItem.ParentEpicId = null;
                    }
                    else
                    {
                        var epicKey = request.EpicKey.Trim().ToUpperInvariant();
                        var epic = await _context.WorkItems.FirstOrDefaultAsync(w => w.ProjectId == workItem.ProjectId && w.WorkItemKey.ToUpper() == epicKey && w.Id != id);
                        workItem.ParentEpicId = epic?.Id;
                    }
                }

                if (request.Labels != null)
                {
                    var existingLabels = await _context.WorkItemLabels.Where(l => l.WorkItemId == id).ToListAsync();
                    _context.WorkItemLabels.RemoveRange(existingLabels);
                    foreach (var label in NormalizeLabels(request.Labels))
                    {
                        _context.WorkItemLabels.Add(new WorkItemLabel { WorkItemId = id, LabelName = label });
                    }
                }

                workItem.UpdatedAt = now;
                await _context.SaveChangesAsync();

                var mapped = await MapWorkItemsAsync(new List<WorkItem> { workItem });

                return Ok(new
                {
                    success = true,
                    status = true,
                    message = $"Work item {workItem.WorkItemKey} updated successfully!",
                    workItem = mapped.First()
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, status = false, error = "An error occurred while updating the work item.", message = ex.Message });
            }
        }

        [HttpDelete]
        [Route("DeleteWorkItem/{id}")]
        public async Task<IActionResult> DeleteWorkItem(int id)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var workItem = await _context.WorkItems.FindAsync(id);
                if (workItem == null)
                    return NotFound(new { success = false, status = false, error = "Work item not found.", message = "Work item not found." });

                var children = await _context.WorkItems.Where(w => w.ParentEpicId == id).ToListAsync();
                foreach (var child in children) child.ParentEpicId = null;
                await _context.SaveChangesAsync();

                _context.WorkItems.Remove(workItem);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { success = true, status = true, message = "Work item deleted successfully!" });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { success = false, status = false, error = "An error occurred while deleting the work item.", message = ex.Message });
            }
        }

        private int GetCurrentUserId()
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier)
                        ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            return int.TryParse(claim, out var id) ? id : 0;
        }

        private static List<string> NormalizeLabels(List<string>? labels)
        {
            if (labels == null) return new List<string>();
            return labels
                .Select(l => (l ?? string.Empty).Trim().ToLowerInvariant().Replace(' ', '-'))
                .Where(l => l.Length > 0 && l.Length <= 24)
                .Distinct()
                .Take(10)
                .ToList();
        }

        private async Task<List<object>> MapWorkItemsAsync(List<WorkItem> items)
        {
            if (items.Count == 0) return new List<object>();

            var itemIds = items.Select(i => i.Id).ToList();
            var usersById = await _context.Users.ToDictionaryAsync(u => u.Id);
            var typesById = await _context.WorkItemTypes.ToDictionaryAsync(t => t.Id, t => t.TypeKey);
            var prioritiesById = await _context.WorkItemPriorities.ToDictionaryAsync(p => p.Id, p => p.PriorityKey);
            var statusesById = await _context.WorkItemStatuses.ToDictionaryAsync(s => s.Id, s => s.StatusKey);
            var labelsByItem = (await _context.WorkItemLabels.Where(l => itemIds.Contains(l.WorkItemId)).ToListAsync())
                .GroupBy(l => l.WorkItemId)
                .ToDictionary(g => g.Key, g => g.Select(x => x.LabelName).ToList());

            var epicIds = items.Where(i => i.ParentEpicId.HasValue).Select(i => i.ParentEpicId!.Value).Distinct().ToList();
            var epicsById = epicIds.Count > 0
                ? await _context.WorkItems.Where(w => epicIds.Contains(w.Id)).ToDictionaryAsync(w => w.Id)
                : new Dictionary<int, WorkItem>();

            return items.Select(item =>
            {
                var reporter = usersById.TryGetValue(item.ReporterId, out var rep)
                    ? MapUserDto(rep)
                    : new { id = item.ReporterId.ToString(), name = "Unknown", email = string.Empty, avatar = string.Empty, role = string.Empty, department = string.Empty, status = "offline" };

                object? assignee = item.AssigneeId.HasValue && usersById.TryGetValue(item.AssigneeId.Value, out var asg)
                    ? MapUserDto(asg)
                    : null;

                epicsById.TryGetValue(item.ParentEpicId ?? 0, out var epic);

                return (object)new
                {
                    id = item.Id.ToString(),
                    key = item.WorkItemKey,
                    projectId = item.ProjectId.ToString(),
                    title = item.Summary,
                    description = item.Description,
                    type = typesById.GetValueOrDefault(item.WorkItemTypeId, "task"),
                    priority = prioritiesById.GetValueOrDefault(item.PriorityId, "medium"),
                    status = statusesById.GetValueOrDefault(item.StatusId, "todo"),
                    assignee,
                    reporter,
                    sprintId = item.SprintId.HasValue ? item.SprintId.Value.ToString() : null,
                    storyPoints = item.StoryPoints,
                    labels = labelsByItem.GetValueOrDefault(item.Id) ?? new List<string>(),
                    epicKey = epic?.WorkItemKey,
                    epicTitle = epic?.Summary,
                    subtasks = Array.Empty<object>(),
                    comments = Array.Empty<object>(),
                    activities = Array.Empty<object>(),
                    dueDate = item.DueDate.HasValue ? item.DueDate.Value.ToString("yyyy-MM-dd") : null,
                    createdAt = item.CreatedAt.ToString("o"),
                    updatedAt = item.UpdatedAt.ToString("o")
                };
            }).ToList();
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
    }
}
