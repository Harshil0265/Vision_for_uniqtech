/*
================================================================================
  VISION PROJECT MANAGEMENT TOOL — PROPER MSSQL DATABASE SCHEMA
  Database : [db_a4843b_projectmanagment]
  Engine   : Microsoft SQL Server (2016 / 2019 / 2022 / Azure SQL)
  Pattern  : Consistent PascalCase + INT IDENTITY(1,1) + Normalized Lookup Tables
================================================================================
  HOW TO USE:
  - Run on a clean database (or drop old tables first in reverse FK order).
  - All foreign keys are checked for SQL Server "multiple cascade paths" safety.
  - Seed data for Lookup tables (Types, Priorities, Statuses, StoryPoints) is included.
================================================================================
*/

USE [db_a4843b_projectmanagment];
GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

BEGIN TRY
BEGIN TRANSACTION;

/* ============================================================================
   SECTION 1: LOOKUP / MASTER TABLES
   ============================================================================ */

-- 1. WorkItemTypes (replaces 7 enable_* BIT columns on Projects for clean extensibility)
CREATE TABLE [dbo].[WorkItemTypes] (
    [WorkItemTypeID] INT IDENTITY(1,1) NOT NULL,
    [TypeKey]        NVARCHAR(30)      NOT NULL, -- epic, story, task, bug, spike, subtask, incident
    [TypeName]       NVARCHAR(50)      NOT NULL, -- Epic, User Story, Task, Bug, Spike, Subtask, Incident
    [Description]    NVARCHAR(200)     NULL,
    [DisplayOrder]   INT               NOT NULL CONSTRAINT [DF_WorkItemTypes_DisplayOrder] DEFAULT (0),
    [IsActive]       BIT               NOT NULL CONSTRAINT [DF_WorkItemTypes_IsActive]     DEFAULT (1),
    CONSTRAINT [PK_WorkItemTypes] PRIMARY KEY CLUSTERED ([WorkItemTypeID] ASC),
    CONSTRAINT [UQ_WorkItemTypes_TypeKey]  UNIQUE NONCLUSTERED ([TypeKey] ASC),
    CONSTRAINT [UQ_WorkItemTypes_TypeName] UNIQUE NONCLUSTERED ([TypeName] ASC)
);

-- 2. WorkItemPriorities (upgraded from your existing table)
CREATE TABLE [dbo].[WorkItemPriorities] (
    [PriorityID]   INT IDENTITY(1,1) NOT NULL,
    [PriorityKey]  NVARCHAR(30)      NOT NULL, -- blocker, high, medium, low, lowest
    [PriorityName] NVARCHAR(100)     NOT NULL, -- Blocker, High, Medium, Low, Lowest
    [ColorHex]     NVARCHAR(20)      NOT NULL CONSTRAINT [DF_WorkItemPriorities_ColorHex]     DEFAULT ('#64748b'),
    [DisplayOrder] INT               NOT NULL CONSTRAINT [DF_WorkItemPriorities_DisplayOrder] DEFAULT (0),
    [IsActive]     BIT               NOT NULL CONSTRAINT [DF_WorkItemPriorities_IsActive]     DEFAULT (1),
    CONSTRAINT [PK_WorkItemPriorities] PRIMARY KEY CLUSTERED ([PriorityID] ASC),
    CONSTRAINT [UQ_WorkItemPriorities_Key]  UNIQUE NONCLUSTERED ([PriorityKey] ASC),
    CONSTRAINT [UQ_WorkItemPriorities_Name] UNIQUE NONCLUSTERED ([PriorityName] ASC)
);

