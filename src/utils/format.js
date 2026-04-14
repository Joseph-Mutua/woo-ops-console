export function formatCurrency( value, currency = 'USD' ) {
	return new Intl.NumberFormat( 'en-US', {
		style: 'currency',
		currency,
		maximumFractionDigits: 2,
	} ).format( Number( value || 0 ) );
}

export function formatDate( value ) {
	if ( ! value ) {
		return 'Unknown';
	}

	return new Intl.DateTimeFormat( 'en-US', {
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
	} ).format( new Date( value ) );
}

export function getToneLabel( tone ) {
	if ( 'critical' === tone ) {
		return 'High';
	}

	if ( 'warning' === tone ) {
		return 'Watch';
	}

	return 'Stable';
}
