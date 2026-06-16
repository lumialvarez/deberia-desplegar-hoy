import { bootstrapApplication } from '@angular/platform-browser';

import { App } from './app/app';
import { config } from './app/app.config.server';

const bootstrap = (context: { platformRef?: unknown }): Promise<unknown> =>
  bootstrapApplication(App, config, context as never);

export default bootstrap;
