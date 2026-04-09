import apiFetch from '@wordpress/api-fetch';
import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { buildCsv, buildIssueBreakdown, filterOrders } from './utils/dashboard';
import { formatCurrency, formatDate } from './utils/format';

const NAV_ITEMS = [
	{
		value: 'exceptions',
		label: __( 'Exceptions', 'merchant-ops-console' ),
		icon: 'warning',
	},
	{
		value: 'bulk-triage',
		label: __( 'Bulk Triage', 'merchant-ops-console' ),
		icon: 'list',
	},
	{
		value: 'risk-analysis',
		label: __( 'Risk Analysis', 'merchant-ops-console' ),
		icon: 'shield',
	},
	{
		value: 'insights',
		label: __( 'Insights', 'merchant-ops-console' ),
		icon: 'chart',
	},
];

const ISSUE_ACTIONS = {
	'failed-payment': __( 'Retry payment recovery', 'merchant-ops-console' ),
	'retry-behavior': __( 'Review fraud signal', 'merchant-ops-console' ),
	'long-unfulfilled': __( 'Escalate fulfillment', 'merchant-ops-console' ),
	'missing-shipping': __( 'Request shipping details', 'merchant-ops-console' ),
	'refund-anomaly': __( 'Audit refund pattern', 'merchant-ops-console' ),
	'repeated-edits': __( 'Review order edits', 'merchant-ops-console' ),
	'inventory-mismatch': __( 'Resolve stock conflict', 'merchant-ops-console' ),
};

function SymbolIcon( { name, className = '' } ) {
	const baseProps = {
		'aria-hidden': true,
		className: `woo-ops-symbol ${ className }`.trim(),
		fill: 'none',
		focusable: 'false',
		stroke: 'currentColor',
		strokeLinecap: 'round',
		strokeLinejoin: 'round',
		strokeWidth: '1.8',
		viewBox: '0 0 24 24',
	};

	switch ( name ) {
		case 'analytics':
			return (
				<svg { ...baseProps }>
					<path d="M4 19h16" />
					<path d="M7 15V9" />
					<path d="M12 15V5" />
					<path d="M17 15v-3" />
				</svg>
			);
		case 'search':
			return (
				<svg { ...baseProps }>
					<circle cx="11" cy="11" r="6" />
					<path d="m20 20-4.2-4.2" />
				</svg>
			);
		case 'notifications':
			return (
				<svg { ...baseProps }>
					<path d="M7 10a5 5 0 1 1 10 0c0 5 2 6 2 6H5s2-1 2-6" />
					<path d="M10 19a2 2 0 0 0 4 0" />
				</svg>
			);
		case 'person':
			return (
				<svg { ...baseProps }>
					<circle cx="12" cy="8" r="3.25" />
					<path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
				</svg>
			);
		case 'warning':
			return (
				<svg { ...baseProps }>
					<path d="M12 4 3.5 19h17L12 4Z" />
					<path d="M12 9v4.25" />
					<path d="M12 16.5h.01" />
				</svg>
			);
		case 'list':
			return (
				<svg { ...baseProps }>
					<path d="M8 7h11" />
					<path d="M8 12h11" />
					<path d="M8 17h11" />
					<circle
						cx="4.5"
						cy="7"
						r="1"
						fill="currentColor"
						stroke="none"
					/>
					<circle
						cx="4.5"
						cy="12"
						r="1"
						fill="currentColor"
						stroke="none"
					/>
					<circle
						cx="4.5"
						cy="17"
						r="1"
						fill="currentColor"
						stroke="none"
					/>
				</svg>
			);
		case 'shield':
			return (
				<svg { ...baseProps }>
					<path d="M12 3.75 5.5 6v5.5c0 4.4 2.7 7.5 6.5 8.75 3.8-1.25 6.5-4.35 6.5-8.75V6L12 3.75Z" />
					<path d="m9.5 12 1.8 1.8 3.4-3.9" />
				</svg>
			);
		case 'chart':
			return (
				<svg { ...baseProps }>
					<path d="M4 19h16" />
					<path d="M6 15.5 10 12l3 2 5-6" />
				</svg>
			);
		case 'refresh':
			return (
				<svg { ...baseProps }>
					<path d="M20 11a8 8 0 0 0-14.5-4.4" />
					<path d="M4 4v4h4" />
					<path d="M4 13a8 8 0 0 0 14.5 4.4" />
					<path d="M20 20v-4h-4" />
				</svg>
			);
		case 'export':
			return (
				<svg { ...baseProps }>
					<path d="M12 4v10" />
					<path d="m8.5 10.5 3.5 3.5 3.5-3.5" />
					<path d="M5 19h14" />
				</svg>
			);
		case 'note':
			return (
				<svg { ...baseProps }>
					<path d="M6 4.75h9l3 3V19H6z" />
					<path d="M15 4.75V8h3" />
					<path d="M9 12h6" />
					<path d="M9 15h4" />
				</svg>
			);
		case 'rule':
			return (
				<svg { ...baseProps }>
					<path d="M4.5 7.5h11" />
					<path d="m13 15 2.2 2.2 4.3-4.7" />
					<path d="M4.5 12h7" />
					<path d="M4.5 16.5h5" />
				</svg>
			);
		case 'alert':
			return (
				<svg { ...baseProps }>
					<circle cx="12" cy="12" r="8" />
					<path d="M12 8v5" />
					<path d="M12 16.5h.01" />
				</svg>
			);
		case 'hourglass':
			return (
				<svg { ...baseProps }>
					<path d="M7 4.5h10" />
					<path d="M7 19.5h10" />
					<path d="M8 5c0 3 3 3.5 4 5-1 1.5-4 2-4 5" />
					<path d="M16 5c0 3-3 3.5-4 5 1 1.5 4 2 4 5" />
				</svg>
			);
		case 'payments':
			return (
				<svg { ...baseProps }>
					<rect x="4" y="6" width="16" height="12" rx="2.5" />
					<path d="M4 10.5h16" />
					<path d="M8 14.5h3" />
				</svg>
			);
		case 'checkout':
			return (
				<svg { ...baseProps }>
					<path d="M6 7h12l-1.4 5H7.2L6 7Zm0 0-.8-2H3.5" />
					<circle cx="9" cy="17.5" r="1.2" />
					<circle cx="16" cy="17.5" r="1.2" />
				</svg>
			);
		case 'chevron-right':
			return (
				<svg { ...baseProps }>
					<path d="m10 7 5 5-5 5" />
				</svg>
			);
		case 'more':
			return (
				<svg
					aria-hidden="true"
					className={ `woo-ops-symbol ${ className }`.trim() }
					fill="currentColor"
					focusable="false"
					viewBox="0 0 24 24"
				>
					<circle cx="12" cy="5" r="1.8" />
					<circle cx="12" cy="12" r="1.8" />
					<circle cx="12" cy="19" r="1.8" />
				</svg>
			);
		case 'spark':
			return (
				<svg { ...baseProps }>
					<path d="m12 4 1.8 4.6L18.5 10l-4.7 1.4L12 16l-1.8-4.6L5.5 10l4.7-1.4L12 4Z" />
				</svg>
			);
		case 'plus':
			return (
				<svg { ...baseProps }>
					<path d="M12 5v14" />
					<path d="M5 12h14" />
				</svg>
			);
		default:
			return (
				<svg { ...baseProps }>
					<circle cx="12" cy="12" r="8" />
				</svg>
			);
	}
}

