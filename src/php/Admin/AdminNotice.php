<?php
/**
 * Admin notices for requirements and degraded states.
 *
 * @package WooOpsConsole
 */

declare( strict_types=1 );

namespace WooOpsConsole\Admin;

use WooOpsConsole\Contracts\ServiceContract;

final class AdminNotice implements ServiceContract {
	/**
	 * Registers hooks.
	 */
	public function register(): void {
		add_action( 'admin_notices', array( $this, 'render_notice' ) );
	}

	/**
	 * Renders WooCommerce availability messaging.
	 */
	public function render_notice(): void {
		if ( class_exists( 'WooCommerce' ) ) {
			return;
		}

		if ( ! current_user_can( 'activate_plugins' ) ) {
			return;
		}

		printf(
			'<div class="notice notice-warning"><p>%s</p></div>',
			esc_html__( 'Woo Ops Console works best with WooCommerce active. The plugin will fall back to demo insights until WooCommerce is available.', 'woo-ops-console' )
		);
	}
}