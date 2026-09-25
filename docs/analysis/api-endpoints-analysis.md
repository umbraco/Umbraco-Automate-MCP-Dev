# API Endpoints Analysis

**Last Updated**: 25-09-2026

## Summary

| Collection | Tool Count |
|------------|------------|
| automations | 23 |
| workspaces | 10 |
| catalogue | 8 |
| connections | 6 |
| runs | 6 |
| version-history | 5 |
| approvals | 2 |
| metrics | 2 |
| umbraco-server | 1 |

**Total MCP Tools**: 63

All 56 Umbraco Automate Management API endpoints are covered — see [IGNORED_ENDPOINTS.md](IGNORED_ENDPOINTS.md).

## Tools by Collection

### automations (23)

- `add-automation-step`
- `connect-automation-steps`
- `create-automation`
- `delete-automation`
- `disconnect-automation-steps`
- `export-automation`
- `get-automation`
- `get-automation-ancestors`
- `get-automation-group`
- `get-automation-webhook-url`
- `import-automation`
- `import-automation-into-existing`
- `list-automation-runs`
- `list-automations`
- `publish-automation`
- `re-enable-automation`
- `remove-automation-step`
- `set-automation-trigger`
- `trigger-automation`
- `unpublish-automation`
- `update-automation`
- `update-automation-step`
- `validate-automation-import`

### workspaces (10)

- `create-workspace`
- `create-workspace-group`
- `delete-workspace`
- `delete-workspace-group`
- `get-workspace`
- `get-workspace-group`
- `list-workspace-groups`
- `list-workspaces`
- `update-workspace`
- `update-workspace-group`

### catalogue (8)

- `list-catalogue-actions`
- `list-catalogue-connection-types`
- `list-catalogue-control-flows`
- `list-catalogue-notification-channels`
- `list-catalogue-step-types`
- `list-catalogue-triggers`
- `list-catalogue-webhook-authenticators`
- `resolve-step-type-output-schema`

### connections (6)

- `create-connection`
- `delete-connection`
- `get-connection`
- `list-connections`
- `test-connection`
- `update-connection`

### runs (6)

- `get-run-by-id`
- `list-runs`
- `replay-run`
- `resume-run`
- `suspend-run`
- `terminate-run`

### version-history (5)

- `compare-version-history`
- `get-version-history-entry`
- `list-version-history`
- `list-version-history-supported-types`
- `rollback-version-history`

### approvals (2)

- `decide-approval-step`
- `list-pending-approvals`

### metrics (2)

- `get-metrics`
- `get-metrics-by-automation`

### umbraco-server (1)

- `get-server-info`

## Notes

- Counts come from `--list-tools` and include only tools registered in `src/collections.ts`
- Tools chained from `@umbraco-cms/mcp-dev` (prefixed `cms--`) are not counted
