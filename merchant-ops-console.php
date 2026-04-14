<?php
/**
 * Plugin Name:       Merchant Ops Console for WooCommerce
 * Description:       Merchant operations console for WooCommerce order exceptions, triage, fulfillment risk, and insights.
 * Version:           0.1.0
 * Requires at least: 6.6
 * Requires PHP:      7.4
 * Author:            Joseph Mutua
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       merchant-ops-console
 *
 * @package MerchantOpsConsole
 */
declare( strict_types=1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'MERCHANT_OPS_CONSOLE_VERSION', '0.1.0' );
define( 'MERCHANT_OPS_CONSOLE_FILE', __FILE__ );
define( 'MERCHANT_OPS_CONSOLE_PATH', plugin_dir_path( __FILE__ ) );
define( 'MERCHANT_OPS_CONSOLE_URL', plugin_dir_url( __FILE__ ) );

require_once MERCHANT_OPS_CONSOLE_PATH . 'src/php/Autoloader.php';

MerchantOpsConsole\Autoloader::register();
MerchantOpsConsole\Plugin::boot();
