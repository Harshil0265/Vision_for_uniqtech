# Implementation Plan: Professional HTML Email Templates

## Project Context

**Project Type:** React + Express/Node.js application with TypeScript, Clerk authentication, Supabase database, and nodemailer for email

**Language:** TypeScript

**Build System:** Vite for frontend, tsx for backend development, npm scripts for orchestration

**Test Framework:** None detected (TypeScript type checking via `npm run lint`)

**Build Command:** `npm run build` (frontend), `npm run start` (backend)

**Test Command:** `npm run lint` (TypeScript type checking only)

**Verification Instructions:** 
1. Run `npm run lint` to ensure no TypeScript errors
2. Start the development server with `npm run dev` (runs both frontend and backend)
3. Test email sending by triggering relevant actions (inviting users, assigning tasks, etc.)
4. Verify emails are received and render correctly in email clients

**Snapshot/Generated Files:** dist/ directory contains built frontend assets (not checked in)

**Environment Constraints:**
- SMTP configuration required via environment variables (SMTP_USER, SMTP_PASS, SMTP_HOST, SMTP_PORT)
- APP_URL environment variable determines base URL for links in emails
- Backend runs on port 3000, frontend on port 5173 in development

**Contribution Requirements:**
- No formal AGENTS.md or CONTRIBUTING.md found
- Follow existing TypeScript patterns
- Use inline CSS for email templates (email client compatibility)
- Maintain existing nodemailer setup

**Key Patterns:**
- Backend API routes use Express with Clerk authentication middleware
- Email service in `src/lib/emailService.ts` uses nodemailer transport
- Database schema uses Supabase with issues table including assignee_id, due_date, assigned_at fields
- Comments table has mentions field (JSONB array)
- Sprints table tracks completed_points and planned_points
- TypeScript interfaces defined in `src/types/index.ts`

**Relevant Files:**
- `src/lib/emailService.ts` - Current email service with basic invitation email
- `src/types/index.ts` - TypeScript type definitions for Issue, Sprint, Comment, User, etc.
- `server.ts` - Backend API with routes for issues, comments, sprints, invitations
- `.agents/tasks/supabase-schema.sql` - Database schema reference
- `.env.example` - Environment variable documentation

**Directory Structure:**
- `src/lib/` - Shared libraries and utilities
- `src/types/` - TypeScript type definitions
- `server.ts` - Express backend server
- `.agents/tasks/` - Task planning and documentation

---

## Design Decisions

### 1. Template Architecture
**Decision:** Create a separate `emailTemplates.ts` module with individual template builder functions returning complete HTML strings with inline styles.

**Rationale:** Separates presentation from email sending logic, makes templates easier to maintain and test independently, follows single responsibility principle. Each template function is self-contained and can be updated without affecting the email service logic.

### 2. Email Layout System
**Decision:** Use table-based layout with inline CSS, following the traditional email development approach for maximum compatibility.

**Rationale:** Modern CSS (flexbox, grid) has poor support in email clients, especially Outlook which uses Microsoft Word's rendering engine. Table-based layouts with inline CSS ensure consistent rendering across Gmail, Outlook, Apple Mail, and mobile clients.

