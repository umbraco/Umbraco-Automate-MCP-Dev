# Contributing / Development

Working on this repo. If you just want to *use* the MCP server against your own Umbraco
instance, see [README.md](README.md) instead.

This repo builds `automate-mcp-server`, an MCP server for Umbraco Automate built on
`@umbraco-cms/mcp-server-sdk`. It exposes the Umbraco Automate Management API as MCP tools.

## Prerequisites

- Node.js 22+
- .NET SDK 10.0 and SQL Server reachable at `localhost:1433` — **only if you're running the
  bundled `demo-site/`** (see below). Pointing this server at an existing Umbraco Automate
  instance instead needs neither.

## Quick Start

> **Already have an Umbraco Automate instance?** This server works against any Umbraco Automate
> install — the `demo-site/` in steps 2–4 below is only there to give you something to run
> against out of the box. If you already have an instance running (locally or remotely), skip
> straight to step 5 and point `.env` at it: set `UMBRACO_BASE_URL` to its URL, and
> `UMBRACO_CLIENT_ID` / `UMBRACO_CLIENT_SECRET` to an API user on *that* instance (create one via
> its backoffice, or run `npm run create-api-user <base-url> <admin-email> <admin-password>`
> against it instead of the demo defaults).

### 1. Install dependencies

```bash
npm install
```

### 2. Start SQL Server and create the database

The password and database name below match `demo-site/appsettings.local.json`:

```bash
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=YourStrong@Passw0rd" \
  -p 1433:1433 --name sql -d mcr.microsoft.com/mssql/server:2022-latest

docker exec sql /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P 'YourStrong@Passw0rd' -C -Q "CREATE DATABASE UmbracoDb"
```

