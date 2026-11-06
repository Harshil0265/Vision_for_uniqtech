# Vision – Setup

Vision needs **no external services or API keys**: no database, no email provider and no AI API.

## 1. Install and run

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Auth server: http://localhost:3000

## 2. Configuration (optional)

Copy `.env.example` to `.env` if you want to change anything. For production you must set `JWT_ACCESS_SECRET`:

```bash
npm run auth:secret      # prints a random value to paste into .env
```

## 3. Where data lives

| Data | Location |
|---|---|
| Accounts and login sessions | `.data/auth.json` on the server (override with `AUTH_DATA_FILE`). Git-ignored. Back it up and keep it private. |
| Projects, issues, sprints, members, attachments, notifications | The browser's `localStorage`, saved per browser |

Consequences of this design:

- Project data is **not shared between browsers or devices**, and clearing site data deletes it.
- Attachments are stored inside the browser, so they are limited to **1 MB** each.
- There are no email invitations. A person can be added to a project only if they already appear in the team list in that browser.
- Sign-up does not send a verification email, so an email address is not proven to belong to the person who entered it.

## 4. Sign-up rules

Only Gmail addresses (`gmail.com`, `googlemail.com`) can register by default. Set `ALLOWED_EMAIL_DOMAINS` in `.env` to change this (`*` allows any domain).

## 5. Production

```bash
npm run build
NODE_ENV=production JWT_ACCESS_SECRET=<value> npm start
```

The server then serves the built frontend from `dist/` as well as the auth API.

## 6. Tests

```bash
npm run test:auth   # token and session security checks (in memory, writes no files)
npm run lint        # type-check
```

## Troubleshooting

- **Cannot sign in or sign up:** make sure both `[VITE]` and `[API]` are running in the `npm run dev` output.
- **Signed out after every server restart:** the auth file could not be written. Check the `[Auth]` messages in the terminal and the permissions of the `.data/` folder.
- **Projects disappeared:** they are stored in the browser. Check you are using the same browser and the same account.
