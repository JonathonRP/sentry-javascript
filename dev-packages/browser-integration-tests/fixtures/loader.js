!function(n,e,t,r,i,o,a,c,u){for(var s=u,f=0;f<document.scripts.length;f++)if(document.scripts[f].src.indexOf(o)>-1){s&&"no"===document.scripts[f].getAttribute("data-lazy")&&(s=!1);break}var p=[];function d(n){return"e"in n}function l(n){return"p"in n}function _(n){return"f"in n}var v=[];function y(n){s&&(d(n)||l(n)||_(n)&&n.f.indexOf("capture")>-1||_(n)&&n.f.indexOf("showReportDialog")>-1)&&L(),v.push(n)}function h(){y({e:[].slice.call(arguments)})}function E(n){y({p:n})}function O(){try{n.SENTRY_SDK_SOURCE="loader";var e=n[i],o=e.init;e.init=function(i){n.removeEventListener(t,h),n.removeEventListener(r,E);var a=c;for(var u in i)Object.prototype.hasOwnProperty.call(i,u)&&(a[u]=i[u]);!function(n,e){var t=n.integrations||[];if(!Array.isArray(t))return;var r=t.map((function(n){return n.name}));n.tracesSampleRate&&-1===r.indexOf("BrowserTracing")&&t.push(new e.BrowserTracing);(n.replaysSessionSampleRate||n.replaysOnErrorSampleRate)&&-1===r.indexOf("Replay")&&t.push(new e.Replay);n.integrations=t}(a,e),o(a)},setTimeout((function(){return function(e){try{"function"==typeof n.sentryOnLoad&&(n.sentryOnLoad(),n.sentryOnLoad=void 0);for(var t=0;t<p.length;t++)"function"==typeof p[t]&&p[t]();p.splice(0);for(t=0;t<v.length;t++){_(o=v[t])&&"init"===o.f&&e.init.apply(e,o.a)}g()||e.init();var r=n.onerror,i=n.onunhandledrejection;for(t=0;t<v.length;t++){var o;if(_(o=v[t])){if("init"===o.f)continue;e[o.f].apply(e,o.a)}else d(o)&&r?r.apply(n,o.e):l(o)&&i&&i.apply(n,[o.p])}}catch(n){console.error(n)}}(e)}))}catch(n){console.error(n)}}var m=!1;function L(){if(!m){m=!0;var n=e.scripts[0],t=e.createElement("script");t.src=a,t.crossOrigin="anonymous",t.addEventListener("load",O,{once:!0,passive:!0}),n.parentNode.insertBefore(t,n)}}function g(){var e=n.__SENTRY__;return!(void 0===e||!e.hub||!e.hub.getClient())}n[i]=n[i]||{},n[i].onLoad=function(n){g()?n():p.push(n)},n[i].forceLoad=function(){setTimeout((function(){L()}))},["init","addBreadcrumb","captureMessage","captureException","captureEvent","configureScope","withScope","showReportDialog"].forEach((function(e){n[i][e]=function(){y({f:e,a:arguments})}})),n.addEventListener(t,h),n.addEventListener(r,E),s||setTimeout((function(){L()}))}
(
  window,
  document,
  'error',
  'unhandledrejection',
  'Sentry',
  'loader.js',
  __LOADER_BUNDLE__,
  __LOADER_OPTIONS__,
  __LOADER_LAZY__
);
