<?php
/**
 * REST API for dashboard refresh and triage actions.
 *
 * @package MerchantOpsConsole
 */

declare( strict_types=1 );

namespace MerchantOpsConsole\WooCommerce;

use WP_REST_Request;
use WP_REST_Response;
use MerchantOpsConsole\Contracts\ServiceContract;

final class RestController implements ServiceContract {
	private OrderInsightsService $order_insights;
	private OrderTriageService $order_triage;

	public function __construct( OrderInsightsService $order_insights, OrderTriageService $order_triage ) {
		$this->order_insights = $order_insights;
		$this->order_triage   = $order_triage;
	}

	/**
	 * Registers routes.
	 */
	public function register(): void {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Registers the plugin REST routes.
	 */
	public function register_routes(): void {
		register_rest_route(
			'merchant-ops-console/v1',
			'/dashboard',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_dashboard' ),
				'permission_callback' => array( $this, 'can_manage_orders' ),
			)
		);

		register_rest_route(
			'merchant-ops-console/v1',
			'/triage',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'triage_orders' ),
				'permission_callback' => array( $this, 'can_manage_orders' ),
				'args'                => array(
					'orderIds'     => array(
						'type'     => 'array',
						'required' => true,
					),
					'action'       => array(
						'type'     => 'string',
						'required' => true,
					),
					'issueType'    => array(
						'type'     => 'string',
						'required' => false,
					),
					'internalNote' => array(
						'type'     => 'string',
						'required' => false,
					),
				),
			)
		);

		register_rest_route(
			'merchant-ops-console/v1',
			'/summary/(?P<order_id>\\d+)',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'get_issue_summary' ),
				'permission_callback' => array( $this, 'can_manage_orders' ),
			)
		);
	}

	/**
	 * Permission callback.
	 */
	public function can_manage_orders(): bool {
		return current_user_can( 'manage_woocommerce' );
	}

	/**
	 * Returns the dashboard payload.
	 */
	public function get_dashboard(): WP_REST_Response {
		return new WP_REST_Response( $this->order_insights->get_dashboard_payload() );
	}

	/**
	 * Applies triage actions.
	 */
	public function triage_orders( WP_REST_Request $request ): WP_REST_Response {
		$order_ids = array_values(
			array_filter(
				array_map( 'intval', (array) $request->get_param( 'orderIds' ) )
			)
		);

		$result = $this->order_triage->apply_bulk_action(
			$order_ids,
			sanitize_key( (string) $request->get_param( 'action' ) ),
			sanitize_key( (string) $request->get_param( 'issueType' ) ),
			(string) $request->get_param( 'internalNote' )
		);

		return new WP_REST_Response(
			array(
				'result'    => $result,
				'dashboard' => $this->order_insights->get_dashboard_payload(),
			)
		);
	}

	/**
	 * Returns an issue summary for a single order.
	 */
	public function get_issue_summary( WP_REST_Request $request ): WP_REST_Response {
		$order_id = (int) $request->get_param( 'order_id' );

		return new WP_REST_Response(
			array(
				'orderId' => $order_id,
				'summary' => $this->order_insights->get_issue_summary( $order_id ),
			)
		);
	}
}