-- 3. WorkItemStatuses / Kanban Columns (upgraded from your existing table to support WIP limits & Board categories)
CREATE TABLE [dbo].[WorkItemStatuses] (
    [StatusID]     INT IDENTITY(1,1) NOT NULL,
    [StatusKey]    NVARCHAR(50)      NOT NULL, -- backlog, todo, in_progress, code_review, qa_staging, done
    [StatusName]   NVARCHAR(60)      NOT NULL, -- Backlog, To Do, In Progress, Code Review, QA & Staging, Done
    [Category]     NVARCHAR(20)      NOT NULL, -- todo, in_progress, done (used for Dashboard & Sprint velocity)
    [WipLimit]     INT               NOT NULL CONSTRAINT [DF_WorkItemStatuses_WipLimit]     DEFAULT (0), -- 0 = unlimited
    [ColorHex]     NVARCHAR(20)      NOT NULL CONSTRAINT [DF_WorkItemStatuses_ColorHex]     DEFAULT ('#2563eb'),
    [DisplayOrder] INT               NOT NULL CONSTRAINT [DF_WorkItemStatuses_DisplayOrder] DEFAULT (0),
    [IsActive]     BIT               NOT NULL CONSTRAINT [DF_WorkItemStatuses_IsActive]     DEFAULT (1),
    [CreatedAt]    DATETIME2(7)      NOT NULL CONSTRAINT [DF_WorkItemStatuses_CreatedAt]    DEFAULT (SYSUTCDATETIME()),
    [UpdatedAt]    DATETIME2(7)      NOT NULL CONSTRAINT [DF_WorkItemStatuses_UpdatedAt]    DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT [PK_WorkItemStatuses] PRIMARY KEY CLUSTERED ([StatusID] ASC),
    CONSTRAINT [UQ_WorkItemStatuses_Key]  UNIQUE NONCLUSTERED ([StatusKey] ASC),
    CONSTRAINT [UQ_WorkItemStatuses_Name] UNIQUE NONCLUSTERED ([StatusName] ASC),
    CONSTRAINT [CK_WorkItemStatuses_Category] CHECK ([Category] IN ('todo', 'in_progress', 'done')),
    CONSTRAINT [CK_WorkItemStatuses_WipLimit] CHECK ([WipLimit] >= 0)
);

-- 4. WorkItemStoryPoints (upgraded from your existing table)
CREATE TABLE [dbo].[WorkItemStoryPoints] (
    [StoryPointID] INT IDENTITY(1,1) NOT NULL,
    [PointLabel]   NVARCHAR(50)      NOT NULL, -- 'Not estimated', '1 point', '2 points', ...
    [NumericValue] INT               NOT NULL, -- 0, 1, 2, 3, 5, 8, 13, 21
    [DisplayOrder] INT               NOT NULL CONSTRAINT [DF_WorkItemStoryPoints_DisplayOrder] DEFAULT (0),
    CONSTRAINT [PK_WorkItemStoryPoints] PRIMARY KEY CLUSTERED ([StoryPointID] ASC),
    CONSTRAINT [UQ_WorkItemStoryPoints_Label] UNIQUE NONCLUSTERED ([PointLabel] ASC),
    CONSTRAINT [UQ_WorkItemStoryPoints_Value] UNIQUE NONCLUSTERED ([NumericValue] ASC),
    CONSTRAINT [CK_WorkItemStoryPoints_Value] CHECK ([NumericValue] >= 0)
);

/* ============================================================================
   SECTION 2: USERS & AUTHENTICATION
   ============================================================================ */

-- 5. Users (fixed: Email instead of GmailAddress, PasswordHash NVARCHAR(256) NULL for invited users, Status, Avatar)
CREATE TABLE [dbo].[Users] (
    [UserID]       INT IDENTITY(1,1) NOT NULL,
    [FullName]     NVARCHAR(100)     NOT NULL,
    [Email]        NVARCHAR(254)     NOT NULL, -- Store lowercase; unique across workspace
    [PasswordHash] NVARCHAR(256)     NULL,     -- BCrypt / ASP.NET Identity hash; NULL while Status = 'invited'
    [AvatarUrl]    NVARCHAR(500)     NOT NULL CONSTRAINT [DF_Users_AvatarUrl]  DEFAULT (''),
    [JobTitle]     NVARCHAR(60)      NOT NULL CONSTRAINT [DF_Users_JobTitle]   DEFAULT (''),
    [Department]   NVARCHAR(60)      NOT NULL CONSTRAINT [DF_Users_Department] DEFAULT (''),
    [Status]       NVARCHAR(20)      NOT NULL CONSTRAINT [DF_Users_Status]     DEFAULT ('online'),
    [IsActive]     BIT               NOT NULL CONSTRAINT [DF_Users_IsActive]   DEFAULT (1),
    [CreatedAt]    DATETIME2(7)      NOT NULL CONSTRAINT [DF_Users_CreatedAt]  DEFAULT (SYSUTCDATETIME()),
    [UpdatedAt]    DATETIME2(7)      NOT NULL CONSTRAINT [DF_Users_UpdatedAt]  DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT [PK_Users] PRIMARY KEY CLUSTERED ([UserID] ASC),
    CONSTRAINT [UQ_Users_Email] UNIQUE NONCLUSTERED ([Email] ASC),
    CONSTRAINT [CK_Users_Status] CHECK ([Status] IN ('online', 'busy', 'away', 'offline', 'invited'))
);