The container is named `sql` because the worktree scripts (see [Worktrees](#worktrees)) look for
it by that name.

### 3. Start the demo Umbraco + Automate instance

`demo-site/` is an Umbraco 18 site with Umbraco Automate installed, checked into this repo.

```bash
npm run start:umbraco
```

The first run performs an unattended install and creates the admin user (`admin@test.com` /
`SecurePass1234`, see `demo-site/appsettings.Development.json`). Leave it running — subsequent
steps talk to it at `https://localhost:44320` (HTTP on `http://localhost:52268`).

### 4. Create the MCP API user

In a new terminal, once Umbraco is up:

```bash
npm run create-api-user
```

This provisions an API user (Client ID `umbraco-back-office-mcp` / Secret `1234567890`) via the
Management API. Its defaults match the demo site; pass `<base-url> <admin-email> <admin-password>`
to point it elsewhere. See `CLAUDE.md` for the manual backoffice alternative.

### 5. Configure environment

```bash
cp .env.example .env
```

Fill in (or confirm) these values to match the demo site:

```
UMBRACO_CLIENT_ID=umbraco-back-office-mcp
UMBRACO_CLIENT_SECRET=1234567890
UMBRACO_BASE_URL=https://localhost:44320
NODE_TLS_REJECT_UNAUTHORIZED=0
```

### 6. Build and try it

```bash
npm run build

# Test with MCP Inspector
npm run inspect
```

Or open this project directory in Claude Code — `.mcp.json` registers the server automatically
(it runs `node --env-file=.env ./dist/index.js`, so no secrets leave `.env`).

## Project Structure

```
├── src/
│   ├── umbraco-api/
│   │   ├── api/
│   │   │   ├── client.ts              # Management API client (stdio mode)
│   │   │   ├── client-fetch.ts        # Fetch-based client for the hosted Worker
│   │   │   ├── openapi.yaml           # Automate Management API spec
│   │   │   └── generated/             # Orval-generated client and Zod schemas
│   │   └── tools/
│   │       └── {collection}/          # automations, workspaces, runs, catalogue...
│   │           ├── index.ts           # ToolCollectionExport
│   │           ├── get/ post/ put/ delete/
│   │           └── __tests__/
│   ├── config/                        # Custom fields, slice/mode registries, chained servers
│   ├── testing/                       # Mock chained MCP server
│   ├── index.ts                       # Server entry point (stdio)
│   └── worker.ts                      # Hosted Worker entry point
├── demo-site/                         # Local Umbraco + Automate instance for dev/testing
├── scripts/
│   ├── create-api-user.mjs            # Provisions the MCP API user
│   ├── test-changed.mjs               # Runs only tests related to the current diff
│   ├── rerun-failures.mjs             # Reruns only the last run's failures
│   ├── run-evals-isolated.mjs         # Runs evals with .mcp.json moved aside
│   ├── worktree-create.sh / -remove.sh  # Claude Code worktree hooks
│   ├── start-umbraco.sh / .ps1        # Runs demo-site/
│   └── tunnels.sh                     # Cloudflare tunnels for remote MCP client testing
├── umbraco/                           # Snippets to copy into YOUR OWN Umbraco project
│   ├── McpOAuthComposer.cs            # if self-hosting the MCP server as a Worker
│   ├── ProgramSnippet.cs              # dev-only: lets workerd reach the token endpoint over HTTP
│   └── *.Cloud.cs                     # Umbraco Cloud only (commented out)
├── tests/
│   ├── evals/                         # LLM-based acceptance tests
│   └── hosted-e2e/                    # Playwright tests for the hosted Worker
├── .github/workflows/                 # CI (test.yml), release (release-tag.yml), loop-dispatch.yml
└── .env.example
```

Full tool conventions, registries, and the Umbraco-version check are documented in `CLAUDE.md`.

## Adding Your Own Tools

1. Create a folder under `src/umbraco-api/tools/` for your tool collection
2. Add tool files in the matching subfolder — `get/`, `post/`, `put/`, `delete/`
3. Add an `index.ts` that exports the collection (`ToolCollectionExport`)
4. Register the collection in `src/collections.ts` and `src/index.ts`, and add it to a mode in
   `src/config/mode-registry.ts`

### Tool Pattern Example

```typescript
import { z } from "zod";
import {
  withStandardDecorators,
  executeGetApiCall,
  CAPTURE_RAW_HTTP_RESPONSE,
  ToolDefinition,
} from "@umbraco-cms/mcp-server-sdk";

const inputSchema = {
  id: z.string().uuid(),
};

const myTool: ToolDefinition<typeof inputSchema> = {
  name: "my-tool",
  description: "Does something useful",
  inputSchema,
  slices: ["read"],
  annotations: { readOnlyHint: true },
  handler: async ({ id }) => {
    return executeGetApiCall((client) =>
      client.getMyItem(id, CAPTURE_RAW_HTTP_RESPONSE)
    );
  },
};

export default withStandardDecorators(myTool);
```

## Testing

Integration tests run against the real Umbraco instance from the Quick Start above (no mocking):

```bash
npm test                      # full integration suite
npm run test:changed          # only tests related to files changed vs dev/main
npm run test:rerun-failures   # re-run only what failed last time (reads test-failures.log)
npm run test:evals            # LLM-based acceptance tests (needs Claude Code subscription or ANTHROPIC_API_KEY)
npm run test:e2e              # Playwright tests for the hosted Worker
```

Any failing run writes a summary to `test-failures.log` (via `jest-failure-reporter.ts`); a clean
run deletes it.

`test:evals` runs through `scripts/run-evals-isolated.mjs`, which moves `.mcp.json` aside for the
run. Otherwise the eval harness picks up `.mcp.json` as well as its own connection, registers this
server twice, and the model can call the duplicate tools.

Tests use Jest with the MCP toolkit's testing helpers:

```typescript
import {
  setupTestEnvironment,
  createSnapshotResult,
  createMockRequestHandlerExtra,
} from "@umbraco-cms/mcp-server-sdk/testing";

describe("my-tool", () => {
  setupTestEnvironment();

  it("should do something", async () => {
    const result = await myTool.handler({ id: "..." }, createMockRequestHandlerExtra());
    expect(createSnapshotResult(result)).toMatchSnapshot();
  });
});
```

## Regenerating the API Client

If the Umbraco Automate Management API changes, point `orval.config.ts` at your instance and
regenerate:

```bash
npm run generate
```

This also re-stamps `src/config/umbraco-target.generated.ts` from your connected instance's
actual version — see `CLAUDE.md` for why there's no spec-based fallback.

## Worktrees

`scripts/worktree-create.sh` and `scripts/worktree-remove.sh` are Claude Code `WorktreeCreate` /
`WorktreeRemove` hooks. Each worktree gets its own copy of `demo-site/`, its own SQL Server
database (`umbraco-mcp-automate-<name>`) and a random port, so several can run side by side.

They aren't enabled by default. To use them, register them as hooks in your
`.claude/settings.local.json`. They need `jq`, and a SQL Server Docker container named `sql`
(see [Quick Start step 2](#2-start-sql-server-and-create-the-database)).

## CI

- `.github/workflows/test.yml` spins up SQL Server + a real Umbraco instance and runs the
  integration suite per tool collection on every push/PR to `dev`/`main`.
- `.github/workflows/release-tag.yml` tags `v<version>` and creates a GitHub Release whenever
  `package.json`'s version changes on `main`.
- `.github/workflows/loop-dispatch.yml` forwards issue/PR label events to the shared loop
  routine. It needs the `LOOP_DISPATCH_FIRE_URL` and `LOOP_DISPATCH_TOKEN` repo secrets.

## Deploying as a Hosted Worker

See `src/worker.ts` and `CLAUDE.md`'s "Hosted Worker" section. The `umbraco/` folder holds
snippets to copy into your own Umbraco project so it can authenticate a Worker-hosted MCP server.

## License

MIT
