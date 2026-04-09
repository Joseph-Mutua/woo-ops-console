<?php
/**
 * Small HTML helpers for safe output.
 *
 * @package WooOpsConsole
 */

declare( strict_types=1 );

namespace WooOpsConsole\Support;

final class Html {
	/**
	 * Returns non-empty class names as a single string.
	 *
	 * @param array<int, string> $class_names Candidate classes.
	 */
	public static function class_names( array $class_names ): string {
		$class_names = array_filter(
			array_map(
				static fn( string $class_name ): string => trim( $class_name ),
				$class_names
			)
		);

		return implode( ' ', array_unique( $class_names ) );
	}
}