-- 6. RefreshTokens (NEW — JWT session tracking, logout, and revoking sessions on password change)
CREATE TABLE [dbo].[RefreshTokens] (
    [RefreshTokenID] INT IDENTITY(1,1) NOT NULL,
    [UserID]         INT               NOT NULL,
    [TokenHash]      NVARCHAR(450)     NOT NULL,
    [ExpiresAt]      DATETIME2(7)      NOT NULL,
    [CreatedAt]      DATETIME2(7)      NOT NULL CONSTRAINT [DF_RefreshTokens_CreatedAt] DEFAULT (SYSUTCDATETIME()),
    [RevokedAt]      DATETIME2(7)      NULL,
    CONSTRAINT [PK_RefreshTokens] PRIMARY KEY CLUSTERED ([RefreshTokenID] ASC),
    CONSTRAINT [UQ_RefreshTokens_TokenHash] UNIQUE NONCLUSTERED ([TokenHash] ASC),
    CONSTRAINT [FK_RefreshTokens_Users] FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users]([UserID]) ON DELETE CASCADE
);

-- 7. PasswordResetTokens (NEW — Forgot / Reset Password flow, single-use & <= 1 hour expiry)
CREATE TABLE [dbo].[PasswordResetTokens] (
    [ResetTokenID] INT IDENTITY(1,1) NOT NULL,
    [UserID]       INT               NOT NULL,
    [TokenHash]    NVARCHAR(450)     NOT NULL,
    [ExpiresAt]    DATETIME2(7)      NOT NULL,
    [UsedAt]       DATETIME2(7)      NULL,
    [CreatedAt]    DATETIME2(7)      NOT NULL CONSTRAINT [DF_PasswordResetTokens_CreatedAt] DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT [PK_PasswordResetTokens] PRIMARY KEY CLUSTERED ([ResetTokenID] ASC),
    CONSTRAINT [UQ_PasswordResetTokens_TokenHash] UNIQUE NONCLUSTERED ([TokenHash] ASC),
    CONSTRAINT [FK_PasswordResetTokens_Users] FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users]([UserID]) ON DELETE CASCADE
);

/* ============================================================================
   SECTION 3: PROJECTS & ROLE-BASED ACCESS CONTROL (RBAC)
   ============================================================================ */

-- 8. Projects (upgraded: PascalCase, FKs to Users, Template, IconGradient, IssueSequence, DefaultAssigneeMode)
CREATE TABLE [dbo].[Projects] (
    [ProjectID]           INT IDENTITY(1,1) NOT NULL,
    [ProjectName]         NVARCHAR(100)     NOT NULL,
    [ProjectKey]          NVARCHAR(10)      NOT NULL, -- e.g. OP, MOB, SEC (immutable after creation)
    [Description]         NVARCHAR(500)     NOT NULL CONSTRAINT [DF_Projects_Description]         DEFAULT (''),
    [ProjectLeadID]       INT               NOT NULL,
    [Template]            NVARCHAR(30)      NOT NULL CONSTRAINT [DF_Projects_Template]            DEFAULT ('Scrum'),
    [DefaultAssigneeMode] NVARCHAR(20)      NOT NULL CONSTRAINT [DF_Projects_DefaultAssigneeMode] DEFAULT ('unassigned'),
    [DefaultAssigneeID]   INT               NULL,     -- Optional specific default assignee user
    [IconGradient]        NVARCHAR(100)     NOT NULL CONSTRAINT [DF_Projects_IconGradient]        DEFAULT ('from-blue-600 via-indigo-600 to-sky-500'),
    [IssueSequence]       INT               NOT NULL CONSTRAINT [DF_Projects_IssueSequence]       DEFAULT (100), -- Incremented to generate OP-101, OP-102...
    [IsArchived]          BIT               NOT NULL CONSTRAINT [DF_Projects_IsArchived]          DEFAULT (0),
    [CreatedAt]           DATETIME2(7)      NOT NULL CONSTRAINT [DF_Projects_CreatedAt]           DEFAULT (SYSUTCDATETIME()),
    [UpdatedAt]           DATETIME2(7)      NOT NULL CONSTRAINT [DF_Projects_UpdatedAt]           DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT [PK_Projects] PRIMARY KEY CLUSTERED ([ProjectID] ASC),
    CONSTRAINT [UQ_Projects_ProjectKey] UNIQUE NONCLUSTERED ([ProjectKey] ASC),
    CONSTRAINT [FK_Projects_ProjectLead]     FOREIGN KEY ([ProjectLeadID])     REFERENCES [dbo].[Users]([UserID]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Projects_DefaultAssignee] FOREIGN KEY ([DefaultAssigneeID]) REFERENCES [dbo].[Users]([UserID]) ON DELETE NO ACTION,
    CONSTRAINT [CK_Projects_Template]            CHECK ([Template] IN ('Scrum', 'Kanban', 'Bug Tracking')),
    CONSTRAINT [CK_Projects_DefaultAssigneeMode] CHECK ([DefaultAssigneeMode] IN ('unassigned', 'lead')),
    CONSTRAINT [CK_Projects_IssueSequence]       CHECK ([IssueSequence] >= 100)
);

