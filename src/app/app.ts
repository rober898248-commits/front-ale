import { Component } from '@angular/core';
import { track } from '@vercel/analytics';

interface Sparkle {
  left: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
}

@Component({
  imports: [],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  /** Corazones decorativos que flotan de fondo. */
  protected readonly sparkles: Sparkle[] = [
    { left: 7, size: 1.5, delay: 0, duration: 11, opacity: 0.5 },
    { left: 21, size: 0.9, delay: 2.4, duration: 15, opacity: 0.32 },
    { left: 34, size: 1.15, delay: 5.1, duration: 13, opacity: 0.45 },
    { left: 47, size: 0.8, delay: 1.2, duration: 17, opacity: 0.28 },
    { left: 61, size: 1.35, delay: 3.6, duration: 12, opacity: 0.48 },
    { left: 74, size: 0.95, delay: 7.2, duration: 16, opacity: 0.34 },
    { left: 89, size: 1.2, delay: 4.3, duration: 14, opacity: 0.44 },
  ];

  /** Registra un evento personalizado cuando tocan el corazón. */
  protected onHeartTap(): void {
    track('heart_tap');
  }
}
