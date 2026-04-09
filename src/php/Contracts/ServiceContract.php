<?php
/**
 * Service contract for plugin bootstrapping.
 *
 * @package MerchantOpsConsole
 */

declare( strict_types=1 );

namespace MerchantOpsConsole\Contracts;

interface ServiceContract {
	/**
	 * Registers hooks for the service.
	 */
	public function register(): void;
}