-- 9. ProjectMembers (upgraded: added UserID FK, Role for RBAC, AddedAt, AddedByUserID)
CREATE TABLE [dbo].[ProjectMembers] (
    [ProjectID]     INT          NOT NULL,
    [UserID]        INT          NOT NULL,
    [ProjectRole]   NVARCHAR(20) NOT NULL CONSTRAINT [DF_ProjectMembers_Role]    DEFAULT ('member'),
    [AddedAt]       DATETIME2(7) NOT NULL CONSTRAINT [DF_ProjectMembers_AddedAt] DEFAULT (SYSUTCDATETIME()),
    [AddedByUserID] INT          NULL,
    CONSTRAINT [PK_ProjectMembers] PRIMARY KEY CLUSTERED ([ProjectID] ASC, [UserID] ASC),
    CONSTRAINT [FK_ProjectMembers_Projects] FOREIGN KEY ([ProjectID])     REFERENCES [dbo].[Projects]([ProjectID]) ON DELETE CASCADE,
    CONSTRAINT [FK_ProjectMembers_Users]    FOREIGN KEY ([UserID])        REFERENCES [dbo].[Users]([UserID])       ON DELETE NO ACTION,
    CONSTRAINT [FK_ProjectMembers_AddedBy]  FOREIGN KEY ([AddedByUserID]) REFERENCES [dbo].[Users]([UserID])       ON DELETE NO ACTION,
    CONSTRAINT [CK_ProjectMembers_Role] CHECK ([ProjectRole] IN ('owner', 'admin', 'member', 'viewer'))
);

-- 10. ProjectWorkItemTypes (replaces enable_epic..enable_incident BIT columns; normalized junction table)
CREATE TABLE [dbo].[ProjectWorkItemTypes] (
    [ProjectID]      INT NOT NULL,
    [WorkItemTypeID] INT NOT NULL,
    CONSTRAINT [PK_ProjectWorkItemTypes] PRIMARY KEY CLUSTERED ([ProjectID] ASC, [WorkItemTypeID] ASC),
    CONSTRAINT [FK_ProjectWorkItemTypes_Projects] FOREIGN KEY ([ProjectID])      REFERENCES [dbo].[Projects]([ProjectID])           ON DELETE CASCADE,
    CONSTRAINT [FK_ProjectWorkItemTypes_Types]    FOREIGN KEY ([WorkItemTypeID]) REFERENCES [dbo].[WorkItemTypes]([WorkItemTypeID]) ON DELETE NO ACTION
);

/* ============================================================================
   SECTION 4: SPRINTS & WORK ITEMS
   ============================================================================ */

-- 11. Sprints (NEW — required for Backlog, Active Board, Sprint Velocity & Completion)
CREATE TABLE [dbo].[Sprints] (
    [SprintID]        INT IDENTITY(1,1) NOT NULL,
    [ProjectID]       INT               NOT NULL,
    [SprintName]      NVARCHAR(100)     NOT NULL,
    [Goal]            NVARCHAR(300)     NOT NULL CONSTRAINT [DF_Sprints_Goal]            DEFAULT (''),
    [StartDate]       DATE              NOT NULL,
    [EndDate]         DATE              NOT NULL,
    [Status]          NVARCHAR(20)      NOT NULL CONSTRAINT [DF_Sprints_Status]          DEFAULT ('planned'),
    [PlannedPoints]   INT               NOT NULL CONSTRAINT [DF_Sprints_PlannedPoints]   DEFAULT (0),
    [CompletedPoints] INT               NOT NULL CONSTRAINT [DF_Sprints_CompletedPoints] DEFAULT (0),
    [CompletedAt]     DATETIME2(7)      NULL,
    [CreatedAt]       DATETIME2(7)      NOT NULL CONSTRAINT [DF_Sprints_CreatedAt]       DEFAULT (SYSUTCDATETIME()),
    [UpdatedAt]       DATETIME2(7)      NOT NULL CONSTRAINT [DF_Sprints_UpdatedAt]       DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT [PK_Sprints] PRIMARY KEY CLUSTERED ([SprintID] ASC),
    CONSTRAINT [UQ_Sprints_Project_Name] UNIQUE NONCLUSTERED ([ProjectID] ASC, [SprintName] ASC),
    CONSTRAINT [FK_Sprints_Projects] FOREIGN KEY ([ProjectID]) REFERENCES [dbo].[Projects]([ProjectID]) ON DELETE CASCADE,
    CONSTRAINT [CK_Sprints_Status] CHECK ([Status] IN ('planned', 'active', 'completed')),
    CONSTRAINT [CK_Sprints_Dates]  CHECK ([EndDate] > [StartDate]),
    CONSTRAINT [CK_Sprints_Points] CHECK ([PlannedPoints] >= 0 AND [CompletedPoints] >= 0)
);

