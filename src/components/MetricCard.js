export function MetricCard( { label, value, delta, tone } ) {
	return (
		<article className={ `woo-ops-metric-card ${ tone }` }>
			<p>{ label }</p>
			<strong>{ value }</strong>
			<span>{ delta }</span>
		</article>
	);
}
