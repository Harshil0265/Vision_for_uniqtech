IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113103341_InitialCreate'
)
BEGIN
    CREATE TABLE [KanbanColumns] (
        [Id] nvarchar(50) NOT NULL,
        [Name] nvarchar(max) NOT NULL,
        [WipLimit] int NOT NULL,
        [Color] nvarchar(max) NOT NULL,
        [Category] nvarchar(max) NOT NULL,
        [DisplayOrder] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_KanbanColumns] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113103341_InitialCreate'
)
BEGIN
    CREATE TABLE [Users] (
        [Id] uniqueidentifier NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [Email] nvarchar(320) NOT NULL,
        [Avatar] nvarchar(max) NOT NULL,
        [Role] nvarchar(max) NOT NULL,
        [Department] nvarchar(max) NOT NULL,
        [Status] nvarchar(max) NOT NULL,
        [PasswordHash] nvarchar(256) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Users] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113103341_InitialCreate'
)
BEGIN
    CREATE TABLE [Notifications] (
        [Id] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [Title] nvarchar(max) NOT NULL,
        [Message] nvarchar(max) NOT NULL,
        [Timestamp] datetime2 NOT NULL,
        [Read] bit NOT NULL,
        [Type] nvarchar(max) NOT NULL,
        [IssueKey] nvarchar(max) NULL,
        [AuthorId] uniqueidentifier NULL,
        CONSTRAINT [PK_Notifications] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Notifications_Users_AuthorId] FOREIGN KEY ([AuthorId]) REFERENCES [Users] ([Id]) ON DELETE SET NULL,
        CONSTRAINT [FK_Notifications_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113103341_InitialCreate'
)
BEGIN
    CREATE TABLE [Projects] (
        [Id] uniqueidentifier NOT NULL,
        [Name] nvarchar(max) NOT NULL,
        [Key] nvarchar(10) NOT NULL,
        [Description] nvarchar(max) NOT NULL,
        [LeadId] uniqueidentifier NOT NULL,
        [Template] nvarchar(max) NOT NULL,
        [DefaultAssignee] nvarchar(max) NOT NULL,
        [IconGradient] nvarchar(max) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Projects] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Projects_Users_LeadId] FOREIGN KEY ([LeadId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113103341_InitialCreate'
)
BEGIN
    CREATE TABLE [RefreshTokens] (
        [Id] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [Token] nvarchar(450) NOT NULL,
        [ExpiresAt] datetime2 NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [RevokedAt] datetime2 NULL,
        CONSTRAINT [PK_RefreshTokens] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_RefreshTokens_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113103341_InitialCreate'
)
BEGIN
    CREATE TABLE [ProjectAllowedIssueTypes] (
        [Id] int NOT NULL IDENTITY,
        [ProjectId] uniqueidentifier NOT NULL,
        [IssueType] nvarchar(max) NOT NULL,
        CONSTRAINT [PK_ProjectAllowedIssueTypes] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ProjectAllowedIssueTypes_Projects_ProjectId] FOREIGN KEY ([ProjectId]) REFERENCES [Projects] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113103341_InitialCreate'
)
BEGIN
    CREATE TABLE [Sprints] (
        [Id] uniqueidentifier NOT NULL,
        [ProjectId] uniqueidentifier NOT NULL,
        [Name] nvarchar(max) NOT NULL,
        [Goal] nvarchar(max) NOT NULL,
        [StartDate] datetime2 NOT NULL,
        [EndDate] datetime2 NOT NULL,
        [Status] nvarchar(max) NOT NULL,
        [CompletedAt] datetime2 NULL,
        [PlannedPoints] int NOT NULL,
        [CompletedPoints] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Sprints] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Sprints_Projects_ProjectId] FOREIGN KEY ([ProjectId]) REFERENCES [Projects] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113103341_InitialCreate'
)
BEGIN
    CREATE TABLE [Issues] (
        [Id] uniqueidentifier NOT NULL,
        [Key] nvarchar(20) NOT NULL,
        [ProjectId] uniqueidentifier NOT NULL,
        [Title] nvarchar(max) NOT NULL,
        [Description] nvarchar(max) NOT NULL,
        [Type] nvarchar(max) NOT NULL,
        [Priority] nvarchar(max) NOT NULL,
        [Status] nvarchar(max) NOT NULL,
        [AssigneeId] uniqueidentifier NULL,
        [ReporterId] uniqueidentifier NOT NULL,
        [SprintId] uniqueidentifier NULL,
        [StoryPoints] int NOT NULL,
        [EpicKey] nvarchar(max) NULL,
        [EpicTitle] nvarchar(max) NULL,
        [DueDate] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Issues] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Issues_Projects_ProjectId] FOREIGN KEY ([ProjectId]) REFERENCES [Projects] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Issues_Sprints_SprintId] FOREIGN KEY ([SprintId]) REFERENCES [Sprints] ([Id]) ON DELETE SET NULL,
        CONSTRAINT [FK_Issues_Users_AssigneeId] FOREIGN KEY ([AssigneeId]) REFERENCES [Users] ([Id]) ON DELETE SET NULL,
        CONSTRAINT [FK_Issues_Users_ReporterId] FOREIGN KEY ([ReporterId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113103341_InitialCreate'
)
BEGIN
    CREATE TABLE [Activities] (
        [Id] uniqueidentifier NOT NULL,
        [IssueId] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [Action] nvarchar(max) NOT NULL,
        [Details] nvarchar(max) NULL,
        [Timestamp] datetime2 NOT NULL,
        CONSTRAINT [PK_Activities] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Activities_Issues_IssueId] FOREIGN KEY ([IssueId]) REFERENCES [Issues] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Activities_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113103341_InitialCreate'
)
BEGIN
    CREATE TABLE [Comments] (
        [Id] uniqueidentifier NOT NULL,
        [IssueId] uniqueidentifier NOT NULL,
        [AuthorId] uniqueidentifier NOT NULL,
        [Content] nvarchar(max) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Comments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Comments_Issues_IssueId] FOREIGN KEY ([IssueId]) REFERENCES [Issues] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Comments_Users_AuthorId] FOREIGN KEY ([AuthorId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113103341_InitialCreate'
)
BEGIN
    CREATE TABLE [IssueLabels] (
        [Id] int NOT NULL IDENTITY,
        [IssueId] uniqueidentifier NOT NULL,
        [Label] nvarchar(max) NOT NULL,
        CONSTRAINT [PK_IssueLabels] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_IssueLabels_Issues_IssueId] FOREIGN KEY ([IssueId]) REFERENCES [Issues] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113103341_InitialCreate'
)
BEGIN
    CREATE TABLE [Subtasks] (
        [Id] uniqueidentifier NOT NULL,
        [IssueId] uniqueidentifier NOT NULL,
        [Title] nvarchar(max) NOT NULL,
        [Completed] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Subtasks] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Subtasks_Issues_IssueId] FOREIGN KEY ([IssueId]) REFERENCES [Issues] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113103341_InitialCreate'
)
BEGIN
    CREATE TABLE [CommentMentions] (
        [Id] int NOT NULL IDENTITY,
        [CommentId] uniqueidentifier NOT NULL,
        [MentionedText] nvarchar(max) NOT NULL,
        CONSTRAINT [PK_CommentMentions] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_CommentMentions_Comments_CommentId] FOREIGN KEY ([CommentId]) REFERENCES [Comments] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113103341_InitialCreate'
)
BEGIN
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'Category', N'Color', N'CreatedAt', N'DisplayOrder', N'Name', N'UpdatedAt', N'WipLimit') AND [object_id] = OBJECT_ID(N'[KanbanColumns]'))
        SET IDENTITY_INSERT [KanbanColumns] ON;
    EXEC(N'INSERT INTO [KanbanColumns] ([Id], [Category], [Color], [CreatedAt], [DisplayOrder], [Name], [UpdatedAt], [WipLimit])
    VALUES (N''backlog'', N''todo'', N''#64748b'', ''2026-11-13T10:33:40.4037434Z'', 1, N''Backlog'', ''2026-11-13T10:33:40.4037434Z'', 0),
    (N''done'', N''done'', N''#059669'', ''2026-11-13T10:33:40.4037434Z'', 4, N''Done'', ''2026-11-13T10:33:40.4037434Z'', 0),
    (N''in_progress'', N''in_progress'', N''#d97706'', ''2026-11-13T10:33:40.4037434Z'', 3, N''In Progress'', ''2026-11-13T10:33:40.4037434Z'', 4),
    (N''todo'', N''todo'', N''#2563eb'', ''2026-11-13T10:33:40.4037434Z'', 2, N''To Do'', ''2026-11-13T10:33:40.4037434Z'', 8)');
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'Category', N'Color', N'CreatedAt', N'DisplayOrder', N'Name', N'UpdatedAt', N'WipLimit') AND [object_id] = OBJECT_ID(N'[KanbanColumns]'))
        SET IDENTITY_INSERT [KanbanColumns] OFF;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113103341_InitialCreate'
)
BEGIN
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'Avatar', N'CreatedAt', N'Department', N'Email', N'Name', N'PasswordHash', N'Role', N'Status', N'UpdatedAt') AND [object_id] = OBJECT_ID(N'[Users]'))
        SET IDENTITY_INSERT [Users] ON;
    EXEC(N'INSERT INTO [Users] ([Id], [Avatar], [CreatedAt], [Department], [Email], [Name], [PasswordHash], [Role], [Status], [UpdatedAt])
    VALUES (''00000000-0000-0000-0000-000000000001'', N''https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'', ''2026-11-13T10:33:40.4037434Z'', N''Platform Systems'', N''sarah.jenkins@vision.dev'', N''Sarah Jenkins'', N''$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIpWy7p5fq'', N''Staff Product Manager'', N''online'', ''2026-11-13T10:33:40.4037434Z''),
    (''00000000-0000-0000-0000-000000000002'', N''https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'', ''2026-11-13T10:33:40.4037434Z'', N''Engineering'', N''alex.rivera@vision.dev'', N''Alex Rivera'', N''$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIpWy7p5fq'', N''Principal Architect'', N''online'', ''2026-11-13T10:33:40.4037434Z'')');
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'Avatar', N'CreatedAt', N'Department', N'Email', N'Name', N'PasswordHash', N'Role', N'Status', N'UpdatedAt') AND [object_id] = OBJECT_ID(N'[Users]'))
        SET IDENTITY_INSERT [Users] OFF;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113103341_InitialCreate'
)
BEGIN
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'CreatedAt', N'DefaultAssignee', N'Description', N'IconGradient', N'Key', N'LeadId', N'Name', N'Template', N'UpdatedAt') AND [object_id] = OBJECT_ID(N'[Projects]'))
        SET IDENTITY_INSERT [Projects] ON;
    EXEC(N'INSERT INTO [Projects] ([Id], [CreatedAt], [DefaultAssignee], [Description], [IconGradient], [Key], [LeadId], [Name], [Template], [UpdatedAt])
    VALUES (''10000000-0000-0000-0000-000000000001'', ''2026-11-13T10:33:40.4037434Z'', N''unassigned'', N''Core platform development'', N''from-blue-600 to-sky-500'', N''OP'', ''00000000-0000-0000-0000-000000000002'', N''Platform Engineering'', N''Scrum'', ''2026-11-13T10:33:40.4037434Z'')');
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'CreatedAt', N'DefaultAssignee', N'Description', N'IconGradient', N'Key', N'LeadId', N'Name', N'Template', N'UpdatedAt') AND [object_id] = OBJECT_ID(N'[Projects]'))
        SET IDENTITY_INSERT [Projects] OFF;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113103341_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Activities_IssueId] ON [Activities] ([IssueId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113103341_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Activities_UserId] ON [Activities] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113103341_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_CommentMentions_CommentId] ON [CommentMentions] ([CommentId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113103341_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Comments_AuthorId] ON [Comments] ([AuthorId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113103341_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Comments_IssueId] ON [Comments] ([IssueId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113103341_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_IssueLabels_IssueId] ON [IssueLabels] ([IssueId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113103341_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Issues_AssigneeId] ON [Issues] ([AssigneeId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113103341_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Issues_Key] ON [Issues] ([Key]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113103341_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Issues_ProjectId] ON [Issues] ([ProjectId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113103341_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Issues_ReporterId] ON [Issues] ([ReporterId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113103341_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Issues_SprintId] ON [Issues] ([SprintId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113103341_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Notifications_AuthorId] ON [Notifications] ([AuthorId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113103341_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Notifications_UserId] ON [Notifications] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113103341_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_ProjectAllowedIssueTypes_ProjectId] ON [ProjectAllowedIssueTypes] ([ProjectId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113103341_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Projects_Key] ON [Projects] ([Key]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113103341_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Projects_LeadId] ON [Projects] ([LeadId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113103341_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_RefreshTokens_Token] ON [RefreshTokens] ([Token]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113103341_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_RefreshTokens_UserId] ON [RefreshTokens] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113103341_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Sprints_ProjectId] ON [Sprints] ([ProjectId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113103341_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Subtasks_IssueId] ON [Subtasks] ([IssueId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113103341_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Users_Email] ON [Users] ([Email]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113103341_InitialCreate'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261113103341_InitialCreate', N'8.0.11');
END;
GO

COMMIT;
GO

