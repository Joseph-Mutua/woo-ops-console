# Woo Ops Console

Woo Ops Console is a WooCommerce extension for merchant operations teams. It focuses on operational friction after checkout: failed payments, risky fulfillment delays, missing shipping details, refund anomalies, and repeated customer edits.

![Woo Ops Console dashboard preview](./docs/media/dashboard-preview.svg)

## Quick Look

| Capability | What it does | Why it matters |
| --- | --- | --- |
| Order Exceptions Dashboard | Surfaces orders with operational friction and risk signals | Helps teams prioritize real problems instead of scanning every order manually |
| Bulk Triage Actions | Lets admins mark flagged orders for review, add internal notes, and export focused CSVs | Speeds up coordination across support, fulfillment, and finance |
| Fulfillment Risk Indicator | Scores each order by payment, shipping, refund, inventory, and edit signals | Makes risk legible on both the dashboard and order screens |
| Merchant Insights Panel | Shows concentration cards and issue breakdowns | Gives ops leads a quick read on what is spiking |
| AI-assisted Issue Summary | Generates short explanations for why an order is flagged, while keeping people in control | Adds context without automating away judgment |

## Features

- WooCommerce submenu dashboard for operations teams
- risk scoring and issue detection for live Woo orders
- fallback demo dataset for empty or non-Woo environments
- bulk triage workflow with internal notes and review markers
- CSV export for flagged orders
- REST endpoints with capability checks and nonce-based authenticated access
- HPOS compatibility declaration
- order list risk badges for quick scanning in WooCommerce
- React-powered admin interface styled to match the supplied control-tower design language
- architecture and decision docs for written communication quality

## Visual System

The admin experience borrows from the design system in the workspace control-tower app:

- warm parchment-to-cloud background treatment
- glassy white panels with soft borders and blur
- teal as the operational primary accent
- orange as the escalation and urgency accent
- rounded chips, capsules, and panel geometry
- Space Grotesk-inspired typography stack

## Included Experiences

### Order Exceptions Dashboard

The main dashboard highlights the orders that need attention first.

It covers:

- failed payments
- suspicious retry behavior
- long-unfulfilled orders
- missing shipping details
- refund anomalies
- repeated customer edits
- inventory mismatch risk

### Bulk Triage Actions

Ops users can quickly act on the current order selection.

It supports:

- mark-for-review actions
- internal note capture
- issue-type filtering
- exporting flagged orders as CSV

### Fulfillment Risk Indicator

Each order receives a lightweight operational score and label.

Signals currently include:

- payment confirmed or failed
- aging fulfillment windows
- shipping completeness
- refund behavior
- repeated customer edits
- inventory pressure on line items

### Merchant Insights Panel

The right-hand panels keep the dashboard readable at a glance.

They summarize:

- orders at risk
- total value tied to the current flagged queue
- dominant issue spikes
- issue concentration by type

### AI-assisted Issue Summary

The plugin includes a deliberately restrained summary generator.

It is designed to:

- explain why an order is flagged
- avoid auto-resolving operational decisions
- let external AI providers override the default summary via a PHP filter

## Setup

### Requirements

- WordPress 6.6+
- PHP 7.4+
- WooCommerce active for live order intelligence
- Node.js and npm for local asset builds

### Installation

1. Place `woo-ops-console` in `wp-content/plugins/`.
2. Activate the plugin in WordPress admin.
3. Open `WooCommerce > Woo Ops Console`.
4. If WooCommerce has no qualifying orders yet, the console falls back to seeded demo data so the UX can still be reviewed.

### Development

From the plugin root:

```powershell
npm install
npm run lint
npm run test
npm run build
```

## Architecture Overview

Core runtime pieces:

- `woo-ops-console.php`
  Plugin bootstrap and constants.
- `src/php/Plugin.php`
  Service orchestration and HPOS compatibility.
- `src/php/Admin/AdminPage.php`
  Woo submenu page and asset loading.
- `src/php/Admin/OrderScreen.php`
  Ops risk column rendering on Woo order lists.
- `src/php/WooCommerce/OrderInsightsService.php`
  Order normalization, issue detection, risk scoring, metrics, and demo fallback data.
- `src/php/WooCommerce/OrderTriageService.php`
  Bulk triage persistence and internal notes.
- `src/php/WooCommerce/RestController.php`
  Secure dashboard refresh, triage, and summary endpoints.
- `src/App.js`
  Admin console UI and client-side workflows.
- `src/utils/dashboard.js`
  Filtering, issue aggregation, and export helpers.

More detail lives in [ARCHITECTURE.md](./ARCHITECTURE.md) and [DECISIONS.md](./DECISIONS.md).

## Technical Decisions

### Dynamic Woo data with demo fallback

The dashboard prefers real WooCommerce orders, but falls back to demo orders when WooCommerce is missing or the store is empty.

Why:

- the repo stays demonstrable in non-commerce environments
- reviewers can still assess the UX and heuristics quickly
- the plugin degrades gracefully instead of rendering an empty shell

### REST API plus nonce-authenticated admin requests

Bulk triage and summary generation use REST routes with capability checks and the standard `wp_rest` nonce.

Why:

- keeps the admin UI responsive
- demonstrates WordPress security discipline
- avoids form-processing without verification

### Human-in-control AI summary

The default “AI-assisted” summary is heuristic and deterministic, with a filter hook for external AI providers.

Why:

- the base plugin remains dependency-free
- merchants retain control over actions
- advanced teams can integrate their own provider later

## Trade-offs

- payment retry behavior relies on common meta fields and heuristics; gateway-specific integrations could improve precision
- order-edit estimation is conservative because WooCommerce does not expose a universal “customer changed order” counter
- the dashboard is optimized for review and triage, not deep warehouse execution workflows
- the design system is adapted to WordPress admin constraints, so some surfaces are slightly more practical than pure mockup styling

## Limitations

- no direct shipment-tracking carrier integrations yet
- no persistent saved views or per-user dashboards yet
- AI summaries are hooks-based rather than provider-integrated out of the box
- screenshots in this repo are design previews rather than recorded production captures

## Future Improvements

- gateway-specific payment anomaly adapters
- richer refund anomaly explanations with finance context
- saved triage views and role-based presets
- fulfillment SLA thresholds configurable in plugin settings
- dedicated order detail panel or metabox for deep exception context
- real screenshots and short demo video capture from a live Woo store

## Testing

Current coverage includes:

- JavaScript tests for dashboard filtering, issue aggregation, and CSV export helpers
- lintable React admin code
- PHP code structured for predictable extension and review

## Additional Materials

- [DECISIONS.md](./DECISIONS.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [CHANGELOG.md](./CHANGELOG.md)
- [docs/sample-use-cases.md](./docs/sample-use-cases.md)
- [docs/media/dashboard-preview.svg](./docs/media/dashboard-preview.svg)
- [docs/media/order-risk-preview.svg](./docs/media/order-risk-preview.svg)