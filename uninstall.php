<?php
/**
 * Clean up plugin metadata on uninstall.
 *
 * @package MerchantOpsConsole
 */

declare( strict_types=1 );

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

global $wpdb;

$meta_keys = array(
	'_merchant_ops_console_triage_status',
	'_merchant_ops_console_triage_issue',
	'_merchant_ops_console_last_summary',
	'_merchant_ops_console_last_triaged_at',
	'_merchant_ops_console_last_triaged_by',
);

foreach ( $meta_keys as $meta_key ) {
	$wpdb->delete( $wpdb->postmeta, array( 'meta_key' => $meta_key ), array( '%s' ) );
}

