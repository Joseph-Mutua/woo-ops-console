# Architecture

## Runtime Layers

### Plugin bootstrap

`woo-ops-console.php` defines plugin constants, registers the autoloader, and boots the plugin orchestrator.

### Service orchestration

`src/php/Plugin.php` wires services during `plugins_loaded` and declares HPOS compatibility on `before_woocommerce_init`.

### Admin layer

- `AdminPage` registers the WooCommerce submenu page and passes the dashboard payload plus REST config to the React app.
- `OrderScreen` injects a lightweight operations-risk column into Woo order tables.
- `AdminNotice` communicates degraded mode when WooCommerce is missing.

### Domain layer

- `OrderInsightsService` is the main intelligence service.
  It queries orders, normalizes them, detects issues, computes risk scores, creates metrics, and provides demo fallback data.
- `OrderTriageService` persists review status, triage issue keys, timestamps, and internal notes.

### Transport layer

`RestController` exposes authenticated dashboard refresh, triage, and summary endpoints through the WordPress REST API.

### Admin frontend

`src/App.js` renders the operations console. It handles filtering, selection, exports, triage requests, and summary requests.

## Data Flow

1. WordPress loads the plugin.
2. The admin page enqueues the React bundle and injects initial dashboard state plus the REST nonce.
3. The React app renders metrics, exception tables, and insights panels.
4. Bulk actions and AI-summary requests flow through nonce-authenticated REST calls.
5. The response returns fresh dashboard payload so the UI stays in sync with server state.

## Security Notes

- REST routes require `manage_woocommerce`.
- Requests use the standard `wp_rest` nonce.
- Inputs are sanitized with `sanitize_key()`, `sanitize_textarea_field()`, and integer normalization.
- Dashboard rendering escapes user-facing output on the PHP side where applicable.

## Extensibility

The current design leaves room for:

- gateway-specific retry and failure analyzers
- more advanced SLA policies
- external AI summary providers through `woo_ops_console_issue_summary`
- richer order screen integrations such as metaboxes or action buttons