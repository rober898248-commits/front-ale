import { Component, DestroyRef, inject, signal } from '@angular/core';
import { track } from '@vercel/analytics';

interface Sparkle {
  left: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
}

/** Milisegundos que cada mensaje "Te extraño" permanece visible. */
const MISSING_MESSAGE_DURATION = 3000;

/** Un mensaje "Te extraño" flotando alrededor del corazón. */
interface MissingMessage {
  id: number;
  /** Desplazamiento horizontal, en fracciones de la mitad del corazón. */
  dx: number;
  /** Desplazamiento vertical, en fracciones de la mitad del corazón. */
  dy: number;
  /** Rotación aleatoria, en grados. */
  rotation: number;
}

@Component({
  imports: [],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  private readonly destroyRef = inject(DestroyRef);

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

  /** Mensajes "Te extraño" visibles, cada uno en una posición aleatoria. */
  protected readonly messages = signal<MissingMessage[]>([]);

  /** Duración de cada mensaje (compartida con la animación CSS). */
  protected readonly duration = MISSING_MESSAGE_DURATION;

  /** Identificador incremental para cada mensaje creado. */
  private nextId = 0;

  /** Temporizadores que ocultan cada mensaje. */
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  constructor() {
    this.destroyRef.onDestroy(() => this.clearTimers());
  }

  /** Registra un evento personalizado y muestra un mensaje "Te extraño". */
  protected onHeartTap(): void {
    track('heart_tap');

    const id = ++this.nextId;
    const angle = Math.random() * Math.PI * 2;

    this.messages.update((messages) => [
      ...messages,
      {
        id,
        // El eje horizontal se limita más para que el mensaje siempre quepa en pantalla.
        dx: Math.cos(angle) * (0.55 + Math.random() * 0.35),
        dy: Math.sin(angle) * (0.75 + Math.random() * 0.5),
        rotation: (Math.random() - 0.5) * 12,
      },
    ]);

    this.timers.set(
      id,
      setTimeout(() => this.removeMessage(id), MISSING_MESSAGE_DURATION),
    );
  }

  /** Elimina un mensaje "Te extraño" y su temporizador. */
  private removeMessage(id: number): void {
    const timer = this.timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.timers.delete(id);
    }

    this.messages.update((messages) => messages.filter((message) => message.id !== id));
  }

  /** Cancela todos los temporizadores pendientes. */
  private clearTimers(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }
}
