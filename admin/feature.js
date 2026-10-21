'use strict';
// Emergency egress seal. Change only in source and redeploy; no URL/storage override.
Object.defineProperty(globalThis, 'SushiAdminFeatures', {
  value: Object.freeze({ enabled: false }), configurable: false, writable: false
});
