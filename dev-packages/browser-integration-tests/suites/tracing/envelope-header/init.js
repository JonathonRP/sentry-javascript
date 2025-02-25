import * as Sentry from '@sentry/browser';
import { Integrations } from '@sentry/tracing';

window.Sentry = Sentry;

Sentry.init({
  dsn: 'https://public@dsn.ingest.sentry.io/1337',
  integrations: [new Integrations.BrowserTracing({ tracingOrigins: [/.*/] })],
  environment: 'production',
  tracesSampleRate: 1,
  debug: true,
});

const scope = Sentry.getCurrentScope();
scope.setUser({ id: 'user123', segment: 'segmentB' });
scope.addEventProcessor(event => {
  event.transaction = 'testTransactionDSC';
  return event;
});