### 3. Color Scheme and Branding
**Decision:** Use blue primary color (#3b82f6) matching the project's Tailwind theme, with professional grays for text and borders.

**Rationale:** Consistency with the existing UI creates a cohesive brand experience. Blue is professional, trustworthy, and has good contrast for CTAs.

### 4. Responsive Design Strategy
**Decision:** Set max-width: 600px on main container, use percentage-based widths for inner elements, ensure buttons are minimum 44px height for mobile tap targets.

**Rationale:** 600px is the email industry standard max width (works on all devices), percentage widths allow scaling, 44px is the minimum recommended touch target size for mobile accessibility.

### 5. Integration Points
**Decision:** 
- Send task assignment emails immediately when assignee_id changes in PATCH /api/issues/:issueId
- Send mention emails immediately when comments with mentions array are created in POST /api/issues/:issueId/comments
- Task reminder emails will be triggered by a future scheduled job (out of scope for this task)
- Sprint completion emails will be triggered when sprint status changes to 'completed' (future enhancement)

**Rationale:** Immediate sending for assignment and mention notifications provides timely user engagement. Reminder and sprint emails require scheduled job infrastructure which should be a separate task.

### 6. Email Template Data Structure
**Decision:** Each template function accepts a typed parameter object with all required data pre-formatted (e.g., formatted dates, direct links).

**Rationale:** Keeps template logic simple and focused on presentation. Data transformation and URL building happens in the service layer, making templates easier to test and maintain.

---

## Implementation Plan

- [ ] 1. Create email template builder module with base HTML structure and shared utility functions.
      Files: `src/lib/emailTemplates.ts` (new file)
      Create the base template structure including DOCTYPE, meta tags, base styles, and utility functions for common elements (header, footer, button, info card). Export helper functions: `buildEmailHeader()`, `buildEmailFooter()`, `buildButton()`, `buildInfoCard()`.
      Verify: Run `npm run lint` to ensure no TypeScript errors in the new file.

- [ ] 2. Implement project invitation email template function.
      Files: `src/lib/emailTemplates.ts`
      Add `buildInvitationEmail(params: InvitationEmailParams): string` function that generates the professional HTML invitation email with: header with logo/brand, greeting, invitation message with project name and inviter, info card with project details, "Accept Invitation" CTA button, note for new users, footer with disclaimer. Use inline CSS throughout for email client compatibility.
      Verify: Run `npm run lint` to check types, visually inspect the HTML structure in the code.

- [ ] 3. Implement task assignment email template function.
      Files: `src/lib/emailTemplates.ts`
      Add `buildTaskAssignmentEmail(params: TaskAssignmentEmailParams): string` function that generates email with: header, greeting, assignment notification message, info card showing task key, title, status, priority, due date, project name, assigned by, "Open Task" CTA button, footer. Export TypeScript interface for params: `{ to, taskKey, taskTitle, taskUrl, status, priority, dueDate, projectName, assignedBy: { name, email }, assigneeName }`.
      Verify: Run `npm run lint` to ensure TypeScript types are correct.

- [ ] 4. Implement mention notification email template function.
      Files: `src/lib/emailTemplates.ts`
      Add `buildMentionEmail(params: MentionEmailParams): string` function that generates email with: header, greeting, mention notification message, info card showing issue key and title, comment snippet (first 200 chars), author who mentioned, project name, "View Comment" CTA button, footer. Export TypeScript interface: `{ to, issueKey, issueTitle, issueUrl, commentSnippet, authorName, projectName, mentionedUserName }`.
      Verify: Run `npm run lint` for type checking.

- [ ] 5. Implement task due date reminder email template function.
      Files: `src/lib/emailTemplates.ts`
      Add `buildTaskReminderEmail(params: TaskReminderEmailParams): string` function that generates email with: header, greeting, due date reminder message, info card showing task key, title, due date/time, status, priority, project name, "View Task" CTA button, footer. Export TypeScript interface: `{ to, taskKey, taskTitle, taskUrl, dueDate, status, priority, projectName, assigneeName }`.
      Verify: Run `npm run lint` to check types.

- [ ] 6. Implement sprint completion email template function.
      Files: `src/lib/emailTemplates.ts`
      Add `buildSprintCompletionEmail(params: SprintCompletionEmailParams): string` function that generates email with: header, greeting, sprint completion message, info card showing sprint name, completion date, points completed/total (e.g., "47/50"), completion percentage, project name, "View Sprint Report" CTA button, footer. Export TypeScript interface: `{ to, sprintName, projectName, completionDate, completedPoints, totalPoints, reportUrl, recipientName }`.
      Verify: Run `npm run lint` for TypeScript validation.

- [ ] 7. Update emailService.ts to use the new invitation email template.
      Files: `src/lib/emailService.ts`
      Import `buildInvitationEmail` from `./emailTemplates.js`, update `sendInvitationEmail()` function to call `buildInvitationEmail()` instead of the inline HTML, pass appropriate params including inviterName, projectName, inviteLink, isNewUser, recipientEmail.
      Verify: Run `npm run lint` and start dev server `npm run dev`, test by inviting a user to a project and checking email receipt.

- [ ] 8. Add sendTaskAssignmentEmail function to emailService.ts.
      Files: `src/lib/emailService.ts`
      Export new async function `sendTaskAssignmentEmail(opts: TaskAssignmentEmailOptions): Promise<{ success: boolean; error?: string }>` that uses nodemailer transporter to send emails. Function should: check SMTP config, build HTML using `buildTaskAssignmentEmail()`, send with subject "You've been assigned to {taskKey}", handle errors gracefully. Export TypeScript interface: `interface TaskAssignmentEmailOptions { to, taskKey, taskTitle, taskUrl, status, priority, dueDate, projectName, assignedByName, assigneeName }`.
      Verify: Run `npm run lint` to ensure no TypeScript errors.

- [ ] 9. Add sendMentionNotificationEmail function to emailService.ts.
      Files: `src/lib/emailService.ts`
      Export new async function `sendMentionNotificationEmail(opts: MentionEmailOptions): Promise<{ success: boolean; error?: string }>` that sends mention notification emails. Function should: check SMTP config, build HTML using `buildMentionEmail()`, send with subject "{authorName} mentioned you in {issueKey}", handle errors. Export interface: `interface MentionEmailOptions { to, issueKey, issueTitle, issueUrl, commentSnippet, authorName, projectName, mentionedUserName }`.
      Verify: Run `npm run lint` for type checking.

- [ ] 10. Add sendTaskReminderEmail function to emailService.ts.
       Files: `src/lib/emailService.ts`
       Export new async function `sendTaskReminderEmail(opts: TaskReminderEmailOptions): Promise<{ success: boolean; error?: string }>` for due date reminders. Function should: check SMTP config, build HTML using `buildTaskReminderEmail()`, send with subject "Reminder: {taskKey} is due soon", handle errors. Export interface: `interface TaskReminderEmailOptions { to, taskKey, taskTitle, taskUrl, dueDate, status, priority, projectName, assigneeName }`. Note: This function will be called by future scheduled job infrastructure.
       Verify: Run `npm run lint` to check types.

- [ ] 11. Add sendSprintCompletionEmail function to emailService.ts.
       Files: `src/lib/emailService.ts`
       Export new async function `sendSprintCompletionEmail(opts: SprintCompletionEmailOptions): Promise<{ success: boolean; error?: string }>` for sprint completion notifications. Function should: check SMTP config, build HTML using `buildSprintCompletionEmail()`, send with subject "Sprint Complete: {sprintName}", handle errors. Export interface: `interface SprintCompletionEmailOptions { to, sprintName, projectName, completionDate, completedPoints, totalPoints, reportUrl, recipientName }`. Note: This will be integrated when sprint completion is implemented.
       Verify: Run `npm run lint` for TypeScript validation.

- [ ] 12. Integrate task assignment email sending into the issue update endpoint.
       Files: `server.ts`
       In the PATCH /api/issues/:issueId route (around line 1172), after successful issue update: check if assignee_id changed by comparing with the old value, if changed and new assignee exists, fetch assignee user email from the database, dynamically import sendTaskAssignmentEmail, build task URL using APP_URL env var, call sendTaskAssignmentEmail with all required data (task key, title, status, priority, due_date, project name, assigner name, assignee name), log but don't fail the request if email fails.
       Verify: Run `npm run dev`, update an issue to assign it to a user, check that the assignee receives an email, confirm the email renders correctly and all data is present.

- [ ] 13. Integrate mention notification email sending into the comment creation endpoint.
       Files: `server.ts`
       In the POST /api/issues/:issueId/comments route (around line 1680), after successful comment creation: check if mentions array has entries, for each mentioned user, lookup their email from the users table by name or ID (mentions array contains user identifiers), dynamically import sendMentionNotificationEmail, build issue URL using APP_URL env var, get issue details (key, title) from database, call sendMentionNotificationEmail for each mentioned user with comment content snippet (first 200 chars), log but don't fail the request if email fails.
       Verify: Run `npm run dev`, create a comment that mentions a user (e.g., @username in the comment content), confirm the mentioned user receives an email, check email rendering and content accuracy.

- [ ] 14. Add comprehensive inline documentation and type exports.
       Files: `src/lib/emailTemplates.ts`, `src/lib/emailService.ts`
       Add JSDoc comments to all exported functions explaining parameters, return values, and usage examples. Ensure all email param interfaces are exported from emailService.ts for potential external use. Add file-level comments explaining the email template architecture and compatibility considerations (inline CSS, table layouts, etc.).
       Verify: Run `npm run lint` to ensure documentation doesn't introduce errors, review code readability.

- [ ] 15. Final integration testing and verification.
       Files: All modified files
       Test the complete flow: start dev server with `npm run dev`, test project invitation flow (existing functionality with new template), test task assignment by creating an issue and assigning it to a user, test mention notifications by creating a comment with @mentions, verify all emails are received, check email rendering in multiple clients if possible (Gmail web, Outlook), verify all links work correctly, confirm SMTP errors are handled gracefully, ensure no TypeScript errors with `npm run lint`.
       Verify: All email types send successfully, render professionally, and contain correct data with working links. No console errors or TypeScript issues.

---

## Notes

- Task reminder emails (#10) and sprint completion emails (#11) are fully implemented but will only be called when scheduled job infrastructure is built (future task).
- The implementation prioritizes immediate notification emails (assignment, mentions) that can be triggered by existing API endpoints.
- Email templates use table-based layouts and inline CSS for maximum compatibility with email clients including Outlook.
- All emails include fallback text links below buttons in case the button doesn't render.
- The SMTP configuration must be set in environment variables for emails to send; otherwise, the service logs warnings and returns gracefully.
- Consider adding email preview/testing endpoint in future for development purposes.
- Future enhancements could include: email template preview UI, email preferences per user, digest emails combining multiple notifications, rich text formatting in comment snippets.
