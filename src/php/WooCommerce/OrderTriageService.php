<?php
/**
 * Bulk triage actions for flagged WooCommerce orders.
 *
 * @package MerchantOpsConsole
 */

declare( strict_types=1 );

namespace MerchantOpsConsole\WooCommerce;

use WC_Order;

final class OrderTriageService {
	private OrderInsightsService $order_insights;

	public function __construct( OrderInsightsService $order_insights ) {
		$this->order_insights = $order_insights;
	}

	/**
	 * Applies a bulk action to multiple orders.
	 *
	 * @param array<int, int> $order_ids Order ids.
	 * @return array<string, mixed>
	 */
	public function apply_bulk_action( array $order_ids, string $action, string $issue_type = '', string $note = '' ): array {
		$updated_orders = array();
		$note           = sanitize_textarea_field( $note );
		$issue_type     = sanitize_key( $issue_type );

		foreach ( $order_ids as $order_id ) {
			$order = wc_get_order( $order_id );

			if ( ! $order instanceof WC_Order ) {
				continue;
			}

			if ( 'mark-review' === $action ) {
				$order->update_meta_data( '_merchant_ops_console_triage_status', 'needs-review' );
				$order->update_meta_data( '_merchant_ops_console_triage_issue', $issue_type );
			}

			if ( $note ) {
				$order->add_order_note( $note, false );
			}

			$order->update_meta_data( '_merchant_ops_console_last_triaged_at', gmdate( 'c' ) );
			$order->update_meta_data( '_merchant_ops_console_last_triaged_by', get_current_user_id() );
			$order->save();

			$updated_orders[] = $this->order_insights->build_order_record( $order );
		}

		return array(
			'updated' => $updated_orders,
			'count'   => count( $updated_orders ),
		);
	}
}
