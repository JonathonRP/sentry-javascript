import type { Client, Event, EventHint, Integration, IntegrationClass, IntegrationFn } from '@sentry/types';
import { applyAggregateErrorsToEvent, exceptionFromError } from '@sentry/utils';
import { convertIntegrationFnToClass, defineIntegration } from '../integration';

interface LinkedErrorsOptions {
  key?: string;
  limit?: number;
}

const DEFAULT_KEY = 'cause';
const DEFAULT_LIMIT = 5;

const INTEGRATION_NAME = 'LinkedErrors';

const _linkedErrorsIntegration = ((options: LinkedErrorsOptions = {}) => {
  const limit = options.limit || DEFAULT_LIMIT;
  const key = options.key || DEFAULT_KEY;

  return {
    name: INTEGRATION_NAME,
    // TODO v8: Remove this
    setupOnce() {}, // eslint-disable-line @typescript-eslint/no-empty-function
    preprocessEvent(event, hint, client) {
      const options = client.getOptions();

      applyAggregateErrorsToEvent(
        exceptionFromError,
        options.stackParser,
        options.maxValueLength,
        key,
        limit,
        event,
        hint,
      );
    },
  };
}) satisfies IntegrationFn;

export const linkedErrorsIntegration = defineIntegration(_linkedErrorsIntegration);

/**
 * Adds SDK info to an event.
 * @deprecated Use `linkedErrorsIntegration()` instead.
 */
// eslint-disable-next-line deprecation/deprecation
export const LinkedErrors = convertIntegrationFnToClass(INTEGRATION_NAME, linkedErrorsIntegration) as IntegrationClass<
  Integration & { preprocessEvent: (event: Event, hint: EventHint, client: Client) => void }
> & { new (options?: { key?: string; limit?: number }): Integration };