-- 12. WorkItems (COMPLETELY FIXED: replaced loose text columns with proper Foreign Key IDs + WorkItemKey)
CREATE TABLE [dbo].[WorkItems] (
    [WorkItemID]     INT IDENTITY(1,1) NOT NULL,
    [WorkItemKey]    NVARCHAR(20)      NOT NULL, -- e.g. OP-101, MOB-202
    [ProjectID]      INT               NOT NULL,
    [StatusID]       INT               NOT NULL,
    [WorkItemTypeID] INT               NOT NULL,
    [PriorityID]     INT               NOT NULL,
    [Summary]        NVARCHAR(200)     NOT NULL,
    [Description]    NVARCHAR(MAX)     NOT NULL CONSTRAINT [DF_WorkItems_Description] DEFAULT (''),
    [AssigneeID]     INT               NULL,     -- NULL = Unassigned; must be non-viewer project member
    [ReporterID]     INT               NOT NULL,
    [SprintID]       INT               NULL,     -- NULL = Product Backlog
    [ParentEpicID]   INT               NULL,     -- Self-FK to parent Epic WorkItemID
    [StoryPointID]   INT               NULL,     -- Optional FK to WorkItemStoryPoints
    [StoryPoints]    INT               NOT NULL CONSTRAINT [DF_WorkItems_StoryPoints] DEFAULT (0), -- Denormalized numeric value for fast SUM()
    [DueDate]        DATE              NULL,
    [StartedAt]      DATETIME2(7)      NULL,     -- Set when moved to 'in_progress' (for Avg Cycle Time)
    [CompletedAt]    DATETIME2(7)      NULL,     -- Set when moved to 'done' (for Cycle Time & Burndown)
    [CreatedAt]      DATETIME2(7)      NOT NULL CONSTRAINT [DF_WorkItems_CreatedAt]   DEFAULT (SYSUTCDATETIME()),
    [UpdatedAt]      DATETIME2(7)      NOT NULL CONSTRAINT [DF_WorkItems_UpdatedAt]   DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT [PK_WorkItems] PRIMARY KEY CLUSTERED ([WorkItemID] ASC),
    CONSTRAINT [UQ_WorkItems_Key] UNIQUE NONCLUSTERED ([WorkItemKey] ASC),
    CONSTRAINT [FK_WorkItems_Projects]    FOREIGN KEY ([ProjectID])      REFERENCES [dbo].[Projects]([ProjectID])                 ON DELETE CASCADE,
    CONSTRAINT [FK_WorkItems_Statuses]    FOREIGN KEY ([StatusID])       REFERENCES [dbo].[WorkItemStatuses]([StatusID])          ON DELETE NO ACTION,
    CONSTRAINT [FK_WorkItems_Types]       FOREIGN KEY ([WorkItemTypeID]) REFERENCES [dbo].[WorkItemTypes]([WorkItemTypeID])       ON DELETE NO ACTION,
    CONSTRAINT [FK_WorkItems_Priorities]  FOREIGN KEY ([PriorityID])     REFERENCES [dbo].[WorkItemPriorities]([PriorityID])      ON DELETE NO ACTION,
    CONSTRAINT [FK_WorkItems_Assignee]    FOREIGN KEY ([AssigneeID])     REFERENCES [dbo].[Users]([UserID])                       ON DELETE NO ACTION,
    CONSTRAINT [FK_WorkItems_Reporter]    FOREIGN KEY ([ReporterID])     REFERENCES [dbo].[Users]([UserID])                       ON DELETE NO ACTION,
    CONSTRAINT [FK_WorkItems_Sprints]     FOREIGN KEY ([SprintID])       REFERENCES [dbo].[Sprints]([SprintID])                   ON DELETE NO ACTION, -- Clear SprintID in API/SP before deleting sprint
    CONSTRAINT [FK_WorkItems_ParentEpic]  FOREIGN KEY ([ParentEpicID])   REFERENCES [dbo].[WorkItems]([WorkItemID])               ON DELETE NO ACTION,
    CONSTRAINT [FK_WorkItems_StoryPoints] FOREIGN KEY ([StoryPointID])   REFERENCES [dbo].[WorkItemStoryPoints]([StoryPointID])   ON DELETE NO ACTION,
    CONSTRAINT [CK_WorkItems_StoryPoints] CHECK ([StoryPoints] IN (0, 1, 2, 3, 5, 8, 13, 21)),
    CONSTRAINT [CK_WorkItems_NoSelfEpic]  CHECK ([ParentEpicID] IS NULL OR [ParentEpicID] <> [WorkItemID])
);

