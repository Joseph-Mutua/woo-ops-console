<?php
/**
 * Builds dashboard insights and order risk records.
 *
 * @package MerchantOpsConsole
 */

declare( strict_types=1 );

namespace MerchantOpsConsole\WooCommerce;

use WC_Order;
use WC_Order_Item_Product;

final class OrderInsightsService {
	private const ORDER_LIMIT = 30;

	/**
	 * Returns the complete dashboard payload for the admin app.
	 *
	 * @return array<string, mixed>
	 */
	public function get_dashboard_payload(): array {
		$orders      = $this->get_orders();
		$issue_types = $this->collect_issue_filters( $orders );
		$metrics     = $this->build_metric_cards( $orders );

		return array(
			'generatedAt' => gmdate( 'c' ),
			'isDemo'      => $this->is_demo_mode(),
			'metrics'     => $metrics,
			'issueTypes'  => $issue_types,
			'orders'      => $orders,
			'triage'      => array(
				'actions' => array(
					array(
						'value' => 'mark-review',
						'label' => __( 'Mark for review', 'merchant-ops-console' ),
					),
				),
			),
		);
	}

	/**
	 * Returns a single generated summary.
	 */
	public function get_issue_summary( int $order_id ): string {
		$order = wc_get_order( $order_id );

		if ( ! $order instanceof WC_Order ) {
			return '';
		}

		$record  = $this->build_order_record( $order );
		$summary = sprintf(
			/* translators: 1: order number, 2: issues, 3: risk score */
			__( 'Order %1$s is flagged because of %2$s. Current fulfillment risk score: %3$d/100.', 'merchant-ops-console' ),
			$record['orderNumber'],
			implode( ', ', wp_list_pluck( $record['issues'], 'label' ) ),
			$record['riskScore']
		);

		/**
		 * Filters the generated issue summary so external AI providers can replace it.
		 *
		 * @param string               $summary Generated summary.
		 * @param array<string, mixed> $record Normalized order record.
		 * @param WC_Order             $order WooCommerce order object.
		 */
		return (string) apply_filters( 'woo_ops_console_issue_summary', $summary, $record, $order );
	}

	/**
	 * Builds a normalized order record.
	 *
	 * @return array<string, mixed>
	 */
	public function build_order_record( WC_Order $order ): array {
		$issues = $this->detect_issues( $order );
		$score  = min( 100, array_sum( wp_list_pluck( $issues, 'weight' ) ) );

		return array(
			'id'              => $order->get_id(),
			'orderNumber'     => $order->get_order_number(),
			'customer'        => trim( $order->get_formatted_billing_full_name() ) ?: __( 'Guest customer', 'merchant-ops-console' ),
			'createdAt'       => $order->get_date_created() ? $order->get_date_created()->date_i18n( DATE_ATOM ) : '',
			'modifiedAt'      => $order->get_date_modified() ? $order->get_date_modified()->date_i18n( DATE_ATOM ) : '',
			'status'          => wc_get_order_status_name( $order->get_status() ),
			'currency'        => $order->get_currency(),
			'total'           => (float) $order->get_total(),
			'riskScore'       => $score,
			'riskLabel'       => $score >= 70 ? __( 'High', 'merchant-ops-console' ) : ( $score >= 40 ? __( 'Watch', 'merchant-ops-console' ) : __( 'Stable', 'merchant-ops-console' ) ),
			'riskTone'        => $score >= 70 ? 'critical' : ( $score >= 40 ? 'warning' : 'healthy' ),
			'issueCount'      => count( $issues ),
			'issues'          => $issues,
			'issueKeys'       => wp_list_pluck( $issues, 'key' ),
			'paymentMethod'   => $order->get_payment_method_title() ?: __( 'Manual', 'merchant-ops-console' ),
			'paymentStatus'   => $this->get_payment_state( $order ),
			'shippingStatus'  => $this->get_shipping_state( $order ),
			'triageStatus'    => sanitize_key( (string) $order->get_meta( '_woo_ops_console_triage_status', true ) ) ?: 'untriaged',
			'triageIssue'     => sanitize_key( (string) $order->get_meta( '_woo_ops_console_triage_issue', true ) ),
			'location'        => trim( implode( ', ', array_filter( array( $order->get_shipping_city(), $order->get_shipping_country() ) ) ) ),
			'customerEdits'   => $this->estimate_customer_edits( $order ),
			'aiSummary'       => sanitize_text_field( (string) $order->get_meta( '_woo_ops_console_last_summary', true ) ),
		);
	}

