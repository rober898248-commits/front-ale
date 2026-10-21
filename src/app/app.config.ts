import { isPlatformBrowser } from '@angular/common';
import {
  ApplicationConfig,
  PLATFORM_ID,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { inject as injectAnalytics } from '@vercel/analytics';

/**
 * Inyecta el script de Vercel Web Analytics y activa el tracking de pageviews.
 *
 * - Solo se ejecuta en el navegador (el script se inserta en `document.head`).
 * - En desarrollo los eventos se loguean en la consola en lugar de enviarse.
 */
export function initAnalytics(): void {
  if (!isPlatformBrowser(inject(PLATFORM_ID))) {
    return;
  }

  injectAnalytics({
    mode: isDevMode() ? 'development' : 'production',
  });
}

export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners(), provideAppInitializer(initAnalytics)],
};
