<?php
/**
 * Order screen enhancements for risk visibility.
 *
 * @package MerchantOpsConsole
 */

declare( strict_types=1 );

namespace MerchantOpsConsole\Admin;

use WC_Order;
use MerchantOpsConsole\Contracts\ServiceContract;
use MerchantOpsConsole\Support\Html;
use MerchantOpsConsole\WooCommerce\OrderInsightsService;

final class OrderScreen implements ServiceContract {
	private OrderInsightsService $order_insights;

	public function __construct( OrderInsightsService $order_insights ) {
		$this->order_insights = $order_insights;
	}

	/**
	 * Registers hooks on both legacy and HPOS order screens.
	 */
	public function register(): void {
		add_filter( 'manage_edit-shop_order_columns', array( $this, 'add_order_column' ) );
		add_action( 'manage_shop_order_posts_custom_column', array( $this, 'render_legacy_column' ), 10, 2 );
		add_filter( 'manage_woocommerce_page_wc-orders_columns', array( $this, 'add_order_column' ) );
		add_action( 'manage_woocommerce_page_wc-orders_custom_column', array( $this, 'render_hpos_column' ), 10, 2 );
		add_action( 'admin_head', array( $this, 'print_badge_styles' ) );
	}

	/**
	 * Adds the risk column.
	 *
	 * @param array<string, string> $columns Existing columns.
	 * @return array<string, string>
	 */
	public function add_order_column( array $columns ): array {
		$updated_columns = array();

		foreach ( $columns as $key => $label ) {
			$updated_columns[ $key ] = $label;

			if ( 'order_status' === $key ) {
				$updated_columns['woo_ops_console_risk'] = __( 'Ops risk', 'merchant-ops-console' );
			}
		}

		if ( ! isset( $updated_columns['woo_ops_console_risk'] ) ) {
			$updated_columns['woo_ops_console_risk'] = __( 'Ops risk', 'merchant-ops-console' );
		}

		return $updated_columns;
	}

	/**
	 * Renders the legacy order column.
	 */
	public function render_legacy_column( string $column_name, int $post_id ): void {
		if ( 'woo_ops_console_risk' !== $column_name ) {
			return;
		}

		$order = wc_get_order( $post_id );

		if ( ! $order instanceof WC_Order ) {
			return;
		}

		$this->render_badge( $order );
	}

	/**
	 * Renders the HPOS order column.
	 *
	 * @param string          $column_name Column key.
	 * @param WC_Order|object $order_or_row Order object or screen row.
	 */
	public function render_hpos_column( string $column_name, $order_or_row ): void {
		if ( 'woo_ops_console_risk' !== $column_name ) {
			return;
		}

		$order = $order_or_row instanceof WC_Order ? $order_or_row : wc_get_order( $order_or_row->get_id() );

		if ( ! $order instanceof WC_Order ) {
			return;
		}

		$this->render_badge( $order );
	}

	/**
	 * Prints lightweight badge styles on Woo order screens.
	 */
	public function print_badge_styles(): void {
		$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;

		if ( ! $screen || ! in_array( $screen->id, array( 'edit-shop_order', 'woocommerce_page_wc-orders' ), true ) ) {
			return;
		}
		?>
		<style>
			.merchant-ops-console-risk-badge{display:inline-flex;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:600}
			.merchant-ops-console-risk-badge--healthy{background:#dff6e8;color:#0a7a45}
			.merchant-ops-console-risk-badge--warning{background:#fff0da;color:#a55a06}
			.merchant-ops-console-risk-badge--critical{background:#fee2e2;color:#b42318}
		</style>
		<?php
	}

	/**
	 * Outputs a small badge for the order list.
	 */
	private function render_badge( WC_Order $order ): void {
		$order_data = $this->order_insights->build_order_record( $order );
		$class_name = Html::class_names(
			array(
				'merchant-ops-console-risk-badge',
				'merchant-ops-console-risk-badge--' . sanitize_html_class( $order_data['riskTone'] ),
			)
		);

		printf(
			'<span class="%1$s">%2$s</span>',
			esc_attr( $class_name ),
			esc_html( sprintf( __( '%1$d · %2$s', 'merchant-ops-console' ), $order_data['riskScore'], $order_data['riskLabel'] ) )
		);
	}
}
