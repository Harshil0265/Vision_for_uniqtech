# Implementation Plan: .NET Core Migration

## Overview

This implementation plan guides the migration of the Vision project management application from Node.js/Express with Clerk authentication to .NET Core backend with MSSQL database and custom JWT authentication. The migration follows a phased approach focusing first on cleanup and preparation, followed by .NET project setup, database implementation, API development, and frontend integration.

The implementation is structured to build incrementally, with each task producing working code that can be validated before proceeding to the next phase.

## Tasks

### Phase 1: Backend Cleanup and Preparation

- [x] 1. Remove Node.js backend infrastructure
  - [x] 1.1 Delete Node.js server file and Clerk authentication components
    - Remove `server.ts` from project root
    - Remove `src/components/ClerkAuthModal.tsx`
    - Remove `src/components/AuthWrapper.tsx`
    - Remove `.env.example` file
    - _Requirements: 1.1, 1.3, 5.1, 5.2, 5.3_

  - [x] 1.2 Clean up package.json dependencies
    - Remove Node.js server dependencies: express, @clerk/express, tsx, dotenv
    - Remove Clerk frontend dependencies: @clerk/clerk-react
    - Remove Node.js type definitions: @types/express, @types/node
    - Update scripts section to remove server-related commands (dev, start)
    - Add frontend-only dev script: "dev": "vite"
    - Retain all React frontend dependencies (react, react-dom, vite, tailwindcss, lucide-react, motion)
    - _Requirements: 1.2, 1.4, 1.5, 1.6, 1.7_

- [~] 2. Checkpoint - Verify cleanup completion
  - Ensure all Node.js backend code is removed
  - Verify package.json only contains frontend dependencies
  - Ask the user if questions arise

### Phase 2: .NET Project Structure Setup

- [x] 3. Create .NET solution and project structure
  - [x] 3.1 Create backend directory and solution file
    - Create `backend` directory in project root
    - Create `Vision.sln` solution file using `dotnet new sln`
    - _Requirements: 2.1_

  - [x] 3.2 Create Vision.API project
    - Create ASP.NET Core Web API project targeting .NET 8.0
    - Add project to solution
    - Create folder structure: Controllers, Models, Middleware
    - _Requirements: 2.2, 2.7_

  - [x] 3.3 Create Vision.Business project
    - Create .NET Class Library targeting .NET 8.0
    - Add project to solution
    - Create folder structure: Services, DTOs, Validators, Exceptions
    - _Requirements: 2.3, 2.8_

  - [x] 3.4 Create Vision.Data project
    - Create .NET Class Library targeting .NET 8.0
    - Add project to solution
    - Create folder structure: Entities, Repositories, Migrations
    - _Requirements: 2.4, 2.9_

  - [x] 3.5 Configure project references
    - Add Vision.Business reference to Vision.API
    - Add Vision.Data reference to Vision.Business
    - _Requirements: 2.5, 2.6_

- [x] 4. Install NuGet packages
  - [x] 4.1 Install Entity Framework Core packages in Vision.Data
    - Microsoft.EntityFrameworkCore.SqlServer (8.0+)
    - Microsoft.EntityFrameworkCore.Tools (8.0+)
    - Microsoft.EntityFrameworkCore.Design (8.0+)
    - _Requirements: 4.1, 4.2_

  - [x] 4.2 Install authentication packages in Vision.API
    - Microsoft.AspNetCore.Authentication.JwtBearer (8.0+)
    - System.IdentityModel.Tokens.Jwt (7.0+)
    - _Requirements: 5.4, 5.5_

  - [x] 4.3 Install additional dependencies
    - BCrypt.Net-Next in Vision.Business (for password hashing)
    - FluentValidation.AspNetCore in Vision.Business (for input validation)
    - Swashbuckle.AspNetCore in Vision.API (for API documentation)
    - Serilog.AspNetCore in Vision.API (for logging)
    - _Requirements: 5.8, 9.8, 14.1, 11.3_

- [~] 5. Checkpoint - Verify project structure
  - Ensure all projects are created and properly referenced
  - Verify all NuGet packages are installed
  - Ensure solution builds successfully
  - Ask the user if questions arise

### Phase 3: Database Entity Models

- [ ] 6. Create core entity classes
  - [x] 6.1 Create User entity
    - Define User entity with all properties (Id, Name, Email, Avatar, Role, Department, Status, PasswordHash, timestamps)
    - Add navigation properties for relationships
    - _Requirements: 3.1, 3.14_

  - [x] 6.2 Create RefreshToken entity
    - Define RefreshToken entity with properties (Id, UserId, Token, ExpiresAt, CreatedAt, RevokedAt)
    - Add navigation property to User
    - _Requirements: 3.13, 3.14_

  - [x] 6.3 Create Project entity
    - Define Project entity with all properties (Id, Name, Key, Description, LeadId, Template, etc.)
    - Add navigation properties for Lead and collections
    - _Requirements: 3.2, 3.14_

  - [x] 6.4 Create ProjectAllowedIssueType entity
    - Define ProjectAllowedIssueType entity with properties (Id, ProjectId, IssueType)
    - Add navigation property to Project
    - _Requirements: 3.3, 3.14_

  - [x] 6.5 Create Sprint entity
    - Define Sprint entity with all properties (Id, ProjectId, Name, Goal, dates, Status, points, timestamps)
    - Add navigation properties for Project and Issues
    - _Requirements: 3.4, 3.14_

  - [~] 6.6 Create Issue entity
    - Define Issue entity with all properties (Id, Key, ProjectId, Title, Description, Type, Priority, Status, etc.)
    - Add navigation properties for Project, Assignee, Reporter, Sprint, and collections
    - _Requirements: 3.5, 3.14_

  - [~] 6.7 Create IssueLabel entity
    - Define IssueLabel entity with properties (Id, IssueId, Label)
    - Add navigation property to Issue
    - _Requirements: 3.6, 3.14_

  - [~] 6.8 Create Subtask entity
    - Define Subtask entity with properties (Id, IssueId, Title, Completed, timestamps)
    - Add navigation property to Issue
    - _Requirements: 3.7, 3.14_

  - [~] 6.9 Create Comment entity
    - Define Comment entity with properties (Id, IssueId, AuthorId, Content, timestamps)
    - Add navigation properties for Issue, Author, and Mentions collection
    - _Requirements: 3.8, 3.14_

  - [~] 6.10 Create CommentMention entity
    - Define CommentMention entity with properties (Id, CommentId, MentionedText)
    - Add navigation property to Comment
    - _Requirements: 3.9, 3.14_

  - [~] 6.11 Create Activity entity
    - Define Activity entity with properties (Id, IssueId, UserId, Action, Details, Timestamp)
    - Add navigation properties for Issue and User
    - _Requirements: 3.10, 3.14_

  - [~] 6.12 Create KanbanColumn entity
    - Define KanbanColumn entity with properties (Id, Name, WipLimit, Color, Category, DisplayOrder, timestamps)
    - _Requirements: 3.11, 3.14_

  - [~] 6.13 Create Notification entity
    - Define Notification entity with properties (Id, UserId, Title, Message, Timestamp, Read, Type, IssueKey, AuthorId)
    - Add navigation properties for User and Author
    - _Requirements: 3.12, 3.14_