	/**
	 * Determines whether demo mode is active.
	 */
	private function is_demo_mode(): bool {
		return ! class_exists( 'WooCommerce' );
	}

	/**
	 * Returns normalized orders or sample data.
	 *
	 * @return array<int, array<string, mixed>>
	 */
	private function get_orders(): array {
		if ( ! class_exists( 'WooCommerce' ) ) {
			return $this->get_sample_orders();
		}

		$order_ids = wc_get_orders(
			array(
				'limit'   => self::ORDER_LIMIT,
				'orderby' => 'date',
				'order'   => 'DESC',
				'return'  => 'ids',
				'status'  => array( 'pending', 'processing', 'on-hold', 'failed', 'refunded' ),
			)
		);

		if ( empty( $order_ids ) ) {
			return $this->get_sample_orders();
		}

		$orders = array();

		foreach ( $order_ids as $order_id ) {
			$order = wc_get_order( $order_id );

			if ( ! $order instanceof WC_Order ) {
				continue;
			}

			$record = $this->build_order_record( $order );

			if ( 0 === $record['issueCount'] ) {
				continue;
			}

			$orders[] = $record;
		}

		return empty( $orders ) ? $this->get_sample_orders() : $orders;
	}

	/**
	 * Detects operational issues for a Woo order.
	 *
	 * @return array<int, array{key: string, label: string, description: string, weight: int}>
	 */
	private function detect_issues( WC_Order $order ): array {
		$issues = array();

		if ( in_array( $order->get_status(), array( 'failed', 'pending' ), true ) ) {
			$issues[] = array(
				'key'         => 'failed-payment',
				'label'       => __( 'Failed payment', 'merchant-ops-console' ),
				'description' => __( 'Payment has not cleared and the order still requires intervention.', 'merchant-ops-console' ),
				'weight'      => 36,
			);
		}

		if ( $this->get_payment_retry_count( $order ) >= 3 ) {
			$issues[] = array(
				'key'         => 'retry-behavior',
				'label'       => __( 'Suspicious retry behavior', 'merchant-ops-console' ),
				'description' => __( 'The order shows repeated payment attempts and may need manual review.', 'merchant-ops-console' ),
				'weight'      => 18,
			);
		}

		if ( $this->is_long_unfulfilled( $order ) ) {
			$issues[] = array(
				'key'         => 'long-unfulfilled',
				'label'       => __( 'Long-unfulfilled order', 'merchant-ops-console' ),
				'description' => __( 'The order is still waiting for fulfillment beyond the expected threshold.', 'merchant-ops-console' ),
				'weight'      => 22,
			);
		}

		if ( $this->has_missing_shipping_details( $order ) ) {
			$issues[] = array(
				'key'         => 'missing-shipping',
				'label'       => __( 'Missing shipping details', 'merchant-ops-console' ),
				'description' => __( 'Critical shipping fields are incomplete for a shippable order.', 'merchant-ops-console' ),
				'weight'      => 14,
			);
		}

		if ( $this->has_refund_anomaly( $order ) ) {
			$issues[] = array(
				'key'         => 'refund-anomaly',
				'label'       => __( 'Refund anomaly', 'merchant-ops-console' ),
				'description' => __( 'The refund profile is unusually high or fragmented for this order.', 'merchant-ops-console' ),
				'weight'      => 28,
			);
		}

		if ( $this->estimate_customer_edits( $order ) >= 2 ) {
			$issues[] = array(
				'key'         => 'repeated-edits',
				'label'       => __( 'Repeated customer edits', 'merchant-ops-console' ),
				'description' => __( 'Order details have changed multiple times after placement.', 'merchant-ops-console' ),
				'weight'      => 12,
			);
		}

		if ( $this->has_inventory_mismatch( $order ) ) {
			$issues[] = array(
				'key'         => 'inventory-mismatch',
				'label'       => __( 'Inventory mismatch', 'merchant-ops-console' ),
				'description' => __( 'At least one line item points to constrained or missing stock.', 'merchant-ops-console' ),
				'weight'      => 22,
			);
		}

		return $issues;
	}