function getMetricMeta( label, tone ) {
	const normalizedLabel = String( label || '' ).toLowerCase();

	if ( normalizedLabel.includes( 'pending' ) ) {
		return {
			badge: __( 'Slow', 'merchant-ops-console' ),
			icon: 'hourglass',
			iconTone: 'warning',
		};
	}

	if ( normalizedLabel.includes( 'refund' ) ) {
		return {
			badge: __( 'Watch', 'merchant-ops-console' ),
			icon: 'payments',
			iconTone: 'primary',
		};
	}

	if ( normalizedLabel.includes( 'checkout' ) ) {
		return {
			badge: __( 'Stable', 'merchant-ops-console' ),
			icon: 'checkout',
			iconTone: 'neutral',
		};
	}

	return {
		badge:
			'critical' === tone
				? __( 'Priority', 'merchant-ops-console' )
				: __( 'Watch', 'merchant-ops-console' ),
		icon: 'alert',
		iconTone: 'critical' === tone ? 'critical' : 'warning',
	};
}

function getPrimaryIssue( order ) {
	return order.issues?.[ 0 ] || null;
}

function getIssueIcon( issueKey ) {
	switch ( issueKey ) {
		case 'failed-payment':
			return 'alert';
		case 'retry-behavior':
			return 'shield';
		case 'missing-shipping':
			return 'list';
		case 'inventory-mismatch':
			return 'warning';
		case 'refund-anomaly':
			return 'payments';
		case 'long-unfulfilled':
			return 'hourglass';
		case 'repeated-edits':
			return 'note';
		default:
			return 'warning';
	}
}

function getActionLabel( issueKey ) {
	return ISSUE_ACTIONS[ issueKey ] || __( 'Review issue', 'merchant-ops-console' );
}

function getMetricLinkTarget( label ) {
	const normalizedLabel = String( label || '' ).toLowerCase();

	if ( normalizedLabel.includes( 'refund' ) ) {
		return 'insights';
	}

	if (
		normalizedLabel.includes( 'checkout' ) ||
		normalizedLabel.includes( 'pending' )
	) {
		return 'risk-analysis';
	}

	return 'exceptions';
}

function getOrderSignals( order ) {
	return [
		{
			label:
				'Confirmed' === order.paymentStatus
					? __( 'Payment confirmed', 'merchant-ops-console' )
					: __( 'Payment unsettled', 'merchant-ops-console' ),
			tone: 'Confirmed' === order.paymentStatus ? 'healthy' : 'critical',
		},
		{
			label:
				'Completed' === order.shippingStatus
					? __( 'Shipping complete', 'merchant-ops-console' )
					: __( 'Shipping delay', 'merchant-ops-console' ),
			tone: 'Completed' === order.shippingStatus ? 'healthy' : 'warning',
		},
		{
			label:
				order.customerEdits >= 2
					? __( 'Repeated customer edits', 'merchant-ops-console' )
					: __( 'Edits stable', 'merchant-ops-console' ),
			tone: order.customerEdits >= 2 ? 'warning' : 'healthy',
		},
	];
}