- [~] 7. Checkpoint - Verify entity models
  - Ensure all entity classes are created with correct properties
  - Verify navigation properties are properly defined
  - Ensure project builds successfully
  - Ask the user if questions arise

### Phase 4: DbContext and Database Configuration

- [ ] 8. Create and configure VisionDbContext
  - [~] 8.1 Create VisionDbContext class
    - Create DbContext class inheriting from DbContext
    - Define DbSet properties for all entity types
    - _Requirements: 3.15, 4.3_

  - [~] 8.2 Configure entity relationships using Fluent API
    - Override OnModelCreating method
    - Configure User entity: unique index on Email, property constraints
    - Configure Project entity: unique index on Key, foreign key to User (Lead) with Restrict delete
    - Configure ProjectAllowedIssueType: foreign key to Project with Cascade delete
    - Configure Sprint: foreign key to Project with Cascade delete
    - Configure Issue: unique index on Key, foreign keys with appropriate delete behaviors
    - Configure IssueLabel: foreign key to Issue with Cascade delete
    - Configure Subtask: foreign key to Issue with Cascade delete
    - Configure Comment: foreign keys to Issue and Author with appropriate delete behaviors
    - Configure CommentMention: foreign key to Comment with Cascade delete
    - Configure Activity: foreign keys to Issue and User with appropriate delete behaviors
    - Configure KanbanColumn: configure string-based primary key
    - Configure Notification: foreign keys to User and Author with appropriate delete behaviors
    - Configure RefreshToken: unique index on Token, foreign key to User with Cascade delete
    - _Requirements: 3.15, 3.16, 4.4_

  - [~] 8.3 Create indexes for performance
    - Create index on Users.Email
    - Create index on Projects.Key
    - Create index on Issues.Key
    - Create indexes on all foreign key columns
    - _Requirements: 3.17_

- [ ] 9. Create database seed data
  - [~] 9.1 Implement seed data method in VisionDbContext
    - Create SeedData method in OnModelCreating
    - Generate bcrypt password hashes for default password "Password123!"
    - _Requirements: 7.1, 7.15_

  - [~] 9.2 Seed Users table
    - Seed 6 team members with consistent GUIDs
    - Include: Sarah Jenkins, Alex Rivera, Morgan Chen, Jamie Park, Taylor Brooks, Jordan Lee
    - _Requirements: 7.2_

  - [~] 9.3 Seed Projects table
    - Seed 3 projects: Operation Phoenix, Mobile Experience, Security Initiative
    - Include all project properties and assign leads
    - _Requirements: 7.3_

  - [~] 9.4 Seed ProjectAllowedIssueTypes table
    - Seed allowed issue types for each project
    - _Requirements: 7.13_

  - [~] 9.5 Seed Sprints table
    - Seed 4 sprints with appropriate project associations
    - _Requirements: 7.4_

  - [~] 9.6 Seed Issues table
    - Seed 9 issues with full details
    - Include all properties: key, title, description, type, priority, status, etc.
    - _Requirements: 7.5_

  - [~] 9.7 Seed IssueLabels table
    - Extract and seed labels from issues
    - _Requirements: 7.12_

  - [~] 9.8 Seed Subtasks table
    - Seed all subtasks associated with issues
    - _Requirements: 7.6_

  - [~] 9.9 Seed Comments table
    - Seed all comments with author associations
    - _Requirements: 7.7_

  - [~] 9.10 Seed CommentMentions table
    - Extract mentions from comment content
    - _Requirements: 7.8_

  - [~] 9.11 Seed Activities table
    - Seed all activity items with user and issue associations
    - _Requirements: 7.9_

  - [~] 9.12 Seed KanbanColumns table
    - Seed 6 columns: backlog, todo, in-progress, in-review, testing, done
    - _Requirements: 7.10_

  - [~] 9.13 Seed Notifications table
    - Seed 4 notifications with appropriate user associations
    - _Requirements: 7.11_

- [~] 10. Checkpoint - Verify DbContext configuration
  - Ensure all entities are configured in DbContext
  - Verify seed data is properly defined
  - Ensure project builds successfully
  - Ask the user if questions arise

### Phase 5: Configuration and Initial Migration

- [ ] 11. Create configuration files
  - [~] 11.1 Create appsettings.json
    - Add ConnectionStrings section with placeholder for DefaultConnection
    - Add Jwt section: Secret, Issuer, Audience, AccessTokenExpirationMinutes (15), RefreshTokenExpirationDays (7)
    - Add Logging section with appropriate log levels
    - Add AllowedHosts configuration
    - Add Cors section with AllowedOrigins array
    - _Requirements: 4.7, 13.1, 13.4, 13.5, 13.6_

  - [~] 11.2 Create appsettings.Development.json
    - Configure LocalDB connection string for local development
    - Set development-appropriate logging levels
    - _Requirements: 4.8, 13.2_

  - [~] 11.3 Create appsettings.Production.json
    - Set production-appropriate logging levels
    - _Requirements: 13.3_

  - [~] 11.4 Create strongly-typed configuration classes
    - Create JwtSettings class for JWT configuration
    - Create CorsSettings class for CORS configuration
    - _Requirements: 13.9_