	/**
	 * Returns metric cards for the dashboard.
	 *
	 * @param array<int, array<string, mixed>> $orders Normalized orders.
	 * @return array<int, array<string, string>>
	 */
	private function build_metric_cards( array $orders ): array {
		$high_risk        = count( array_filter( $orders, static fn( array $order ): bool => $order['riskScore'] >= 70 ) );
		$pending_too_long = count( array_filter( $orders, static fn( array $order ): bool => in_array( 'long-unfulfilled', $order['issueKeys'], true ) ) );
		$refund_spike     = count( array_filter( $orders, static fn( array $order ): bool => in_array( 'refund-anomaly', $order['issueKeys'], true ) ) );
		$failed_checkout  = count( array_filter( $orders, static fn( array $order ): bool => in_array( 'failed-payment', $order['issueKeys'], true ) ) );

		return array(
			array(
				'label' => __( 'Orders at risk', 'merchant-ops-console' ),
				'value' => (string) $high_risk,
				'delta' => __( 'Prioritize same-day review', 'merchant-ops-console' ),
				'tone'  => 'critical',
			),
			array(
				'label' => __( 'Pending too long', 'merchant-ops-console' ),
				'value' => (string) $pending_too_long,
				'delta' => __( 'Fulfillment drag across aging orders', 'merchant-ops-console' ),
				'tone'  => 'warning',
			),
			array(
				'label' => __( 'Refund spike', 'merchant-ops-console' ),
				'value' => (string) $refund_spike,
				'delta' => __( 'Watch post-purchase friction', 'merchant-ops-console' ),
				'tone'  => 'warning',
			),
			array(
				'label' => __( 'Failed checkout trend', 'merchant-ops-console' ),
				'value' => (string) $failed_checkout,
				'delta' => __( 'Payment recovery needed', 'merchant-ops-console' ),
				'tone'  => 'positive',
			),
		);
	}

	/**
	 * Returns the payment state label.
	 */
	private function get_payment_state( WC_Order $order ): string {
		if ( $order->is_paid() ) {
			return __( 'Confirmed', 'merchant-ops-console' );
		}

		if ( 'failed' === $order->get_status() ) {
			return __( 'Failed', 'merchant-ops-console' );
		}

		return __( 'Awaiting payment', 'merchant-ops-console' );
	}

	/**
	 * Returns the shipping state label.
	 */
	private function get_shipping_state( WC_Order $order ): string {
		if ( 'completed' === $order->get_status() ) {
			return __( 'Completed', 'merchant-ops-console' );
		}

		if ( in_array( $order->get_status(), array( 'processing', 'on-hold' ), true ) ) {
			return __( 'In flight', 'merchant-ops-console' );
		}

		return __( 'Not started', 'merchant-ops-console' );
	}

	/**
	 * Estimates payment retry count from common meta fields.
	 */
	private function get_payment_retry_count( WC_Order $order ): int {
		$candidates = array(
			(int) $order->get_meta( '_payment_retries', true ),
			(int) $order->get_meta( '_retry_count', true ),
			(int) $order->get_meta( '_woo_ops_retry_count', true ),
		);

		return max( $candidates );
	}

