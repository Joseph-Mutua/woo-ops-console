<?php
/**
 * Admin page registration and asset loading.
 *
 * @package MerchantOpsConsole
 */

declare( strict_types=1 );

namespace MerchantOpsConsole\Admin;

use MerchantOpsConsole\Contracts\ServiceContract;
use MerchantOpsConsole\WooCommerce\OrderInsightsService;

final class AdminPage implements ServiceContract {
	private const PAGE_SLUG = 'merchant-ops-console';

	private OrderInsightsService $order_insights;

	public function __construct( OrderInsightsService $order_insights ) {
		$this->order_insights = $order_insights;
	}

	/**
	 * Registers hooks.
	 */
	public function register(): void {
		add_action( 'admin_menu', array( $this, 'register_menu' ), 25 );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );
	}

	/**
	 * Adds the WooCommerce submenu page.
	 */
	public function register_menu(): void {
		add_submenu_page(
			'woocommerce',
			__( 'Merchant Ops Console', 'merchant-ops-console' ),
			__( 'Merchant Ops Console', 'merchant-ops-console' ),
			'manage_woocommerce',
			self::PAGE_SLUG,
			array( $this, 'render_page' )
		);
	}

	/**
	 * Enqueues the admin app assets.
	 */
	public function enqueue_assets( string $hook_suffix ): void {
		if ( 'woocommerce_page_' . self::PAGE_SLUG !== $hook_suffix ) {
			return;
		}

		$asset_path = MERCHANT_OPS_CONSOLE_PATH . 'build/index.asset.php';
		$asset_data = file_exists( $asset_path )
			? require $asset_path
			: array(
				'dependencies' => array( 'wp-api-fetch', 'wp-components', 'wp-element', 'wp-i18n' ),
				'version'      => MERCHANT_OPS_CONSOLE_VERSION,
			);

		wp_enqueue_style(
			'merchant-ops-console-admin',
			MERCHANT_OPS_CONSOLE_URL . 'build/index.css',
			array(),
			$asset_data['version']
		);
		wp_enqueue_script(
			'merchant-ops-console-admin',
			MERCHANT_OPS_CONSOLE_URL . 'build/index.js',
			$asset_data['dependencies'],
			$asset_data['version'],
			true
		);

		wp_add_inline_script(
			'merchant-ops-console-admin',
			'window.wooOpsConsoleConfig = ' . wp_json_encode(
				array(
					'dashboard' => $this->order_insights->get_dashboard_payload(),
					'restUrl'   => esc_url_raw( rest_url( 'merchant-ops-console/v1' ) ),
					'nonce'     => wp_create_nonce( 'wp_rest' ),
					'labels'    => array(
						'refreshed' => __( 'Dashboard refreshed.', 'merchant-ops-console' ),
						'triaged'   => __( 'Orders updated.', 'merchant-ops-console' ),
					),
				)
			),
			'before'
		);
	}

	/**
	 * Renders the admin page root.
	 */
	public function render_page(): void {
		echo '<div class="wrap merchant-ops-console-admin-wrap"><div id="merchant-ops-console-root"></div></div>';
	}
}