- [ ] 12. Configure dependency injection in Program.cs
  - [~] 12.1 Register DbContext with connection string
    - Configure VisionDbContext with SQL Server provider
    - Read connection string from appsettings.json
    - _Requirements: 2.10, 4.6_

  - [~] 12.2 Configure JWT authentication
    - Configure JWT bearer authentication with validation parameters
    - Set token validation parameters: ValidateIssuer, ValidateAudience, ValidateLifetime, ValidateIssuerSigningKey
    - Configure secret key from appsettings (use user secrets for development)
    - _Requirements: 5.6, 9.6, 9.7, 10.7_

  - [~] 12.3 Configure CORS
    - Add CORS policy allowing requests from frontend URL (http://localhost:5173)
    - Allow credentials, GET, POST, PUT, DELETE methods, and Authorization header
    - _Requirements: 9.1, 9.2_

  - [~] 12.4 Configure additional middleware
    - Add Swagger/OpenAPI configuration for development environment
    - Add Serilog for structured logging
    - Add response compression
    - Add global exception handling middleware
    - Add request logging middleware
    - _Requirements: 11.1, 11.3, 11.4, 14.2, 14.3, 15.2_

  - [~] 12.5 Register configuration options
    - Register JwtSettings using IOptions pattern
    - Register CorsSettings using IOptions pattern
    - Validate required configuration at startup
    - _Requirements: 13.7, 13.8, 13.10_

- [ ] 13. Create initial database migration
  - [~] 13.1 Generate initial migration
    - Run `dotnet ef migrations add InitialCreate --project Vision.Data --startup-project Vision.API`
    - Review generated migration for correctness
    - _Requirements: 4.5_

  - [~] 13.2 Create database and apply migration
    - Run `dotnet ef database update --project Vision.Data --startup-project Vision.API`
    - Verify database is created with all tables and seed data
    - _Requirements: 10.4_

- [~] 14. Checkpoint - Verify configuration and database
  - Ensure all configuration files are created
  - Verify database is created with correct schema
  - Verify seed data is present in database tables
  - Ensure application starts without errors
  - Ask the user if questions arise

### Phase 6: Repository Pattern Implementation

- [ ] 15. Create repository interfaces and implementations
  - [~] 15.1 Create generic repository interface and implementation
    - Create IRepository<T> interface with CRUD operations
    - Create Repository<T> base class with async implementations
    - _Requirements: 4.9_

  - [~] 15.2 Create User repository
    - Create IUserRepository interface extending IRepository<User>
    - Add method: GetByEmailAsync(string email)
    - Add method: EmailExistsAsync(string email)
    - Create UserRepository implementation
    - _Requirements: 4.10_

  - [~] 15.3 Create Project repository
    - Create IProjectRepository interface extending IRepository<Project>
    - Add method: GetByKeyAsync(string key)
    - Add method: GetWithLeadAsync(Guid id)
    - Add method: GetAllWithLeadAsync()
    - Create ProjectRepository implementation with eager loading for Lead
    - _Requirements: 4.10, 15.3_

  - [~] 15.4 Create Issue repository
    - Create IIssueRepository interface extending IRepository<Issue>
    - Add method: GetByKeyAsync(string key)
    - Add method: GetWithDetailsAsync(Guid id) - includes assignee, reporter, subtasks, comments, activities
    - Add method: GetFilteredAsync(projectId, sprintId, assigneeId, status, type)
    - Create IssueRepository implementation with eager loading
    - _Requirements: 4.10, 15.3_

  - [~] 15.5 Create Sprint repository
    - Create ISprintRepository interface extending IRepository<Sprint>
    - Add method: GetByProjectIdAsync(Guid projectId)
    - Add method: GetActiveByProjectIdAsync(Guid projectId)
    - Create SprintRepository implementation
    - _Requirements: 4.10_

  - [~] 15.6 Create supporting entity repositories
    - Create IKanbanColumnRepository and implementation
    - Create INotificationRepository and implementation with GetByUserIdAsync method
    - Create IRefreshTokenRepository and implementation with GetByTokenAsync and RevokeTokenAsync methods
    - _Requirements: 4.10_

  - [~] 15.7 Register repositories in dependency injection
    - Register all repository interfaces and implementations in Program.cs
    - Use scoped lifetime for repositories
    - _Requirements: 2.10_

- [~] 16. Checkpoint - Verify repository pattern
  - Ensure all repositories are created and registered
  - Verify repository methods compile correctly
  - Ensure application builds successfully
  - Ask the user if questions arise

### Phase 7: Authentication Service and Business Logic

- [ ] 17. Create authentication service
  - [~] 17.1 Create IAuthService interface
    - Define methods: RegisterAsync, LoginAsync, RefreshTokenAsync, RevokeTokenAsync, ValidateTokenAsync, GetCurrentUserAsync
    - _Requirements: 5.7_

  - [~] 17.2 Implement AuthService class
    - Inject IUserRepository and IRefreshTokenRepository
    - Inject IConfiguration for JWT settings
    - Inject ILogger for logging
    - _Requirements: 5.8_

  - [~] 17.3 Implement user registration
    - Validate email uniqueness
    - Validate password strength (minimum 8 characters)
    - Hash password using BCrypt with salt rounds of 12
    - Create user entity and save to database
    - Log registration attempts
    - _Requirements: 5.9, 5.10, 9.10, 11.5_

  - [~] 17.4 Implement user login
    - Validate credentials against database
    - Verify password using BCrypt
    - Generate JWT access token with 15-minute expiration
    - Generate refresh token with 7-day expiration
    - Include claims: UserId, Email, Name, Role, Expiration
    - Store refresh token in database
    - Log authentication attempts
    - _Requirements: 5.11, 5.12, 5.13, 5.14, 11.5_

  - [~] 17.5 Implement token refresh
    - Validate refresh token exists and not revoked
    - Validate refresh token not expired
    - Generate new JWT access token
    - Generate new refresh token and store in database
    - Revoke old refresh token
    - _Requirements: 5.15_

  - [~] 17.6 Implement token revocation
    - Find refresh token in database
    - Set RevokedAt timestamp
    - Save to database
    - _Requirements: 5.16_

  - [~] 17.7 Register AuthService in dependency injection
    - Register IAuthService and AuthService in Program.cs
    - Use scoped lifetime
    - _Requirements: 2.10_

- [ ] 18. Create DTOs for authentication
  - [~] 18.1 Create authentication request DTOs
    - Create RegisterRequestDto (Name, Email, Password, Role, Department, Avatar)
    - Create LoginRequestDto (Email, Password)
    - Create TokenRefreshDto (RefreshToken)
    - _Requirements: 6.2, 6.3_

  - [~] 18.2 Create authentication response DTOs
    - Create UserDto (Id, Name, Email, Avatar, Role, Department, Status)
    - Create SessionDto (Token, RefreshToken, ExpiresAt)
    - Create LoginResponseDto containing UserDto and SessionDto
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [~] 18.3 Create FluentValidation validators
    - Create RegisterRequestValidator (email format, password strength, required fields)
    - Create LoginRequestValidator (required fields)
    - _Requirements: 9.8_

- [~] 19. Checkpoint - Verify authentication service
  - Ensure AuthService is implemented with all methods
  - Verify DTOs and validators are created
  - Ensure application builds successfully
  - Ask the user if questions arise

### Phase 8: Authentication API Controllers

- [ ] 20. Create AuthController
  - [~] 20.1 Create AuthController class
    - Inject IAuthService
    - Add [ApiController] and [Route("api/auth")] attributes
    - _Requirements: 5.17_

  - [~] 20.2 Implement POST /api/auth/register endpoint
    - Accept RegisterRequestDto
    - Call AuthService.RegisterAsync
    - Return UserDto with SessionDto containing token and expiresAt
    - Return appropriate error responses for validation failures
    - _Requirements: 5.17, 6.2, 11.2_

  - [~] 20.3 Implement POST /api/auth/login endpoint
    - Accept LoginRequestDto
    - Call AuthService.LoginAsync
    - Return UserDto with SessionDto containing token and expiresAt
    - Return 401 for invalid credentials
    - _Requirements: 5.17, 6.3, 11.2_

  - [~] 20.4 Implement POST /api/auth/refresh endpoint
    - Accept TokenRefreshDto
    - Call AuthService.RefreshTokenAsync
    - Return new SessionDto with tokens
    - Return 401 for invalid or expired refresh token
    - _Requirements: 5.17_

  - [~] 20.5 Implement POST /api/auth/logout endpoint
    - Accept refresh token in request body
    - Call AuthService.RevokeTokenAsync
    - Return success confirmation
    - _Requirements: 5.17, 6.5_

  - [~] 20.6 Implement GET /api/auth/me endpoint
    - Add [Authorize] attribute
    - Extract user ID from JWT claims
    - Call AuthService.GetCurrentUserAsync
    - Return UserDto with SessionDto
    - Return 401 for invalid or missing token
    - _Requirements: 5.17, 5.18, 6.4_

  - [~] 20.7 Implement GET /api/auth/users endpoint
    - Add [Authorize] attribute
    - Retrieve all users from repository
    - Map to UserDto array
    - Return array of user objects
    - _Requirements: 5.18, 6.1_

- [~] 21. Checkpoint - Verify authentication endpoints
  - Test registration endpoint creates users
  - Test login endpoint returns valid JWT token
  - Test token refresh works with valid refresh token
  - Test protected endpoints require valid token
  - Ask the user if questions arise

### Phase 9: Business Services for Core Entities

- [ ] 22. Create Project service
  - [~] 22.1 Create IProjectService interface and ProjectService implementation
    - Inject IProjectRepository and IUserRepository
    - Define methods: GetAllProjectsAsync, GetProjectByIdAsync, CreateProjectAsync, UpdateProjectAsync, DeleteProjectAsync
    - _Requirements: 2.10_

  - [~] 22.2 Create Project DTOs
    - Create ProjectDto (all project properties plus nested lead UserDto)
    - Create CreateProjectDto (Name, Key, Description, LeadId, Template, DefaultAssignee, IconGradient, AllowedIssueTypes)
    - Create UpdateProjectDto (same as CreateProjectDto)
    - _Requirements: 6.6, 6.7, 6.8, 6.9_

  - [~] 22.3 Implement project service methods
    - Implement GetAllProjectsAsync with eager loading of Lead
    - Implement GetProjectByIdAsync with full details
    - Implement CreateProjectAsync with validation
    - Implement UpdateProjectAsync
    - Implement DeleteProjectAsync
    - Map entities to DTOs
    - _Requirements: 6.6, 6.7, 6.8, 6.9, 6.10_

  - [~] 22.4 Create FluentValidation validators for projects
    - Create CreateProjectValidator (required fields, unique Key, valid LeadId)
    - _Requirements: 9.8_

  - [~] 22.5 Register ProjectService in dependency injection
    - Register IProjectService and ProjectService in Program.cs
    - _Requirements: 2.10_

- [ ] 23. Create Issue service
  - [~] 23.1 Create IIssueService interface and IssueService implementation
    - Inject IIssueRepository, IProjectRepository, IUserRepository, ISprintRepository
    - Define methods: GetFilteredIssuesAsync, GetIssueByIdAsync, CreateIssueAsync, UpdateIssueAsync, DeleteIssueAsync
    - _Requirements: 2.10_

  - [~] 23.2 Create Issue DTOs
    - Create IssueDto (all issue properties plus nested objects)
    - Create SubtaskDto, CommentDto, ActivityDto
    - Create CreateIssueDto (all issue fields plus nested subtasks array)
    - Create UpdateIssueDto (all updatable fields including status)
    - _Requirements: 6.11, 6.12, 6.13, 6.14_

  - [~] 23.3 Implement issue service methods
    - Implement GetFilteredIssuesAsync with query parameters (projectId, sprintId, assigneeId, status, type)
    - Implement GetIssueByIdAsync with eager loading (assignee, reporter, subtasks, comments with author, activities with user)
    - Implement CreateIssueAsync with nested subtasks creation
    - Implement UpdateIssueAsync including status changes and activity logging
    - Implement DeleteIssueAsync
    - Generate issue keys automatically (PROJECT_KEY-###)
    - Map entities to DTOs
    - _Requirements: 6.11, 6.12, 6.13, 6.14, 6.15, 15.5_

  - [~] 23.4 Create FluentValidation validators for issues
    - Create CreateIssueValidator (required fields, valid references)
    - _Requirements: 9.8_

  - [~] 23.5 Register IssueService in dependency injection
    - Register IIssueService and IssueService in Program.cs
    - _Requirements: 2.10_

- [ ] 24. Create Sprint service
  - [~] 24.1 Create ISprintService interface and SprintService implementation
    - Inject ISprintRepository and IProjectRepository
    - Define methods: GetSprintsByProjectIdAsync, CreateSprintAsync, UpdateSprintAsync
    - _Requirements: 2.10_

  - [~] 24.2 Create Sprint DTOs
    - Create SprintDto (all sprint properties)
    - Create CreateSprintDto (Name, Goal, StartDate, EndDate, ProjectId, PlannedPoints)
    - Create UpdateSprintDto (all updatable fields including Status, CompletedPoints)
    - _Requirements: 6.16, 6.17, 6.18_

  - [~] 24.3 Implement sprint service methods
    - Implement GetSprintsByProjectIdAsync with filtering
    - Implement CreateSprintAsync with validation
    - Implement UpdateSprintAsync including completion logic
    - Map entities to DTOs
    - _Requirements: 6.16, 6.17, 6.18_

  - [~] 24.4 Register SprintService in dependency injection
    - Register ISprintService and SprintService in Program.cs
    - _Requirements: 2.10_

- [ ] 25. Create supporting services
  - [~] 25.1 Create KanbanColumn service
    - Create IKanbanColumnService and implementation
    - Create KanbanColumnDto, CreateKanbanColumnDto, UpdateKanbanColumnDto
    - Implement GetAllColumnsAsync, CreateColumnAsync, UpdateColumnAsync
    - _Requirements: 6.19, 6.20, 6.21_

  - [~] 25.2 Create Notification service
    - Create INotificationService and implementation
    - Create NotificationDto
    - Implement GetNotificationsByUserIdAsync with read status filtering
    - Implement MarkAsReadAsync
    - _Requirements: 6.22, 6.23_

  - [~] 25.3 Register supporting services in dependency injection
    - Register all service interfaces and implementations
    - _Requirements: 2.10_

- [~] 26. Checkpoint - Verify business services
  - Ensure all services are implemented and registered
  - Verify DTOs and validators are created
  - Ensure application builds successfully
  - Ask the user if questions arise

### Phase 10: API Controllers for Core Entities

- [ ] 27. Create ProjectsController
  - [~] 27.1 Create ProjectsController class
    - Inject IProjectService
    - Add [ApiController], [Route("api/projects")], and [Authorize] attributes
    - _Requirements: 5.18_

  - [~] 27.2 Implement GET /api/projects endpoint
    - Call ProjectService.GetAllProjectsAsync
    - Return array of projects with nested lead user object
    - _Requirements: 6.6_

  - [~] 27.3 Implement POST /api/projects endpoint
    - Accept CreateProjectDto
    - Call ProjectService.CreateProjectAsync
    - Return created project with 201 status
    - _Requirements: 6.7_

  - [~] 27.4 Implement GET /api/projects/:id endpoint
    - Accept id parameter
    - Call ProjectService.GetProjectByIdAsync
    - Return single project with full details
    - Return 404 if not found
    - _Requirements: 6.8_

  - [~] 27.5 Implement PUT /api/projects/:id endpoint
    - Accept id parameter and UpdateProjectDto
    - Call ProjectService.UpdateProjectAsync
    - Return updated project
    - Return 404 if not found
    - _Requirements: 6.9_

  - [~] 27.6 Implement DELETE /api/projects/:id endpoint
    - Accept id parameter
    - Call ProjectService.DeleteProjectAsync
    - Return success confirmation
    - Return 404 if not found
    - _Requirements: 6.10_

- [ ] 28. Create IssuesController
  - [~] 28.1 Create IssuesController class
    - Inject IIssueService
    - Add [ApiController], [Route("api/issues")], and [Authorize] attributes
    - _Requirements: 5.18_

  - [~] 28.2 Implement GET /api/issues endpoint
    - Accept query parameters: projectId, sprintId, assigneeId, status, type
    - Call IssueService.GetFilteredIssuesAsync
    - Return filtered array of issues
    - _Requirements: 6.11_

  - [~] 28.3 Implement POST /api/issues endpoint
    - Accept CreateIssueDto with nested subtasks array
    - Call IssueService.CreateIssueAsync
    - Return created issue with 201 status
    - _Requirements: 6.12_

  - [~] 28.4 Implement GET /api/issues/:id endpoint
    - Accept id parameter
    - Call IssueService.GetIssueByIdAsync
    - Return issue with nested assignee, reporter, subtasks, comments with author, activities with user
    - Return 404 if not found
    - _Requirements: 6.13_

  - [~] 28.5 Implement PUT /api/issues/:id endpoint
    - Accept id parameter and UpdateIssueDto
    - Call IssueService.UpdateIssueAsync
    - Handle status changes with activity logging
    - Return updated issue
    - Return 404 if not found
    - _Requirements: 6.14_

  - [~] 28.6 Implement DELETE /api/issues/:id endpoint
    - Accept id parameter
    - Call IssueService.DeleteIssueAsync
    - Return success confirmation
    - Return 404 if not found
    - _Requirements: 6.15_

- [ ] 29. Create SprintsController
  - [~] 29.1 Create SprintsController class
    - Inject ISprintService
    - Add [ApiController], [Route("api/sprints")], and [Authorize] attributes
    - _Requirements: 5.18_

  - [~] 29.2 Implement GET /api/sprints endpoint
    - Accept query parameter: projectId
    - Call SprintService.GetSprintsByProjectIdAsync
    - Return filtered array of sprints
    - _Requirements: 6.16_

  - [~] 29.3 Implement POST /api/sprints endpoint
    - Accept CreateSprintDto
    - Call SprintService.CreateSprintAsync
    - Return created sprint with 201 status
    - _Requirements: 6.17_

  - [~] 29.4 Implement PUT /api/sprints/:id endpoint
    - Accept id parameter and UpdateSprintDto
    - Call SprintService.UpdateSprintAsync
    - Return updated sprint
    - Return 404 if not found
    - _Requirements: 6.18_

- [ ] 30. Create supporting controllers
  - [~] 30.1 Create KanbanColumnsController
    - Implement GET /api/kanban-columns (return array of columns)
    - Implement POST /api/kanban-columns (create column)
    - Implement PUT /api/kanban-columns/:id (update column)
    - Add [Authorize] attribute to all endpoints
    - _Requirements: 6.19, 6.20, 6.21_

  - [~] 30.2 Create NotificationsController
    - Implement GET /api/notifications (filter by userId and read status)
    - Implement PUT /api/notifications/:id/read (mark as read)
    - Add [Authorize] attribute to all endpoints
    - _Requirements: 6.22, 6.23_

- [~] 31. Checkpoint - Verify API controllers
  - Test all CRUD endpoints for projects, issues, and sprints
  - Verify query filtering works correctly
  - Test error handling (404, 401, validation errors)
  - Ensure all endpoints require valid JWT token
  - Ask the user if questions arise

### Phase 11: Middleware and Error Handling

- [ ] 32. Create custom middleware
  - [~] 32.1 Create GlobalExceptionMiddleware
    - Catch all unhandled exceptions
    - Return standardized error response (success: false, error, statusCode)
    - Log exception details with severity
    - Do not expose internal exception details in production
    - _Requirements: 11.1, 11.2, 11.9_

  - [~] 32.2 Create RequestLoggingMiddleware
    - Log all incoming HTTP requests
    - Include method, path, status code, and duration
    - Use structured logging with Serilog
    - _Requirements: 11.4_

  - [~] 32.3 Create RateLimitingMiddleware
    - Restrict authentication endpoints to 5 requests per minute per IP
    - Return 429 Too Many Requests when limit exceeded
    - _Requirements: 9.5_

  - [~] 32.4 Register middleware in Program.cs
    - Add middleware to request pipeline in correct order
    - _Requirements: 11.1_

- [ ] 33. Create custom exceptions and error responses
  - [~] 33.1 Create domain exception classes
    - Create BusinessException base class
    - Create ValidationException for business rule violations
    - Create NotFoundException for missing entities
    - Create ConflictException for conflicts
    - _Requirements: 11.7_

  - [~] 33.2 Create standardized response models
    - Create ApiResponse<T> class (success, data)
    - Create ApiError class (success, error, statusCode, timestamp)
    - _Requirements: 6.25, 6.26, 11.2_

  - [~] 33.3 Map exceptions to HTTP status codes
    - Map ValidationException to 400 Bad Request
    - Map NotFoundException to 404 Not Found
    - Map ConflictException to 409 Conflict
    - Map BusinessException to 400 Bad Request
    - Map unhandled exceptions to 500 Internal Server Error
    - _Requirements: 11.8_

- [ ] 34. Configure logging
  - [~] 34.1 Configure Serilog
    - Add file sink for persistent logging
    - Add console sink for development
    - Configure structured logging format
    - _Requirements: 11.3_

  - [~] 34.2 Add logging to critical paths
    - Log authentication attempts (success/failure)
    - Log database query errors
    - Use severity levels: Information, Warning, Error, Critical
    - _Requirements: 11.5, 11.6, 11.10_

- [~] 35. Checkpoint - Verify middleware and error handling
  - Test global exception handling catches errors
  - Verify standardized error responses
  - Test request logging captures all requests
  - Verify rate limiting on authentication endpoints
  - Ask the user if questions arise

### Phase 12: Security and Performance

- [ ] 36. Implement security measures
  - [~] 36.1 Configure HTTPS and security headers
    - Enable HTTPS redirection in production
    - Configure request size limits
    - _Requirements: 9.3, 9.4_

  - [~] 36.2 Implement input sanitization
    - Configure FluentValidation for all request DTOs
    - Use parameterized queries (Entity Framework handles this)
    - _Requirements: 9.8, 9.9_

  - [~] 36.3 Secure JWT configuration
    - Store JWT secret in user secrets for development
    - Configure minimum 256-bit entropy for secret key
    - Enable issuer and audience validation
    - _Requirements: 9.6, 9.7, 10.7_

  - [~] 36.4 Implement password security
    - Ensure BCrypt cost factor is 12
    - _Requirements: 9.10_

- [ ] 37. Implement performance optimizations
  - [~] 37.1 Configure async operations
    - Ensure all database operations use async/await
    - _Requirements: 15.1_

  - [~] 37.2 Implement eager loading
    - Use Include() for related entities in repositories
    - Avoid N+1 query problems
    - _Requirements: 15.3_

  - [~] 37.3 Configure response compression
    - Enable response compression for JSON payloads
    - _Requirements: 15.2_

  - [~] 37.4 Implement pagination
    - Add pagination support to list endpoints
    - Limit results to maximum 100 items per page
    - Create PaginatedResponseDto
    - _Requirements: 15.5_

  - [~] 37.5 Configure database connection pooling
    - Set minimum 5 and maximum 100 connections
    - _Requirements: 15.6_

  - [~] 37.6 Implement caching
    - Add IMemoryCache for frequently accessed data
    - Cache kanban columns, projects list
    - _Requirements: 15.4_

- [~] 38. Checkpoint - Verify security and performance
  - Test JWT authentication security
  - Verify input validation works correctly
  - Test pagination on list endpoints
  - Verify eager loading prevents N+1 queries
  - Ask the user if questions arise

### Phase 13: API Documentation

- [ ] 39. Configure Swagger/OpenAPI
  - [~] 39.1 Configure Swagger in Program.cs
    - Enable Swagger middleware in development
    - Configure Swagger UI at /swagger endpoint
    - Disable Swagger in production
    - _Requirements: 14.2, 14.3, 14.10_

  - [~] 39.2 Configure JWT authentication in Swagger
    - Add JWT bearer authentication UI component
    - Allow token input in Swagger UI
    - _Requirements: 14.5_

  - [~] 39.3 Add XML documentation comments
    - Document all controller action methods with XML comments
    - Describe purpose, parameters, and return values
    - _Requirements: 14.4_

  - [~] 39.4 Configure Swagger schema generation
    - Generate JSON schema from DTO classes
    - Include data annotation attributes in schema
    - Group endpoints by controller
    - Add example request/response bodies
    - _Requirements: 14.6, 14.7, 14.8, 14.9_

- [~] 40. Checkpoint - Verify API documentation
  - Access Swagger UI in browser
  - Verify all endpoints are documented
  - Test JWT authentication in Swagger
  - Verify request/response schemas are accurate
  - Ask the user if questions arise

### Phase 14: Testing Infrastructure

- [ ] 41. Create test project and configure testing
  - [~] 41.1 Create Vision.Tests project
    - Create xUnit test library targeting .NET 8.0
    - Add references to Vision.API, Vision.Business, Vision.Data
    - _Requirements: 12.1, 12.2_

  - [~] 41.2 Install testing packages
    - Install xUnit, xUnit.runner.visualstudio
    - Install Moq for mocking
    - Install FluentAssertions for assertions
    - Install Microsoft.EntityFrameworkCore.InMemory
    - _Requirements: 12.3, 12.4_

  - [~] 41.3 Create test fixtures and helpers
    - Create WebApplicationFactory for integration tests
    - Create TestDataBuilder for creating test entities
    - Configure in-memory database for tests
    - _Requirements: 12.9, 12.10_

- [ ] 42. Write unit tests for authentication
  - [ ]* 42.1 Write AuthService unit tests
    - Test user registration (success, duplicate email, weak password)
    - Test user login (success, invalid credentials)
    - Test token generation includes correct claims
    - Test password hashing and verification
    - Test token refresh (success, expired token, revoked token)
    - Test token revocation
    - _Requirements: 12.5_

  - [ ]* 42.2 Write repository unit tests
    - Test UserRepository CRUD operations
    - Test ProjectRepository eager loading
    - Test IssueRepository filtering
    - _Requirements: 12.6_

- [ ] 43. Write integration tests for API endpoints
  - [ ]* 43.1 Write AuthController integration tests
    - Test POST /api/auth/register endpoint
    - Test POST /api/auth/login endpoint
    - Test GET /api/auth/me endpoint with valid token
    - Test authentication failure with invalid token
    - Test token refresh endpoint
    - _Requirements: 12.7_

  - [ ]* 43.2 Write ProjectsController integration tests
    - Test GET /api/projects returns all projects
    - Test POST /api/projects creates project
    - Test GET /api/projects/:id returns project
    - Test PUT /api/projects/:id updates project
    - Test DELETE /api/projects/:id removes project
    - Test authorization required for all endpoints
    - _Requirements: 12.8_

  - [ ]* 43.3 Write IssuesController integration tests
    - Test GET /api/issues with filtering
    - Test POST /api/issues creates issue with subtasks
    - Test GET /api/issues/:id returns issue with nested data
    - Test PUT /api/issues/:id updates issue
    - Test DELETE /api/issues/:id removes issue
    - _Requirements: 12.8_

  - [ ]* 43.4 Write SprintsController integration tests
    - Test GET /api/sprints with projectId filter
    - Test POST /api/sprints creates sprint
    - Test PUT /api/sprints/:id updates sprint
    - _Requirements: 12.8_

- [~] 44. Checkpoint - Verify testing infrastructure
  - Run all tests: dotnet test
  - Verify all tests pass
  - Check code coverage if possible
  - Ask the user if questions arise

### Phase 15: Frontend Integration

- [ ] 45. Create custom authentication context in React
  - [~] 45.1 Create AuthContext and provider
    - Create src/context/AuthContext.tsx
    - Manage JWT tokens in localStorage (access token and refresh token)
    - Provide login, logout, register, and currentUser functions
    - _Requirements: 8.3, 8.4_

  - [~] 45.2 Update TypeScript types
    - Remove ClerkSession type from src/types/index.ts
    - Add custom Session type with token, refreshToken, expiresAt
    - Update User type if needed
    - _Requirements: 8.12_

  - [~] 45.3 Create API client configuration
    - Update API base URL to point to .NET API (http://localhost:5000)
    - Create axios instance with interceptors
    - Include Authorization Bearer token header in all authenticated requests
    - Implement token refresh logic before expiration
    - Handle 401 responses by clearing tokens and redirecting to login
    - _Requirements: 8.1, 8.5, 8.6, 8.7_

- [ ] 46. Create authentication UI components
  - [~] 46.1 Create login form component
    - Create src/components/LoginForm.tsx
    - Include fields: email, password
    - Call AuthContext login function
    - Display validation errors
    - _Requirements: 8.8_

  - [~] 46.2 Create registration form component
    - Create src/components/RegisterForm.tsx
    - Include fields: name, email, password, role, department
    - Call AuthContext register function
    - Display validation errors
    - _Requirements: 8.9_

  - [~] 46.3 Update Navbar component
    - Remove Clerk authentication hooks
    - Use custom AuthContext
    - Display user info from AuthContext
    - Add logout button calling AuthContext logout
    - _Requirements: 8.10_

  - [~] 46.4 Verify other components remain unchanged
    - Ensure HomePage, KanbanBoard, BacklogView, ProjectsView, TeamView, etc. remain unchanged
    - _Requirements: 8.11_

- [ ] 47. Update App.tsx with authentication routing
  - [~] 47.1 Wrap application with AuthProvider
    - Import and use AuthContext provider
    - _Requirements: 8.3_

  - [~] 47.2 Implement protected route logic
    - Redirect to login if not authenticated
    - Show loading state while checking authentication
    - _Requirements: 8.6_

- [~] 48. Checkpoint - Verify frontend integration
  - Start frontend dev server (npm run dev)
  - Test login with seeded user credentials
  - Test registration creates new user
  - Test protected routes require authentication
  - Test logout clears tokens
  - Test token refresh works automatically
  - Ask the user if questions arise

### Phase 16: Documentation and Deployment Preparation

- [ ] 49. Create backend documentation
  - [~] 49.1 Create README_BACKEND.md
    - Document prerequisites: .NET 8.0 SDK, SQL Server 2019+ or LocalDB
    - Document connection string configuration
    - Document EF migration commands
    - Document command to run API: dotnet run --project Vision.API
    - Document API URLs: https://localhost:5001 and http://localhost:5000
    - Document JWT secret key setup using user secrets
    - Document initial login credentials for seeded users
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_

  - [~] 49.2 Update main README.md
    - Add architecture overview describing layered .NET backend
    - Update setup instructions for full-stack development
    - Document concurrent execution: frontend (5173), backend (5000)
    - _Requirements: 10.9, 10.12_

  - [~] 49.3 Update .gitignore
    - Add .NET entries: bin/, obj/
    - Add appsettings.Development.json
    - Add user secrets files
    - _Requirements: 10.10_

  - [~] 49.4 Create frontend environment configuration
    - Document .env file with VITE_API_URL=http://localhost:5000
    - _Requirements: 10.11_

- [ ] 50. Create database setup scripts (optional)
  - [~] 50.1 Create SQL scripts for production deployment
    - Export migration SQL script
    - Create rollback scripts
    - Document deployment process

- [~] 51. Final checkpoint - Complete migration verification
  - Start backend API: dotnet run --project backend/Vision.API
  - Start frontend: npm run dev
  - Test complete user flows:
    - User registration and login
    - Create and manage projects
    - Create and manage issues with subtasks
    - Create and manage sprints
    - View kanban board
    - View notifications
    - Team collaboration features
  - Verify all CRUD operations work correctly
  - Verify authentication and authorization
  - Review API documentation in Swagger
  - Run all tests: dotnet test
  - Ask the user if questions arise and confirm migration is complete

## Notes

- Tasks marked with `*` are optional test-related sub-tasks and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and provide opportunities for user feedback
- The implementation follows a phased approach: cleanup → setup → database → services → API → frontend
- All datetime values are stored and returned in UTC and formatted as ISO 8601
- Password hashing uses BCrypt with cost factor 12 for security
- JWT access tokens expire after 15 minutes; refresh tokens expire after 7 days
- All endpoints except authentication require valid JWT token
- Connection string should be configured in appsettings.json or user secrets
- For local development, LocalDB is recommended for simplicity
- The migration preserves existing React frontend components except authentication-related components
- Testing infrastructure is established but test implementation is optional for MVP

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["3.1"] },
    { "id": 2, "tasks": ["3.2", "3.3", "3.4"] },
    { "id": 3, "tasks": ["3.5", "4.1", "4.2", "4.3"] },
    { "id": 4, "tasks": ["6.1", "6.2", "6.3", "6.4", "6.5", "6.12"] },
    { "id": 5, "tasks": ["6.6", "6.7", "6.8", "6.9", "6.10", "6.11", "6.13"] },
    { "id": 6, "tasks": ["8.1", "8.2", "8.3"] },
    { "id": 7, "tasks": ["9.1", "9.2", "9.3", "9.12"] },
    { "id": 8, "tasks": ["9.4", "9.5", "9.6", "9.13"] },
    { "id": 9, "tasks": ["9.7", "9.8", "9.9", "9.10", "9.11"] },
    { "id": 10, "tasks": ["11.1", "11.2", "11.3", "11.4"] },
    { "id": 11, "tasks": ["12.1", "12.2", "12.3", "12.4", "12.5"] },
    { "id": 12, "tasks": ["13.1"] },
    { "id": 13, "tasks": ["13.2"] },
    { "id": 14, "tasks": ["15.1", "15.6"] },
    { "id": 15, "tasks": ["15.2", "15.3", "15.4", "15.5"] },
    { "id": 16, "tasks": ["15.7"] },
    { "id": 17, "tasks": ["17.1", "18.1", "18.2"] },
    { "id": 18, "tasks": ["17.2", "18.3"] },
    { "id": 19, "tasks": ["17.3", "17.4", "17.5", "17.6"] },
    { "id": 20, "tasks": ["17.7"] },
    { "id": 21, "tasks": ["20.1"] },
    { "id": 22, "tasks": ["20.2", "20.3", "20.4", "20.5", "20.6", "20.7"] },
    { "id": 23, "tasks": ["22.1", "22.2", "23.1", "23.2", "24.1", "24.2", "25.1", "25.2"] },
    { "id": 24, "tasks": ["22.3", "22.4", "23.3", "23.4", "24.3"] },
    { "id": 25, "tasks": ["22.5", "23.5", "24.4", "25.3"] },
    { "id": 26, "tasks": ["27.1", "28.1", "29.1"] },
    { "id": 27, "tasks": ["27.2", "27.3", "27.4", "27.5", "27.6", "28.2", "28.3", "28.4", "28.5", "28.6", "29.2", "29.3", "29.4", "30.1", "30.2"] },
    { "id": 28, "tasks": ["32.1", "32.2", "32.3", "33.1", "33.2", "34.1"] },
    { "id": 29, "tasks": ["32.4", "33.3", "34.2"] },
    { "id": 30, "tasks": ["36.1", "36.2", "36.3", "36.4", "37.1", "37.2", "37.3", "37.6"] },
    { "id": 31, "tasks": ["37.4", "37.5"] },
    { "id": 32, "tasks": ["39.1", "39.2"] },
    { "id": 33, "tasks": ["39.3", "39.4"] },
    { "id": 34, "tasks": ["41.1", "41.2", "41.3"] },
    { "id": 35, "tasks": ["42.1", "42.2"] },
    { "id": 36, "tasks": ["43.1", "43.2", "43.3", "43.4"] },
    { "id": 37, "tasks": ["45.1", "45.2"] },
    { "id": 38, "tasks": ["45.3"] },
    { "id": 39, "tasks": ["46.1", "46.2", "46.3", "46.4"] },
    { "id": 40, "tasks": ["47.1", "47.2"] },
    { "id": 41, "tasks": ["49.1", "49.2", "49.3", "49.4", "50.1"] }
  ]
}
```
