<?php
/**
 * PSR-4 style autoloader for the plugin namespace.
 *
 * @package WooOpsConsole
 */

declare( strict_types=1 );

namespace WooOpsConsole;

final class Autoloader {
	/**
	 * Registers the autoloader callback.
	 */
	public static function register(): void {
		spl_autoload_register( array( __CLASS__, 'autoload' ) );
	}

	/**
	 * Loads classes from the WooOpsConsole namespace.
	 */
	private static function autoload( string $class ): void {
		$prefix = __NAMESPACE__ . '\\';

		if ( 0 !== strpos( $class, $prefix ) ) {
			return;
		}

		$relative_class = substr( $class, strlen( $prefix ) );
		$relative_path  = str_replace( '\\', DIRECTORY_SEPARATOR, $relative_class );
		$file_path      = WOO_OPS_CONSOLE_PATH . 'src/php/' . $relative_path . '.php';

		if ( is_readable( $file_path ) ) {
			require_once $file_path;
		}
	}
}