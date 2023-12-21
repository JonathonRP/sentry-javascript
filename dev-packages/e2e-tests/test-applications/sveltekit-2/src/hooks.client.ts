import { env } from '$env/dynamic/public';
import * as Sentry from '@sentry/sveltekit';

console.log('Sentry DSN:', env.PUBLIC_E2E_TEST_DSN);

Sentry.init({
  environment: 'qa', // dynamic sampling bias to keep transactions
  dsn: env.PUBLIC_E2E_TEST_DSN,
  debug: true,
  tunnel: `http://localhost:3031/`, // proxy server
  tracesSampleRate: 1.0,
});

const myErrorHandler = ({ error, event }: any) => {
  console.error('An error occurred on the client side:', error, event);
};

export const handleError = Sentry.handleErrorWithSentry(myErrorHandler);