	/**
	 * Checks whether the order has exceeded a fulfillment threshold.
	 */
	private function is_long_unfulfilled( WC_Order $order ): bool {
		if ( ! $order->get_date_created() ) {
			return false;
		}

		if ( ! in_array( $order->get_status(), array( 'processing', 'on-hold' ), true ) ) {
			return false;
		}

		$age_seconds = time() - $order->get_date_created()->getTimestamp();

		return $age_seconds >= DAY_IN_SECONDS * 3;
	}

	/**
	 * Checks whether shipping fields are incomplete for a physical order.
	 */
	private function has_missing_shipping_details( WC_Order $order ): bool {
		if ( ! $order->needs_shipping_address() ) {
			return false;
		}

		$required_fields = array(
			$order->get_shipping_first_name(),
			$order->get_shipping_last_name(),
			$order->get_shipping_address_1(),
			$order->get_shipping_city(),
			$order->get_shipping_country(),
		);

		foreach ( $required_fields as $field_value ) {
			if ( '' === trim( (string) $field_value ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Checks for a risky refund pattern.
	 */
	private function has_refund_anomaly( WC_Order $order ): bool {
		$refund_total = (float) $order->get_total_refunded();

		if ( $refund_total <= 0 ) {
			return false;
		}

		$total = max( 1, (float) $order->get_total() );

		return $refund_total >= $total * 0.7 || count( $order->get_refunds() ) > 1;
	}

	/**
	 * Estimates whether order edits happened repeatedly.
	 */
	private function estimate_customer_edits( WC_Order $order ): int {
		$manual_edits = (int) $order->get_meta( '_woo_ops_customer_edits', true );

		if ( $manual_edits > 0 ) {
			return $manual_edits;
		}

		if ( ! $order->get_date_created() || ! $order->get_date_modified() ) {
			return 0;
		}

		$delta = $order->get_date_modified()->getTimestamp() - $order->get_date_created()->getTimestamp();

		return $delta >= HOUR_IN_SECONDS * 6 ? 2 : 0;
	}

	/**
	 * Detects line items that appear mismatched with stock.
	 */
	private function has_inventory_mismatch( WC_Order $order ): bool {
		foreach ( $order->get_items() as $item ) {
			if ( ! $item instanceof WC_Order_Item_Product ) {
				continue;
			}

			$product = $item->get_product();

			if ( ! $product ) {
				continue;
			}

			if ( $product->managing_stock() && null !== $product->get_stock_quantity() && $product->get_stock_quantity() < $item->get_quantity() ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Builds issue filters from normalized orders.
	 *
	 * @param array<int, array<string, mixed>> $orders Orders.
	 * @return array<int, array<string, string|int>>
	 */
	private function collect_issue_filters( array $orders ): array {
		$counts = array();

		foreach ( $orders as $order ) {
			foreach ( $order['issues'] as $issue ) {
				if ( ! isset( $counts[ $issue['key'] ] ) ) {
					$counts[ $issue['key'] ] = array(
						'value' => $issue['key'],
						'label' => $issue['label'],
						'count' => 0,
					);
				}

				$counts[ $issue['key'] ]['count']++;
			}
		}

		return array_values( $counts );
	}

	/**
	 * Returns sample records for demo mode or empty stores.
	 *
	 * @return array<int, array<string, mixed>>
	 */
	private function get_sample_orders(): array {
		return array(
			array(
				'id'             => 3104,
				'orderNumber'    => '3104',
				'customer'       => 'Nadia Jensen',
				'createdAt'      => gmdate( DATE_ATOM, strtotime( '-5 days' ) ),
				'modifiedAt'     => gmdate( DATE_ATOM, strtotime( '-8 hours' ) ),
				'status'         => 'Processing',
				'currency'       => 'USD',
				'total'          => 194.00,
				'riskScore'      => 78,
				'riskLabel'      => 'High',
				'riskTone'       => 'critical',
				'issueCount'     => 3,
				'issues'         => array(
					array(
						'key'         => 'long-unfulfilled',
						'label'       => 'Long-unfulfilled order',
						'description' => 'Order has exceeded the three-day fulfillment threshold.',
						'weight'      => 22,
					),
					array(
						'key'         => 'missing-shipping',
						'label'       => 'Missing shipping details',
						'description' => 'Apartment field and destination instructions are incomplete.',
						'weight'      => 14,
					),
					array(
						'key'         => 'repeated-edits',
						'label'       => 'Repeated customer edits',
						'description' => 'Address and contact details changed twice after payment.',
						'weight'      => 12,
					),
				),
				'issueKeys'      => array( 'long-unfulfilled', 'missing-shipping', 'repeated-edits' ),
				'paymentMethod'  => 'Stripe',
				'paymentStatus'  => 'Confirmed',
				'shippingStatus' => 'In flight',
				'triageStatus'   => 'needs-review',
				'triageIssue'    => 'missing-shipping',
				'location'       => 'Berlin, DE',
				'customerEdits'  => 2,
				'aiSummary'      => 'The order is paid, but fulfillment is drifting because the shipping details changed after placement and the package still lacks a final handoff confirmation.',
			),
			array(
				'id'             => 3110,
				'orderNumber'    => '3110',
				'customer'       => 'Marcus Webb',
				'createdAt'      => gmdate( DATE_ATOM, strtotime( '-18 hours' ) ),
				'modifiedAt'     => gmdate( DATE_ATOM, strtotime( '-2 hours' ) ),
				'status'         => 'Failed',
				'currency'       => 'USD',
				'total'          => 86.50,
				'riskScore'      => 66,
				'riskLabel'      => 'Watch',
				'riskTone'       => 'warning',
				'issueCount'     => 2,
				'issues'         => array(
					array(
						'key'         => 'failed-payment',
						'label'       => 'Failed payment',
						'description' => 'Payment authorization failed before capture.',
						'weight'      => 36,
					),
					array(
						'key'         => 'retry-behavior',
						'label'       => 'Suspicious retry behavior',
						'description' => 'The customer attempted checkout four times in quick succession.',
						'weight'      => 18,
					),
				),
				'issueKeys'      => array( 'failed-payment', 'retry-behavior' ),
				'paymentMethod'  => 'PayPal',
				'paymentStatus'  => 'Failed',
				'shippingStatus' => 'Not started',
				'triageStatus'   => 'untriaged',
				'triageIssue'    => '',
				'location'       => 'Austin, US',
				'customerEdits'  => 0,
				'aiSummary'      => 'Checkout friction is concentrated in payment retries. A manual recovery note and gateway review may prevent another failed attempt.',
			),
			array(
				'id'             => 3098,
				'orderNumber'    => '3098',
				'customer'       => 'Ritika Shah',
				'createdAt'      => gmdate( DATE_ATOM, strtotime( '-2 days' ) ),
				'modifiedAt'     => gmdate( DATE_ATOM, strtotime( '-7 hours' ) ),
				'status'         => 'Refunded',
				'currency'       => 'USD',
				'total'          => 260.00,
				'riskScore'      => 54,
				'riskLabel'      => 'Watch',
				'riskTone'       => 'warning',
				'issueCount'     => 2,
				'issues'         => array(
					array(
						'key'         => 'refund-anomaly',
						'label'       => 'Refund anomaly',
						'description' => 'Two refunds were issued for most of the order value.',
						'weight'      => 28,
					),
					array(
						'key'         => 'inventory-mismatch',
						'label'       => 'Inventory mismatch',
						'description' => 'One item is now oversold relative to the original allocation.',
						'weight'      => 22,
					),
				),
				'issueKeys'      => array( 'refund-anomaly', 'inventory-mismatch' ),
				'paymentMethod'  => 'Manual capture',
				'paymentStatus'  => 'Confirmed',
				'shippingStatus' => 'Not started',
				'triageStatus'   => 'needs-review',
				'triageIssue'    => 'refund-anomaly',
				'location'       => 'Leicester, UK',
				'customerEdits'  => 1,
				'aiSummary'      => 'Refund behavior is larger than expected for a fresh order and overlaps with inventory pressure, which suggests operational review before the same SKU is sold again.',
			),
		);
	}
}
