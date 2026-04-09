<?php
/**
 * Plugin Name:       Woo Ops Console
 * Plugin URI:        https://github.com/Joseph-Mutua
 * Description:       An operational WooCommerce console for order exceptions, triage, fulfillment risk, and merchant insights.
 * Version:           0.1.0
 * Requires at least: 6.6
 * Requires PHP:      7.4
 * Author:            Joseph Mutua
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       woo-ops-console
 *
 * @package WooOpsConsole
 */

declare( strict_types=1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'WOO_OPS_CONSOLE_VERSION', '0.1.0' );
define( 'WOO_OPS_CONSOLE_FILE', __FILE__ );
define( 'WOO_OPS_CONSOLE_PATH', plugin_dir_path( __FILE__ ) );
define( 'WOO_OPS_CONSOLE_URL', plugin_dir_url( __FILE__ ) );

require_once WOO_OPS_CONSOLE_PATH . 'src/php/Autoloader.php';

WooOpsConsole\Autoloader::register();
WooOpsConsole\Plugin::boot();