=== Merchant Ops Console for WooCommerce ===
Contributors: mutuajose
Tags: woocommerce, operations, orders, dashboard, admin
Requires at least: 6.6
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 0.1.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Operational WooCommerce console for order exceptions, triage workflows, fulfillment risk, and merchant insights.

== Description ==

Merchant Ops Console helps merchants identify and act on the orders that need attention first.

Features include:

- order exception dashboard
- bulk triage workflows
- fulfillment risk scoring
- merchant insights cards
- AI-assisted issue explanation with human control

Human-readable source code is included in this plugin package under `/src/`.
Production assets in `/build/` are generated from that source using the documented npm scripts in `package.json`.

Build workflow:

1. Run `npm install`
2. Run `npm run build`
3. The generated production assets are written to `/build/`

This plugin does not load external scripts, styles, or services by default. The AI-assisted summary is local and heuristic, with an optional PHP filter for developer extension.

== Installation ==

1. Upload the plugin folder to `/wp-content/plugins/`.
2. Activate the plugin through the WordPress admin.
3. Navigate to `WooCommerce > Merchant Ops Console`.

== Screenshots ==

1. Order Exceptions Dashboard highlighting flagged orders and issue severity.
2. Bulk Triage Actions view with review tools, filters, and note capture.
3. Risk Analysis page showing order health scoring and fulfillment signals.
4. Merchant Insights Panel with operational summary cards and issue breakdowns.

== Frequently Asked Questions ==

= Does this require WooCommerce? =

Yes for live order intelligence. The UI falls back to seeded demo data when WooCommerce is unavailable or the store is empty.

= Where is the human-readable source code? =

The plugin includes its readable source in `/src/`, plus build tooling in `package.json` and `package-lock.json`. The compiled production assets in `/build/` are generated from those files.

= Does this plugin contact external services? =

No. By default the plugin runs locally inside WordPress and WooCommerce. It does not load third-party assets or send operational data to external services.

== Changelog ==

= 0.1.0 =

* Initial release.