-- 13. WorkItemSubtasks (NEW — Checklist items inside Issue Detail Modal)
CREATE TABLE [dbo].[WorkItemSubtasks] (
    [SubtaskID]    INT IDENTITY(1,1) NOT NULL,
    [WorkItemID]   INT               NOT NULL,
    [Title]        NVARCHAR(200)     NOT NULL,
    [IsCompleted]  BIT               NOT NULL CONSTRAINT [DF_WorkItemSubtasks_IsCompleted]  DEFAULT (0),
    [DisplayOrder] INT               NOT NULL CONSTRAINT [DF_WorkItemSubtasks_DisplayOrder] DEFAULT (0),
    [CreatedAt]    DATETIME2(7)      NOT NULL CONSTRAINT [DF_WorkItemSubtasks_CreatedAt]    DEFAULT (SYSUTCDATETIME()),
    [UpdatedAt]    DATETIME2(7)      NOT NULL CONSTRAINT [DF_WorkItemSubtasks_UpdatedAt]    DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT [PK_WorkItemSubtasks] PRIMARY KEY CLUSTERED ([SubtaskID] ASC),
    CONSTRAINT [FK_WorkItemSubtasks_WorkItems] FOREIGN KEY ([WorkItemID]) REFERENCES [dbo].[WorkItems]([WorkItemID]) ON DELETE CASCADE
);

-- 14. WorkItemLabels (NEW — replaces comma-separated Labels NVARCHAR(MAX) column)
CREATE TABLE [dbo].[WorkItemLabels] (
    [WorkItemLabelID] INT IDENTITY(1,1) NOT NULL,
    [WorkItemID]      INT               NOT NULL,
    [LabelName]       NVARCHAR(24)      NOT NULL, -- lowercase, hyphenated, max 24 chars, max 10 per item
    CONSTRAINT [PK_WorkItemLabels] PRIMARY KEY CLUSTERED ([WorkItemLabelID] ASC),
    CONSTRAINT [UQ_WorkItemLabels_Item_Label] UNIQUE NONCLUSTERED ([WorkItemID] ASC, [LabelName] ASC),
    CONSTRAINT [FK_WorkItemLabels_WorkItems] FOREIGN KEY ([WorkItemID]) REFERENCES [dbo].[WorkItems]([WorkItemID]) ON DELETE CASCADE
);

/* ============================================================================
   SECTION 5: COLLABORATION, AUDIT HISTORY & NOTIFICATIONS
   ============================================================================ */

-- 15. WorkItemComments (NEW — Comments tab inside Issue Detail Modal)
CREATE TABLE [dbo].[WorkItemComments] (
    [CommentID]  INT IDENTITY(1,1) NOT NULL,
    [WorkItemID] INT               NOT NULL,
    [AuthorID]   INT               NOT NULL,
    [Content]    NVARCHAR(MAX)     NOT NULL,
    [CreatedAt]  DATETIME2(7)      NOT NULL CONSTRAINT [DF_WorkItemComments_CreatedAt] DEFAULT (SYSUTCDATETIME()),
    [UpdatedAt]  DATETIME2(7)      NOT NULL CONSTRAINT [DF_WorkItemComments_UpdatedAt] DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT [PK_WorkItemComments] PRIMARY KEY CLUSTERED ([CommentID] ASC),
    CONSTRAINT [FK_WorkItemComments_WorkItems] FOREIGN KEY ([WorkItemID]) REFERENCES [dbo].[WorkItems]([WorkItemID]) ON DELETE CASCADE,
    CONSTRAINT [FK_WorkItemComments_Author]    FOREIGN KEY ([AuthorID])   REFERENCES [dbo].[Users]([UserID])         ON DELETE NO ACTION
);

