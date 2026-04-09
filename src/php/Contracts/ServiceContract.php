<?php
/**
 * Service contract for plugin bootstrapping.
 *
 * @package WooOpsConsole
 */

declare( strict_types=1 );

namespace WooOpsConsole\Contracts;

interface ServiceContract {
	/**
	 * Registers hooks for the service.
	 */
	public function register(): void;
}