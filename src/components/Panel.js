export function Panel( { eyebrow, title, children } ) {
	return (
		<section className="woo-ops-panel">
			<div className="woo-ops-panel-head">
				{ eyebrow ? <p>{ eyebrow }</p> : null }
				<h2>{ title }</h2>
			</div>
			{ children }
		</section>
	);
}

