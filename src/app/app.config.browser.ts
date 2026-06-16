import { isDevMode, mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';

import { appConfig } from './app.config';

const browserConfig: ApplicationConfig = {
  providers: [
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};

export const config = mergeApplicationConfig(appConfig, browserConfig);
