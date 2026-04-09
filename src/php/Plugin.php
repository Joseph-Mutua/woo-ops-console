<?php
/**
 * Plugin orchestrator.
 *
 * @package WooOpsConsole
 */

declare( strict_types=1 );

namespace WooOpsConsole;

use WooOpsConsole\Admin\AdminNotice;
use WooOpsConsole\Admin\AdminPage;
use WooOpsConsole\Admin\OrderScreen;
use WooOpsConsole\Contracts\ServiceContract;
use WooOpsConsole\WooCommerce\OrderInsightsService;
use WooOpsConsole\WooCommerce\OrderTriageService;
use WooOpsConsole\WooCommerce\RestController;

final class Plugin {
	/**
	 * Boots the plugin services.
	 */
	public static function boot(): void {
		add_action( 'before_woocommerce_init', array( __CLASS__, 'declare_hpos_compatibility' ) );
		add_action( 'plugins_loaded', array( __CLASS__, 'register' ) );
	}

	/**
	 * Registers all plugin services.
	 */
	public static function register(): void {
		foreach ( self::get_services() as $service ) {
			$service->register();
		}
	}

	/**
	 * Declares HPOS compatibility when WooCommerce is present.
	 */
	public static function declare_hpos_compatibility(): void {
		if ( ! class_exists( '\\Automattic\\WooCommerce\\Utilities\\FeaturesUtil' ) ) {
			return;
		}

		\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', WOO_OPS_CONSOLE_FILE, true );
	}

	/**
	 * Returns plugin services.
	 *
	 * @return array<int, ServiceContract>
	 */
	private static function get_services(): array {
		$order_insights = new OrderInsightsService();
		$order_triage   = new OrderTriageService( $order_insights );

		return array(
			new AdminNotice(),
			new AdminPage( $order_insights ),
			new RestController( $order_insights, $order_triage ),
			new OrderScreen( $order_insights ),
		);
	}
}