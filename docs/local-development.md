# Local Development and Testing

This guide walks through the exact steps for running and testing Merchant Ops Console for WooCommerce on a local WordPress + WooCommerce site.

## 1. Open the plugin folder

Use PowerShell and move into the plugin directory:

```powershell
cd D:\Work\Plugins\merchant-ops-console
```

## 2. Install dependencies and build assets

Run the standard setup commands:

```powershell
npm install
npm run build
```

If the folder was moved and the local npm toolchain is in a bad state, do a clean reinstall:

```powershell
Remove-Item -Recurse -Force node_modules
npm install
npm run build
```

When the install is healthy, also run:

```powershell
npm run lint
npm run test
```

For active UI development, use watch mode:

```powershell
npm run start
```

That watches the source files in `src/` and rebuilds `build/` automatically.

## 3. Create a local WordPress site

The easiest option is LocalWP.

1. Create a new local WordPress site.
2. Open WP Admin for that site.
3. Install and activate WooCommerce.
4. Complete the basic WooCommerce setup.
5. Create a few products so orders have something to reference.

Your plugins directory will usually be something like:

```text
C:\Users\user\Local Sites\your-site\app\public\wp-content\plugins
```

## 4. Copy the plugin into the local site

Copy the full plugin folder into the local site's plugins directory so the destination becomes:

```text
...\wp-content\plugins\merchant-ops-console
```

Because symlinks caused asset URL issues in an earlier Local setup, a real copied folder is the safest option here.

Recommended workflow:

1. Edit the source in `D:\Work\Plugins\merchant-ops-console`.
2. Run `npm run build`.
3. Copy the updated plugin files into the Local site.

## 5. Activate the plugin

In WP Admin:

1. Go to `Plugins`.
2. Activate `Merchant Ops Console for WooCommerce`.
3. Open `WooCommerce > Merchant Ops Console`.

That is the main admin screen for the plugin.

## 6. What to expect on first run

The plugin includes a demo fallback in `src/php/WooCommerce/OrderInsightsService.php`.

That means:

- if WooCommerce is missing, it falls back to sample data
- if WooCommerce is installed but there are no qualifying risky orders, it can still fall back to sample records

So you should still see a working dashboard even before creating realistic orders.

## 7. Create realistic WooCommerce test data

To exercise the operational heuristics, create test orders that match these cases:

- a `failed` or `pending` order for failed payment
- a `processing` or `on-hold` order older than 3 days for long-unfulfilled
- a physical order with incomplete shipping fields for missing shipping details
- an order with heavy or multiple refunds for refund anomaly
- an order where stock quantity is lower than ordered quantity for inventory mismatch

The plugin also reads these meta fields if you want to simulate deeper signals:

- `_payment_retries`
- `_retry_count`
- `_woo_ops_retry_count`
- `_woo_ops_customer_edits`

These affect retry behavior and repeated-customer-edits logic.

## 8. Full UI test pass

### Exceptions

- confirm the left navigation and top app bar load correctly
- verify the 4 summary cards render
- test search
- test the issue filter chips
- click `Export Report`
- click `Run Sync`
- verify exception cards render with the correct tone
- click the text action on a card
- click `Mark for Review`
- click the summary / more actions
- verify generated summaries appear under the card

### Bulk Triage

- navigate to `Bulk Triage`
- select one order
- select multiple orders
- test the top checkbox
- change the triage action
- add an internal note
- click `Mark for Review`
- verify the success/status message appears
- test `Export Selected`

### Risk Analysis

- verify risk cards render
- confirm score bars match order risk scores
- verify signal chips reflect payment/shipping/edit states
- confirm the breakdown panel changes when filters or search change

### Insights

- verify the executive snapshot values
- verify issue breakdown counts
- use `Generate` on the AI summary cards
- confirm summaries appear and remain advisory only

## 9. Verify WooCommerce order screen integration

The plugin also adds order risk visibility to WooCommerce admin order screens.

Check:

- the WooCommerce orders list
- the HPOS order list if HPOS is enabled

You should see the extra ops risk indicator added by `src/php/Admin/OrderScreen.php`.

## 10. Enable debugging

In your local `wp-config.php`, enable:

```php
define( 'WP_DEBUG', true );
define( 'WP_DEBUG_LOG', true );
define( 'WP_DEBUG_DISPLAY', false );
```

Then:

1. reload WP Admin
2. open `WooCommerce > Merchant Ops Console`
3. run triage actions
4. generate summaries
5. inspect `wp-content/debug.log`

You want no notices, warnings, or fatal errors from Merchant Ops Console for WooCommerce.

## 11. Frontend and build validation

From the plugin folder, the ideal validation pass is:

```powershell
cd D:\Work\Plugins\merchant-ops-console
npm install
npm run lint
npm run test
npm run build
```

If `lint` or `build` fails after the folder move, the most likely fix is:

```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

Then rerun the scripts.

## 12. Most important files while testing

Open these first if something looks wrong:

- `src/App.js`
- `src/styles.css`
- `src/php/WooCommerce/OrderInsightsService.php`
- `src/php/WooCommerce/RestController.php`
- `src/php/Admin/AdminPage.php`

## 13. Fastest practical workflow

1. `cd D:\Work\Plugins\merchant-ops-console`
2. `npm install`
3. `npm run build`
4. copy the plugin into local WordPress `wp-content/plugins`
5. activate it
6. install and activate WooCommerce
7. open `WooCommerce > Merchant Ops Console`
8. test `Exceptions`, `Bulk Triage`, `Risk Analysis`, and `Insights`
9. create a few risky orders and test again with real WooCommerce data