-- 16. CommentMentions (NEW — Tracks @mentions extracted from comments)
CREATE TABLE [dbo].[CommentMentions] (
    [CommentMentionID] INT IDENTITY(1,1) NOT NULL,
    [CommentID]        INT               NOT NULL,
    [MentionedUserID]  INT               NULL,
    [MentionedHandle]  NVARCHAR(100)     NOT NULL,
    CONSTRAINT [PK_CommentMentions] PRIMARY KEY CLUSTERED ([CommentMentionID] ASC),
    CONSTRAINT [FK_CommentMentions_Comments] FOREIGN KEY ([CommentID])       REFERENCES [dbo].[WorkItemComments]([CommentID]) ON DELETE CASCADE,
    CONSTRAINT [FK_CommentMentions_Users]    FOREIGN KEY ([MentionedUserID]) REFERENCES [dbo].[Users]([UserID])               ON DELETE NO ACTION
);

-- 17. Activities (NEW — Issue Audit History tab & Dashboard Recent Activity feed)
CREATE TABLE [dbo].[Activities] (
    [ActivityID] INT IDENTITY(1,1) NOT NULL,
    [ProjectID]  INT               NOT NULL,
    [WorkItemID] INT               NULL, -- NULL for project/member/sprint events
    [UserID]     INT               NOT NULL,
    [ActionText] NVARCHAR(250)     NOT NULL,
    [Details]    NVARCHAR(MAX)     NULL, -- Optional JSON diff
    [CreatedAt]  DATETIME2(7)      NOT NULL CONSTRAINT [DF_Activities_CreatedAt] DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT [PK_Activities] PRIMARY KEY CLUSTERED ([ActivityID] ASC),
    CONSTRAINT [FK_Activities_Projects]  FOREIGN KEY ([ProjectID])  REFERENCES [dbo].[Projects]([ProjectID])   ON DELETE CASCADE,
    CONSTRAINT [FK_Activities_WorkItems] FOREIGN KEY ([WorkItemID]) REFERENCES [dbo].[WorkItems]([WorkItemID]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Activities_Users]     FOREIGN KEY ([UserID])     REFERENCES [dbo].[Users]([UserID])         ON DELETE NO ACTION
);

-- 18. Notifications (NEW — Top Navbar Bell Alerts)
CREATE TABLE [dbo].[Notifications] (
    [NotificationID]   INT IDENTITY(1,1) NOT NULL,
    [UserID]           INT               NOT NULL, -- Recipient
    [AuthorID]         INT               NULL,     -- Actor who triggered notification
    [WorkItemID]       INT               NULL,     -- Optional link to work item
    [WorkItemKey]      NVARCHAR(20)      NULL,     -- Display snapshot (e.g. OP-104)
    [NotificationType] NVARCHAR(20)      NOT NULL, -- assignment, mention, priority, sprint, status
    [Title]            NVARCHAR(150)     NOT NULL,
    [Message]          NVARCHAR(500)     NOT NULL,
    [IsRead]           BIT               NOT NULL CONSTRAINT [DF_Notifications_IsRead]    DEFAULT (0),
    [CreatedAt]        DATETIME2(7)      NOT NULL CONSTRAINT [DF_Notifications_CreatedAt] DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT [PK_Notifications] PRIMARY KEY CLUSTERED ([NotificationID] ASC),
    CONSTRAINT [FK_Notifications_User]      FOREIGN KEY ([UserID])     REFERENCES [dbo].[Users]([UserID])         ON DELETE CASCADE,
    CONSTRAINT [FK_Notifications_Author]    FOREIGN KEY ([AuthorID])   REFERENCES [dbo].[Users]([UserID])         ON DELETE NO ACTION,
    CONSTRAINT [FK_Notifications_WorkItems] FOREIGN KEY ([WorkItemID]) REFERENCES [dbo].[WorkItems]([WorkItemID]) ON DELETE SET NULL,
    CONSTRAINT [CK_Notifications_Type] CHECK ([NotificationType] IN ('assignment', 'mention', 'priority', 'sprint', 'status'))
);

/* ============================================================================
   SECTION 6: PERFORMANCE INDEXES & BUSINESS RULE CONSTRAINTS
   ============================================================================ */

-- Enforce at most ONE active sprint per project at the database level!
CREATE UNIQUE NONCLUSTERED INDEX [UX_Sprints_OneActivePerProject]
    ON [dbo].[Sprints] ([ProjectID])
    WHERE [Status] = 'active';

-- Fast Kanban Board & Backlog loading
CREATE NONCLUSTERED INDEX [IX_WorkItems_BoardFilter]
    ON [dbo].[WorkItems] ([ProjectID], [SprintID], [StatusID])
    INCLUDE ([WorkItemKey], [Summary], [PriorityID], [AssigneeID], [StoryPoints], [WorkItemTypeID]);

