import { convertIntegrationFnToClass, defineIntegration, hasTracingEnabled } from '@sentry/core';
import type { Client, Integration, IntegrationClass, IntegrationFn } from '@sentry/types';
import { GLOBAL_OBJ, arrayify, consoleSandbox } from '@sentry/utils';

import { DEFAULT_HOOKS } from './constants';
import { attachErrorHandler } from './errorhandler';
import { createTracingMixins } from './tracing';
import type { Options, Vue, VueOptions } from './types';

const globalWithVue = GLOBAL_OBJ as typeof GLOBAL_OBJ & { Vue: Vue };

const DEFAULT_CONFIG: VueOptions = {
  Vue: globalWithVue.Vue,
  attachProps: true,
  logErrors: true,
  hooks: DEFAULT_HOOKS,
  timeout: 2000,
  trackComponents: false,
};

const INTEGRATION_NAME = 'Vue';

const _vueIntegration = ((integrationOptions: Partial<VueOptions> = {}) => {
  return {
    name: INTEGRATION_NAME,
    // TODO v8: Remove this
    setupOnce() {}, // eslint-disable-line @typescript-eslint/no-empty-function
    setup(client) {
      _setupIntegration(client, integrationOptions);
    },
  };
}) satisfies IntegrationFn;

export const vueIntegration = defineIntegration(_vueIntegration);

/**
 * Initialize Vue error & performance tracking.
 */
// eslint-disable-next-line deprecation/deprecation
export const VueIntegration = convertIntegrationFnToClass(
  INTEGRATION_NAME,
  vueIntegration,
) as IntegrationClass<Integration>;

function _setupIntegration(client: Client, integrationOptions: Partial<VueOptions>): void {
  const options: Options = { ...DEFAULT_CONFIG, ...client.getOptions(), ...integrationOptions };
  if (!options.Vue && !options.app) {
    consoleSandbox(() => {
      // eslint-disable-next-line no-console
      console.warn(
        `[@sentry/vue]: Misconfigured SDK. Vue specific errors will not be captured.
Update your \`Sentry.init\` call with an appropriate config option:
\`app\` (Application Instance - Vue 3) or \`Vue\` (Vue Constructor - Vue 2).`,
      );
    });
    return;
  }

  if (options.app) {
    const apps = arrayify(options.app);
    apps.forEach(app => vueInit(app, options));
  } else if (options.Vue) {
    vueInit(options.Vue, options);
  }
}

const vueInit = (app: Vue, options: Options): void => {
  // Check app is not mounted yet - should be mounted _after_ init()!
  // This is _somewhat_ private, but in the case that this doesn't exist we simply ignore it
  // See: https://github.com/vuejs/core/blob/eb2a83283caa9de0a45881d860a3cbd9d0bdd279/packages/runtime-core/src/component.ts#L394
  const appWithInstance = app as Vue & {
    _instance?: {
      isMounted?: boolean;
    };
  };

  const isMounted = appWithInstance._instance && appWithInstance._instance.isMounted;
  if (isMounted === true) {
    consoleSandbox(() => {
      // eslint-disable-next-line no-console
      console.warn(
        '[@sentry/vue]: Misconfigured SDK. Vue app is already mounted. Make sure to call `app.mount()` after `Sentry.init()`.',
      );
    });
  }

  attachErrorHandler(app, options);

  if (hasTracingEnabled(options)) {
    app.mixin(
      createTracingMixins({
        ...options,
        ...options.tracingOptions,
      }),
    );
  }
};
