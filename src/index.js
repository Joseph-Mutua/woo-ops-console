import { render } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { App } from './App';
import './styles.css';

if ( window.wooOpsConsoleConfig?.nonce ) {
	apiFetch.use(
		apiFetch.createNonceMiddleware( window.wooOpsConsoleConfig.nonce )
	);
}

const root = document.getElementById( 'woo-ops-console-root' );

if ( root ) {
	render( <App config={ window.wooOpsConsoleConfig || {} } />, root );
}