-- Fast Dashboard "My Open Work" & "Due in 7 days"
CREATE NONCLUSTERED INDEX [IX_WorkItems_MyWork]
    ON [dbo].[WorkItems] ([AssigneeID], [StatusID], [DueDate])
    WHERE [AssigneeID] IS NOT NULL;

-- Fast Epic swimlane grouping
CREATE NONCLUSTERED INDEX [IX_WorkItems_ParentEpicID]
    ON [dbo].[WorkItems] ([ParentEpicID])
    WHERE [ParentEpicID] IS NOT NULL;

-- Fast "My Projects" lookup
CREATE NONCLUSTERED INDEX [IX_ProjectMembers_UserID]
    ON [dbo].[ProjectMembers] ([UserID]);

-- Fast Subtasks, Comments, Activities & Unread Notifications
CREATE NONCLUSTERED INDEX [IX_WorkItemSubtasks_Order]
    ON [dbo].[WorkItemSubtasks] ([WorkItemID], [DisplayOrder]);

CREATE NONCLUSTERED INDEX [IX_WorkItemComments_Timeline]
    ON [dbo].[WorkItemComments] ([WorkItemID], [CreatedAt]);

CREATE NONCLUSTERED INDEX [IX_Activities_ProjectFeed]
    ON [dbo].[Activities] ([ProjectID], [CreatedAt] DESC);

CREATE NONCLUSTERED INDEX [IX_Activities_WorkItemHistory]
    ON [dbo].[Activities] ([WorkItemID], [CreatedAt] DESC)
    WHERE [WorkItemID] IS NOT NULL;

CREATE NONCLUSTERED INDEX [IX_Notifications_UserUnread]
    ON [dbo].[Notifications] ([UserID], [IsRead], [CreatedAt] DESC);

CREATE NONCLUSTERED INDEX [IX_RefreshTokens_UserActive]
    ON [dbo].[RefreshTokens] ([UserID], [RevokedAt]);

/* ============================================================================
   SECTION 7: SEED DATA FOR LOOKUP TABLES (Matches Vision UI Exactly)
   ============================================================================ */

INSERT INTO [dbo].[WorkItemTypes] ([TypeKey], [TypeName], [Description], [DisplayOrder]) VALUES
    ('epic',     'Epic',       'Large initiative spanning several sprints',      1),
    ('story',    'User Story', 'User-facing deliverable with acceptance criteria', 2),
    ('task',     'Task',       'A piece of implementation work',                 3),
    ('bug',      'Bug',        'Defect, regression or functional error',         4),
    ('spike',    'Spike',      'Time-boxed research or proof of concept',        5),
    ('subtask',  'Subtask',    'Smaller part of a story or task',                6),
    ('incident', 'Incident',   'Production outage or security alert',            7);

INSERT INTO [dbo].[WorkItemPriorities] ([PriorityKey], [PriorityName], [ColorHex], [DisplayOrder]) VALUES
    ('blocker', 'Blocker', '#dc2626', 1),
    ('high',    'High',    '#ea580c', 2),
    ('medium',  'Medium',  '#d97706', 3),
    ('low',     'Low',     '#0284c7', 4),
    ('lowest',  'Lowest',  '#64748b', 5);

INSERT INTO [dbo].[WorkItemStatuses] ([StatusKey], [StatusName], [Category], [WipLimit], [ColorHex], [DisplayOrder]) VALUES
    ('backlog',     'Backlog',      'todo',        0, '#64748b', 1),
    ('todo',        'To Do',        'todo',        8, '#2563eb', 2),
    ('in_progress', 'In Progress',  'in_progress', 4, '#d97706', 3),
    ('code_review', 'Code Review',  'in_progress', 3, '#7c3aed', 4),
    ('qa_staging',  'QA & Staging', 'in_progress', 3, '#db2777', 5),
    ('done',        'Done',         'done',        0, '#059669', 6);

INSERT INTO [dbo].[WorkItemStoryPoints] ([PointLabel], [NumericValue], [DisplayOrder]) VALUES
    ('Not estimated', 0,  1),
    ('1 point',       1,  2),
    ('2 points',      2,  3),
    ('3 points',      3,  4),
    ('5 points',      5,  5),
    ('8 points',      8,  6),
    ('13 points',     13, 7),
    ('21 points',     21, 8);

COMMIT TRANSACTION;
PRINT 'Vision MSSQL database schema created and seeded successfully.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