function getIssueSummaryLabel( issueKey ) {
	if ( 'failed-payment' === issueKey ) {
		return __( 'Payment Failure', 'merchant-ops-console' );
	}

	if ( 'retry-behavior' === issueKey ) {
		return __( 'High Risk', 'merchant-ops-console' );
	}

	if ( 'inventory-mismatch' === issueKey ) {
		return __( 'Inventory Conflict', 'merchant-ops-console' );
	}

	if ( 'missing-shipping' === issueKey ) {
		return __( 'Shipping Detail Missing', 'merchant-ops-console' );
	}

	return __( 'Needs Review', 'merchant-ops-console' );
}

function ScreenHeader( { actions, description, eyebrow, title } ) {
	return (
		<div className="woo-ops-page-header">
			<div>
				<p className="woo-ops-kicker">{ eyebrow }</p>
				<h1 className="woo-ops-page-title">{ title }</h1>
				{ description ? (
					<p className="woo-ops-page-description">{ description }</p>
				) : null }
			</div>
			<div className="woo-ops-page-actions">{ actions }</div>
		</div>
	);
}

export function App( { config } ) {
	const [ dashboard, setDashboard ] = useState(
		config.dashboard || { metrics: [], orders: [], issueTypes: [] }
	);
	const [ activeView, setActiveView ] = useState( 'exceptions' );
	const [ issueFilter, setIssueFilter ] = useState( '' );
	const [ searchTerm, setSearchTerm ] = useState( '' );
	const [ selectedOrderIds, setSelectedOrderIds ] = useState( [] );
	const [ triageAction, setTriageAction ] = useState( 'mark-review' );
	const [ internalNote, setInternalNote ] = useState( '' );
	const [ statusMessage, setStatusMessage ] = useState( '' );
	const [ loading, setLoading ] = useState( false );
	const [ summaries, setSummaries ] = useState( {} );
	const [ visibleExceptionCount, setVisibleExceptionCount ] = useState( 8 );

	const filteredOrders = useMemo(
		() => filterOrders( dashboard.orders || [], issueFilter, searchTerm ),
		[ dashboard.orders, issueFilter, searchTerm ]
	);

	const selectedOrders = useMemo(
		() =>
			filteredOrders.filter( ( order ) =>
				selectedOrderIds.includes( order.id )
			),
		[ filteredOrders, selectedOrderIds ]
	);

	const issueBreakdown = useMemo(
		() => buildIssueBreakdown( filteredOrders ),
		[ filteredOrders ]
	);

	const totalAtRiskValue = useMemo(
		() =>
			filteredOrders.reduce(
				( total, order ) => total + Number( order.total || 0 ),
				0
			),
		[ filteredOrders ]
	);

	const exceptionFeed = useMemo(
		() => filteredOrders.slice( 0, visibleExceptionCount ),
		[ filteredOrders, visibleExceptionCount ]
	);

	const criticalCount = useMemo(
		() =>
			filteredOrders.filter( ( order ) => 'critical' === order.riskTone )
				.length,
		[ filteredOrders ]
	);

	const warningCount = useMemo(
		() =>
			filteredOrders.filter( ( order ) => 'warning' === order.riskTone )
				.length,
		[ filteredOrders ]
	);

	const triageActions =
		config.dashboard?.triage?.actions || dashboard.triage?.actions || [];

	const refreshDashboard = async () => {
		setLoading( true );

		try {
			const nextDashboard = await apiFetch( {
				path: '/merchant-ops-console/v1/dashboard',
			} );
			setDashboard( nextDashboard );
			setSelectedOrderIds( [] );
			setStatusMessage(
				config.labels?.refreshed ||
					__( 'Dashboard refreshed.', 'merchant-ops-console' )
			);
		} catch ( error ) {
			setStatusMessage( error.message );
		} finally {
			setLoading( false );
		}
	};

	const toggleSelectedOrder = ( orderId ) => {
		setSelectedOrderIds( ( currentIds ) =>
			currentIds.includes( orderId )
				? currentIds.filter( ( currentId ) => currentId !== orderId )
				: [ ...currentIds, orderId ]
		);
	};

	const toggleSelectAll = () => {
		if (
			filteredOrders.length > 0 &&
			selectedOrderIds.length === filteredOrders.length
		) {
			setSelectedOrderIds( [] );
			return;
		}

		setSelectedOrderIds( filteredOrders.map( ( order ) => order.id ) );
	};

	const exportSelected = () => {
		const ordersToExport = selectedOrders.length
			? selectedOrders
			: filteredOrders;
		const csv = buildCsv( ordersToExport );
		const blob = new Blob( [ csv ], {
			type: 'text/csv;charset=utf-8;',
		} );
		const url = URL.createObjectURL( blob );
		const anchor = document.createElement( 'a' );

		anchor.href = url;
		anchor.download = 'merchant-ops-console-flagged-orders.csv';
		anchor.click();
		URL.revokeObjectURL( url );
		setStatusMessage( __( 'Flagged orders exported.', 'merchant-ops-console' ) );
	};

	const applyTriage = async () => {
		if ( ! selectedOrderIds.length ) {
			setStatusMessage(
				__(
					'Select at least one order before running triage actions.',
					'merchant-ops-console'
				)
			);
			return;
		}

		setLoading( true );

		try {
			const response = await apiFetch( {
				path: '/merchant-ops-console/v1/triage',
				method: 'POST',
				data: {
					action: triageAction,
					internalNote,
					issueType: issueFilter,
					orderIds: selectedOrderIds,
				},
			} );

			setDashboard( response.dashboard );
			setStatusMessage(
				config.labels?.triaged ||
					__( 'Orders updated.', 'merchant-ops-console' )
			);
			setInternalNote( '' );
			setSelectedOrderIds( [] );
		} catch ( error ) {
			setStatusMessage( error.message );
		} finally {
			setLoading( false );
		}
	};

	const requestSummary = async ( orderId ) => {
		setSummaries( ( current ) => ( {
			...current,
			[ orderId ]:
				current[ orderId ] ||
				__( 'Generating explanation�', 'merchant-ops-console' ),
		} ) );

		try {
			const response = await apiFetch( {
				path: `/merchant-ops-console/v1/summary/${ orderId }`,
				method: 'POST',
			} );

			setSummaries( ( current ) => ( {
				...current,
				[ orderId ]: response.summary,
			} ) );
		} catch ( error ) {
			setSummaries( ( current ) => ( {
				...current,
				[ orderId ]: error.message,
			} ) );
		}
	};

	const focusOrderForTriage = ( orderId ) => {
		setActiveView( 'bulk-triage' );
		setSelectedOrderIds( ( currentIds ) =>
			currentIds.includes( orderId )
				? currentIds
				: [ ...currentIds, orderId ]
		);
		setStatusMessage(
			__( 'Order added to the bulk triage selection.', 'merchant-ops-console' )
		);
	};

	const renderHeaderActions = ( primaryLabel ) => (
		<>
			<button
				className="woo-ops-secondary-button"
				onClick={ exportSelected }
				type="button"
			>
				<SymbolIcon name="export" />
				<span>{ __( 'Export Report', 'merchant-ops-console' ) }</span>
			</button>
			<button
				className="woo-ops-primary-button"
				disabled={ loading }
				onClick={ refreshDashboard }
				type="button"
			>
				<SymbolIcon name="refresh" />
				<span>{ primaryLabel }</span>
			</button>
		</>
	);

	const renderFilterShell = () => (
		<div className="woo-ops-filter-shell">
			<div className="woo-ops-search-field">
				<SymbolIcon name="search" />
				<input
					onChange={ ( event ) =>
						setSearchTerm( event.target.value )
					}
					placeholder={ __(
						'Search by order, customer, issue, or location�',
						'merchant-ops-console'
					) }
					type="search"
					value={ searchTerm }
				/>
			</div>
			<div className="woo-ops-chip-row" role="tablist">
				<button
					className={ `woo-ops-filter-chip ${
						issueFilter ? '' : 'is-active'
					}` }
					onClick={ () => setIssueFilter( '' ) }
					type="button"
				>
					{ __( 'All', 'merchant-ops-console' ) }
				</button>
				{ ( dashboard.issueTypes || [] ).map( ( issue ) => (
					<button
						className={ `woo-ops-filter-chip ${
							issueFilter === issue.value ? 'is-active' : ''
						}` }
						key={ issue.value }
						onClick={ () => setIssueFilter( issue.value ) }
						type="button"
					>
						{ issue.label }
					</button>
				) ) }
			</div>
		</div>
	);

	const renderMetricCards = () => (
		<div className="woo-ops-summary-grid">
			{ ( dashboard.metrics || [] ).map( ( metric ) => {
				const meta = getMetricMeta( metric.label, metric.tone );
				const targetView = getMetricLinkTarget( metric.label );

				return (
					<article
						className="woo-ops-summary-card"
						key={ metric.label }
					>
						<div className="woo-ops-summary-card-top">
							<div
								className={ `woo-ops-summary-card-icon tone-${ meta.iconTone }` }
							>
								<SymbolIcon name={ meta.icon } />
							</div>
							<span
								className={ `woo-ops-inline-pill tone-${ metric.tone }` }
							>
								{ meta.badge }
							</span>
						</div>
						<p className="woo-ops-summary-label">
							{ metric.label }
						</p>
						<h2 className="woo-ops-summary-value">
							{ metric.value }
						</h2>
						<div className="woo-ops-summary-footer">
							<p>{ metric.delta }</p>
							<button
								className="woo-ops-inline-link"
								onClick={ () => setActiveView( targetView ) }
								type="button"
							>
								<span>
									{ __( 'View All', 'merchant-ops-console' ) }
								</span>
								<SymbolIcon name="chevron-right" />
							</button>
						</div>
					</article>
				);
			} ) }
		</div>
	);

	const renderExceptionsView = () => (
		<>
			<ScreenHeader
				actions={ renderHeaderActions(
					__( 'Run Sync', 'merchant-ops-console' )
				) }
				description={ __(
					'Surface the orders that need intervention first, then hand them off into fast triage workflows.',
					'merchant-ops-console'
				) }
				eyebrow={ __( 'Operational Ledger', 'merchant-ops-console' ) }
				title={ __( 'Order Exceptions', 'merchant-ops-console' ) }
			/>
			{ renderMetricCards() }
			<section className="woo-ops-section-stack">
				<div className="woo-ops-section-heading">
					<div>
						<h3>{ __( 'Needs Attention', 'merchant-ops-console' ) }</h3>
						<p>
							{ __(
								'Exception cards prioritize payment, fulfillment, refund, and inventory friction in one feed.',
								'merchant-ops-console'
							) }
						</p>
					</div>
					<div className="woo-ops-legend-row">
						<span className="woo-ops-legend tone-critical">
							<span className="woo-ops-legend-dot" />
							{ criticalCount }{ ' ' }
							{ __( 'Critical', 'merchant-ops-console' ) }
						</span>
						<span className="woo-ops-legend tone-warning">
							<span className="woo-ops-legend-dot" />
							{ warningCount }{ ' ' }
							{ __( 'Warning', 'merchant-ops-console' ) }
						</span>
					</div>
				</div>
				{ renderFilterShell() }
				<div className="woo-ops-exception-feed">
					{ exceptionFeed.map( ( order ) => {
						const primaryIssue = getPrimaryIssue( order );
						const isSelected = selectedOrderIds.includes(
							order.id
						);

						return (
							<article
								className={ `woo-ops-exception-card tone-${ order.riskTone }` }
								key={ order.id }
							>
								<div className="woo-ops-exception-card-main">
									<div
										className={ `woo-ops-exception-icon tone-${ order.riskTone }` }
									>
										<SymbolIcon
											name={ getIssueIcon(
												primaryIssue?.key
											) }
										/>
									</div>
									<div className="woo-ops-exception-copy">
										<div className="woo-ops-exception-meta">
											<strong>
												#{ order.orderNumber }
											</strong>
											<span
												className={ `woo-ops-risk-pill tone-${ order.riskTone }` }
											>
												{ 'critical' === order.riskTone
													? __(
															'Critical',
															'merchant-ops-console'
													  )
													: __(
															'Warning',
															'merchant-ops-console'
													  ) }
											</span>
										</div>
										<h4>
											{ primaryIssue?.label ||
												__(
													'Operational exception',
													'merchant-ops-console'
												) }
										</h4>
										<p>
											{ order.customer } �{ ' ' }
											{ primaryIssue?.description ||
												__(
													'Needs manual attention before fulfillment proceeds.',
													'merchant-ops-console'
												) }
										</p>
										<div className="woo-ops-meta-row">
											<span>
												{ formatDate(
													order.createdAt
												) }
											</span>
											<span>
												{ order.location ||
													__(
														'Shipping location pending',
														'merchant-ops-console'
													) }
											</span>
											<span>
												{ formatCurrency(
													order.total,
													order.currency
												) }
											</span>
										</div>
									</div>
								</div>
								<div className="woo-ops-exception-actions">
									<button
										className="woo-ops-text-action"
										onClick={ () =>
											requestSummary( order.id )
										}
										type="button"
									>
										{ getActionLabel( primaryIssue?.key ) }
									</button>
									<button
										className="woo-ops-card-button"
										onClick={ () =>
											focusOrderForTriage( order.id )
										}
										type="button"
									>
										{ isSelected
											? __(
													'Selected',
													'merchant-ops-console'
											  )
											: __(
													'Mark for Review',
													'merchant-ops-console'
											  ) }
									</button>
									<button
										className="woo-ops-icon-button"
										onClick={ () =>
											requestSummary( order.id )
										}
										type="button"
									>
										<SymbolIcon name="more" />
									</button>
								</div>
								{ summaries[ order.id ] || order.aiSummary ? (
									<p className="woo-ops-inline-summary">
										{ summaries[ order.id ] ||
											order.aiSummary }
									</p>
								) : null }
							</article>
						);
					} ) }
				</div>
				{ filteredOrders.length > visibleExceptionCount ? (
					<div className="woo-ops-load-more-wrap">
						<button
							className="woo-ops-inline-link"
							onClick={ () =>
								setVisibleExceptionCount(
									( current ) => current + 8
								)
							}
							type="button"
						>
							<span>
								{ __(
									'Load More Exceptions',
									'merchant-ops-console'
								) }
							</span>
						</button>
					</div>
				) : null }
			</section>
		</>
	);

	const renderBulkTriageView = () => (
		<>
			<ScreenHeader
				actions={
					<>
						<button
							className="woo-ops-secondary-button"
							onClick={ () => setInternalNote( '' ) }
							type="button"
						>
							<SymbolIcon name="note" />
							<span>{ __( 'Add Note', 'merchant-ops-console' ) }</span>
						</button>
						<button
							className="woo-ops-secondary-button"
							onClick={ exportSelected }
							type="button"
						>
							<SymbolIcon name="export" />
							<span>
								{ __( 'Export Selected', 'merchant-ops-console' ) }
							</span>
						</button>
						<button
							className="woo-ops-primary-button"
							disabled={ loading }
							onClick={ applyTriage }
							type="button"
						>
							<SymbolIcon name="rule" />
							<span>
								{ __( 'Mark for Review', 'merchant-ops-console' ) }
							</span>
						</button>
					</>
				}
				description={ __(
					'Execute mass operations across the current queue while preserving a clear audit trail for support, fulfillment, and finance teams.',
					'merchant-ops-console'
				) }
				eyebrow={ __( 'Operational Ledger', 'merchant-ops-console' ) }
				title={ __( 'Bulk Triage', 'merchant-ops-console' ) }
			/>
			{ renderFilterShell() }
			<section className="woo-ops-table-card">
				<div className="woo-ops-table-wrap">
					<table className="woo-ops-data-table">
						<thead>
							<tr>
								<th className="is-checkbox">
									<input
										checked={
											filteredOrders.length > 0 &&
											selectedOrderIds.length ===
												filteredOrders.length
										}
										onChange={ toggleSelectAll }
										type="checkbox"
									/>
								</th>
								<th>
									{ __( 'Order Detail', 'merchant-ops-console' ) }
								</th>
								<th>
									{ __( 'Created Date', 'merchant-ops-console' ) }
								</th>
								<th>
									{ __( 'Primary Issue', 'merchant-ops-console' ) }
								</th>
								<th>
									{ __( 'Risk Score', 'merchant-ops-console' ) }
								</th>
								<th className="is-right">
									{ __( 'Actions', 'merchant-ops-console' ) }
								</th>
							</tr>
						</thead>
						<tbody>
							{ filteredOrders.map( ( order ) => {
								const primaryIssue = getPrimaryIssue( order );

								return (
									<tr key={ order.id }>
										<td className="is-checkbox">
											<input
												checked={ selectedOrderIds.includes(
													order.id
												) }
												onChange={ () =>
													toggleSelectedOrder(
														order.id
													)
												}
												type="checkbox"
											/>
										</td>
										<td>
											<div className="woo-ops-order-stack">
												<strong>
													#{ order.orderNumber }
												</strong>
												<span>{ order.customer }</span>
											</div>
										</td>
										<td>
											{ formatDate( order.createdAt ) }
										</td>
										<td>
											<span
												className={ `woo-ops-risk-pill tone-${ order.riskTone }` }
											>
												{ getIssueSummaryLabel(
													primaryIssue?.key
												) }
											</span>
										</td>
										<td>
											<div className="woo-ops-risk-meter">
												<div className="woo-ops-risk-track">
													<div
														className={ `woo-ops-risk-fill tone-${ order.riskTone }` }
														style={ {
															width: `${ Math.min(
																order.riskScore,
																100
															) }%`,
														} }
													/>
												</div>
												<strong>
													{ order.riskScore }/100
												</strong>
											</div>
										</td>
										<td className="is-right">
											<div className="woo-ops-row-actions">
												<button
													className="woo-ops-icon-button"
													onClick={ () =>
														requestSummary(
															order.id
														)
													}
													type="button"
												>
													<SymbolIcon name="spark" />
												</button>
												<button
													className="woo-ops-icon-button"
													onClick={ () =>
														toggleSelectedOrder(
															order.id
														)
													}
													type="button"
												>
													<SymbolIcon name="rule" />
												</button>
												<button
													className="woo-ops-icon-button"
													onClick={ () =>
														focusOrderForTriage(
															order.id
														)
													}
													type="button"
												>
													<SymbolIcon name="more" />
												</button>
											</div>
										</td>
									</tr>
								);
							} ) }
						</tbody>
					</table>
				</div>
			</section>
			<div className="woo-ops-two-column-grid">
				<section className="woo-ops-panel-card">
					<div className="woo-ops-panel-head">
						<p>{ __( 'Triage Workflow', 'merchant-ops-console' ) }</p>
						<h3>
							{ __(
								'Apply action to the current selection',
								'merchant-ops-console'
							) }
						</h3>
					</div>
					<div className="woo-ops-form-grid">
						<div>
							<span className="woo-ops-form-label">
								{ __( 'Selected orders', 'merchant-ops-console' ) }
							</span>
							<div className="woo-ops-static-field">
								<strong>{ selectedOrderIds.length }</strong>
							</div>
						</div>
						<label htmlFor="woo-ops-triage-action">
							<span className="woo-ops-form-label">
								{ __( 'Action', 'merchant-ops-console' ) }
							</span>
							<select
								id="woo-ops-triage-action"
								onChange={ ( event ) =>
									setTriageAction( event.target.value )
								}
								value={ triageAction }
							>
								{ triageActions.map( ( action ) => (
									<option
										key={ action.value }
										value={ action.value }
									>
										{ action.label }
									</option>
								) ) }
							</select>
						</label>
						<label
							className="is-wide"
							htmlFor="woo-ops-internal-note"
						>
							<span className="woo-ops-form-label">
								{ __( 'Internal note', 'merchant-ops-console' ) }
							</span>
							<textarea
								id="woo-ops-internal-note"
								onChange={ ( event ) =>
									setInternalNote( event.target.value )
								}
								placeholder={ __(
									'Add context for support, fulfillment, or finance teams.',
									'merchant-ops-console'
								) }
								value={ internalNote }
							/>
						</label>
						<button
							className="woo-ops-primary-button is-wide"
							disabled={ loading }
							onClick={ applyTriage }
							type="button"
						>
							<SymbolIcon name="rule" />
							<span>
								{ __(
									'Apply triage action',
									'merchant-ops-console'
								) }
							</span>
						</button>
					</div>
				</section>
				<section className="woo-ops-panel-card">
					<div className="woo-ops-panel-head">
						<p>{ __( 'Queue Snapshot', 'merchant-ops-console' ) }</p>
						<h3>
							{ __(
								'Selection context and operational pressure',
								'merchant-ops-console'
							) }
						</h3>
					</div>
					<ul className="woo-ops-stat-list">
						<li>
							<strong>{ filteredOrders.length }</strong>
							<span>
								{ __(
									'orders in the current filtered queue',
									'merchant-ops-console'
								) }
							</span>
						</li>
						<li>
							<strong>
								{ formatCurrency( totalAtRiskValue ) }
							</strong>
							<span>
								{ __(
									'at-risk revenue in the current view',
									'merchant-ops-console'
								) }
							</span>
						</li>
						<li>
							<strong>{ selectedOrderIds.length }</strong>
							<span>
								{ __(
									'orders currently staged for triage',
									'merchant-ops-console'
								) }
							</span>
						</li>
					</ul>
				</section>
			</div>
		</>
	);

	const renderRiskAnalysisView = () => (
		<>
			<ScreenHeader
				actions={ renderHeaderActions(
					__( 'Refresh Signals', 'merchant-ops-console' )
				) }
				description={ __(
					'Use lightweight order health scoring to understand why each order is risky before the team takes action.',
					'merchant-ops-console'
				) }
				eyebrow={ __( 'Operational Ledger', 'merchant-ops-console' ) }
				title={ __( 'Fulfillment Risk Analysis', 'merchant-ops-console' ) }
			/>
			<div className="woo-ops-two-column-grid">
				<section className="woo-ops-panel-card">
					<div className="woo-ops-panel-head">
						<p>{ __( 'Risk Drivers', 'merchant-ops-console' ) }</p>
						<h3>
							{ __(
								'Signals powering the order health score',
								'merchant-ops-console'
							) }
						</h3>
					</div>
					<div className="woo-ops-risk-driver-grid">
						{ filteredOrders.slice( 0, 6 ).map( ( order ) => (
							<article
								className="woo-ops-risk-card"
								key={ order.id }
							>
								<div className="woo-ops-risk-card-head">
									<div>
										<strong>#{ order.orderNumber }</strong>
										<span>{ order.customer }</span>
									</div>
									<span
										className={ `woo-ops-risk-pill tone-${ order.riskTone }` }
									>
										{ order.riskScore }/100
									</span>
								</div>
								<div className="woo-ops-risk-track large">
									<div
										className={ `woo-ops-risk-fill tone-${ order.riskTone }` }
										style={ {
											width: `${ Math.min(
												order.riskScore,
												100
											) }%`,
										} }
									/>
								</div>
								<div className="woo-ops-signal-cluster">
									{ getOrderSignals( order ).map(
										( signal ) => (
											<span
												className={ `woo-ops-signal-chip tone-${ signal.tone }` }
												key={ signal.label }
											>
												{ signal.label }
											</span>
										)
									) }
								</div>
							</article>
						) ) }
					</div>
				</section>
				<section className="woo-ops-panel-card">
					<div className="woo-ops-panel-head">
						<p>{ __( 'Risk Summary', 'merchant-ops-console' ) }</p>
						<h3>
							{ __(
								'Current distribution across the queue',
								'merchant-ops-console'
							) }
						</h3>
					</div>
					<ul className="woo-ops-stat-list">
						<li>
							<strong>{ criticalCount }</strong>
							<span>
								{ __(
									'orders in critical state',
									'merchant-ops-console'
								) }
							</span>
						</li>
						<li>
							<strong>{ warningCount }</strong>
							<span>
								{ __(
									'orders currently on watch',
									'merchant-ops-console'
								) }
							</span>
						</li>
						<li>
							<strong>
								{ filteredOrders.length -
									criticalCount -
									warningCount }
							</strong>
							<span>
								{ __(
									'orders currently stable but still surfaced',
									'merchant-ops-console'
								) }
							</span>
						</li>
					</ul>
					<div className="woo-ops-breakdown-list">
						{ issueBreakdown.slice( 0, 5 ).map( ( item ) => (
							<div
								className="woo-ops-breakdown-row"
								key={ item.label }
							>
								<span>{ item.label }</span>
								<strong>{ item.count }</strong>
							</div>
						) ) }
					</div>
				</section>
			</div>
		</>
	);

	const renderInsightsView = () => (
		<>
			<ScreenHeader
				actions={ renderHeaderActions(
					__( 'Refresh Insights', 'merchant-ops-console' )
				) }
				description={ __(
					'Keep merchant operators aligned on the pressure points inside the queue and show how AI summaries stay advisory, not autonomous.',
					'merchant-ops-console'
				) }
				eyebrow={ __( 'Operational Ledger', 'merchant-ops-console' ) }
				title={ __( 'Merchant Insights', 'merchant-ops-console' ) }
			/>
			<div className="woo-ops-two-column-grid">
				<section className="woo-ops-panel-card">
					<div className="woo-ops-panel-head">
						<p>{ __( 'Executive Snapshot', 'merchant-ops-console' ) }</p>
						<h3>
							{ __(
								'What the merchant team should notice first',
								'merchant-ops-console'
							) }
						</h3>
					</div>
					<ul className="woo-ops-stat-list">
						<li>
							<strong>{ filteredOrders.length }</strong>
							<span>
								{ __(
									'flagged orders in the current view',
									'merchant-ops-console'
								) }
							</span>
						</li>
						<li>
							<strong>
								{ formatCurrency( totalAtRiskValue ) }
							</strong>
							<span>
								{ __(
									'revenue currently tied to flagged orders',
									'merchant-ops-console'
								) }
							</span>
						</li>
						<li>
							<strong>
								{ issueBreakdown[ 0 ]?.label ||
									__( 'No issue spikes', 'merchant-ops-console' ) }
							</strong>
							<span>
								{ issueBreakdown[ 0 ]
									? `${ issueBreakdown[ 0 ].count } ${ __(
											'orders impacted',
											'merchant-ops-console'
									  ) }`
									: __(
											'Current queue is balanced.',
											'merchant-ops-console'
									  ) }
							</span>
						</li>
					</ul>
					<div className="woo-ops-breakdown-list">
						{ issueBreakdown.map( ( item ) => (
							<div
								className="woo-ops-breakdown-row"
								key={ item.label }
							>
								<span>{ item.label }</span>
								<strong>{ item.count }</strong>
							</div>
						) ) }
					</div>
				</section>
				<section className="woo-ops-panel-card">
					<div className="woo-ops-panel-head">
						<p>
							{ __(
								'AI-Assisted Issue Summary',
								'merchant-ops-console'
							) }
						</p>
						<h3>
							{ __(
								'Keep humans in control',
								'merchant-ops-console'
							) }
						</h3>
					</div>
					<ul className="woo-ops-guidance-list">
						<li>
							{ __(
								'Summaries explain why an order is flagged without auto-resolving it.',
								'merchant-ops-console'
							) }
						</li>
						<li>
							{ __(
								'The final decision still belongs to the merchant operations team.',
								'merchant-ops-console'
							) }
						</li>
						<li>
							{ __(
								'A PHP filter allows external AI providers to replace the default explanation safely.',
								'merchant-ops-console'
							) }
						</li>
					</ul>
					<div className="woo-ops-ai-summary-list">
						{ filteredOrders.slice( 0, 3 ).map( ( order ) => (
							<article
								className="woo-ops-ai-summary-card"
								key={ order.id }
							>
								<div className="woo-ops-ai-summary-head">
									<strong>#{ order.orderNumber }</strong>
									<button
										className="woo-ops-inline-link"
										onClick={ () =>
											requestSummary( order.id )
										}
										type="button"
									>
										<SymbolIcon name="spark" />
										<span>
											{ __(
												'Generate',
												'merchant-ops-console'
											) }
										</span>
									</button>
								</div>
								<p>
									{ summaries[ order.id ] ||
										order.aiSummary ||
										__(
											'No summary generated yet.',
											'merchant-ops-console'
										) }
								</p>
							</article>
						) ) }
					</div>
				</section>
			</div>
		</>
	);

	let activeScreen = renderExceptionsView();

	if ( 'bulk-triage' === activeView ) {
		activeScreen = renderBulkTriageView();
	} else if ( 'risk-analysis' === activeView ) {
		activeScreen = renderRiskAnalysisView();
	} else if ( 'insights' === activeView ) {
		activeScreen = renderInsightsView();
	}

	return (
		<div className="woo-ops-app-shell">
			<aside className="woo-ops-sidebar">
				<div className="woo-ops-brand">MerchantOps</div>
				<nav className="woo-ops-sidebar-nav">
					{ NAV_ITEMS.map( ( item ) => (
						<button
							className={ `woo-ops-sidebar-link ${
								activeView === item.value ? 'is-active' : ''
							}` }
							key={ item.value }
							onClick={ () => setActiveView( item.value ) }
							type="button"
						>
							<SymbolIcon name={ item.icon } />
							<span>{ item.label }</span>
						</button>
					) ) }
				</nav>
				<div className="woo-ops-profile-card">
					<div className="woo-ops-profile-avatar">WO</div>
					<div>
						<strong>
							{ __( 'Merchant Profile', 'merchant-ops-console' ) }
						</strong>
						<span>
							{ __( 'Operations Lead', 'merchant-ops-console' ) }
						</span>
					</div>
				</div>
			</aside>
			<div className="woo-ops-main">
				<header className="woo-ops-topbar">
					<div className="woo-ops-topbar-brand">
						<SymbolIcon name="analytics" className="tone-primary" />
						<h2>{ __( 'MerchantOps Console', 'merchant-ops-console' ) }</h2>
					</div>
					<div className="woo-ops-topbar-actions">
						<button className="woo-ops-icon-button" type="button">
							<SymbolIcon name="search" />
						</button>
						<button className="woo-ops-icon-button" type="button">
							<SymbolIcon name="notifications" />
						</button>
						<div className="woo-ops-topbar-avatar">
							<SymbolIcon name="person" />
						</div>
					</div>
				</header>
				<section className="woo-ops-page-shell">
					{ statusMessage ? (
						<p className="woo-ops-status-banner">
							{ statusMessage }
						</p>
					) : null }
					{ activeScreen }
				</section>
			</div>
			<nav className="woo-ops-mobile-nav">
				{ NAV_ITEMS.map( ( item ) => (
					<button
						className={ `woo-ops-mobile-link ${
							activeView === item.value ? 'is-active' : ''
						}` }
						key={ item.value }
						onClick={ () => setActiveView( item.value ) }
						type="button"
					>
						<SymbolIcon name={ item.icon } />
						<span>{ item.label }</span>
					</button>
				) ) }
			</nav>
			<button
				className="woo-ops-fab"
				onClick={ () => setActiveView( 'bulk-triage' ) }
				type="button"
			>
				<SymbolIcon name="plus" />
			</button>
		</div>
	);
}

