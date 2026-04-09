import {
	buildCsv,
	buildIssueBreakdown,
	filterOrders,
} from '../../src/utils/dashboard';

const orders = [
	{
		id: 1,
		orderNumber: '1001',
		customer: 'Nadia Jensen',
		status: 'Processing',
		location: 'Berlin, DE',
		issues: [
			{ key: 'missing-shipping', label: 'Missing shipping details' },
			{ key: 'long-unfulfilled', label: 'Long-unfulfilled order' },
		],
		issueKeys: [ 'missing-shipping', 'long-unfulfilled' ],
		total: 194,
	},
	{
		id: 2,
		orderNumber: '1002',
		customer: 'Marcus Webb',
		status: 'Failed',
		location: 'Austin, US',
		issues: [ { key: 'failed-payment', label: 'Failed payment' } ],
		issueKeys: [ 'failed-payment' ],
		total: 86.5,
	},
];

describe( 'dashboard utilities', () => {
	it( 'filters orders by issue and search term', () => {
		expect( filterOrders( orders, 'failed-payment', '' ) ).toHaveLength(
			1
		);
		expect( filterOrders( orders, '', 'nadia' ) ).toHaveLength( 1 );
		expect(
			filterOrders( orders, 'missing-shipping', 'berlin' )
		).toHaveLength( 1 );
	} );

	it( 'builds issue breakdown counts', () => {
		expect( buildIssueBreakdown( orders ) ).toEqual( [
			{ label: 'Missing shipping details', count: 1 },
			{ label: 'Long-unfulfilled order', count: 1 },
			{ label: 'Failed payment', count: 1 },
		] );
	} );

	it( 'builds a csv export', () => {
		const csv = buildCsv( orders );

		expect( csv ).toContain(
			'"Order","Customer","Risk score","Issues","Status","Total"'
		);
		expect( csv ).toContain( '"1001"' );
		expect( csv ).toContain(
			'"Missing shipping details; Long-unfulfilled order"'
		);
	} );
} );

