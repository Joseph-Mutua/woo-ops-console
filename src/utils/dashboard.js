export function filterOrders( orders, issueFilter, searchTerm ) {
	const normalizedTerm = ( searchTerm || '' ).trim().toLowerCase();

	return orders.filter( ( order ) => {
		const matchesIssue =
			! issueFilter || order.issueKeys.includes( issueFilter );
		const haystack = [
			order.orderNumber,
			order.customer,
			order.status,
			order.location,
			...( order.issues || [] ).map( ( issue ) => issue.label ),
		]
			.join( ' ' )
			.toLowerCase();

		const matchesSearch =
			! normalizedTerm || haystack.includes( normalizedTerm );

		return matchesIssue && matchesSearch;
	} );
}

export function buildIssueBreakdown( orders ) {
	const counts = new Map();

	orders.forEach( ( order ) => {
		order.issues.forEach( ( issue ) => {
			counts.set( issue.label, ( counts.get( issue.label ) || 0 ) + 1 );
		} );
	} );

	return Array.from( counts.entries() )
		.map( ( [ label, count ] ) => ( { label, count } ) )
		.sort( ( left, right ) => right.count - left.count );
}

export function buildCsv( orders ) {
	const header = [
		'Order',
		'Customer',
		'Risk score',
		'Issues',
		'Status',
		'Total',
	];
	const rows = orders.map( ( order ) => [
		order.orderNumber,
		order.customer,
		String( order.riskScore ),
		order.issues.map( ( issue ) => issue.label ).join( '; ' ),
		order.status,
		String( order.total ),
	] );

	return [ header, ...rows ]
		.map( ( row ) =>
			row
				.map(
					( cell ) => `"${ String( cell ).replaceAll( '"', '""' ) }"`
				)
				.join( ',' )
		)
		.join( '\n' );
}

