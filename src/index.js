import { render } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { App } from './App';
import './styles.css';

if ( window.merchantOpsConsoleConfig?.nonce ) {
	apiFetch.use(
		apiFetch.createNonceMiddleware( window.merchantOpsConsoleConfig.nonce )
	);
}

const root = document.getElementById( 'merchant-ops-console-root' );

if ( root ) {
	render( <App config={ window.merchantOpsConsoleConfig || {} } />, root );
}
