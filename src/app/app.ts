import { Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { track } from '@vercel/analytics';

interface Sparkle {
  left: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
}

/** Foto que acompaña a los mensajes. */
interface Photo {
  src: string;
  alt: string;
}

/** Milisegundos que cada mensaje "Te extraño" permanece visible. */
const MISSING_MESSAGE_DURATION = 3000;

/** Un mensaje "Te extraño" con una foto, flotando alrededor del corazón. */
interface MissingMessage {
  id: number;
  /** Posición horizontal en píxeles (respecto a la ventana). */
  x: number;
  /** Posición vertical en píxeles (respecto a la ventana). */
  y: number;
  /** Rotación aleatoria, en grados. */
  rotation: number;
  /** Foto aleatoria de la carpeta `img`. */
  photo: Photo;
}

@Component({
  imports: [],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  private readonly destroyRef = inject(DestroyRef);

  /** Referencia al corazón, para calcular dónde colocar los mensajes. */
  private readonly heart = viewChild.required<ElementRef<HTMLButtonElement>>('heart');

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

  /** Imágenes de la carpeta `img` que se muestran al azar. */
  protected readonly photos: Photo[] = [
    { src: 'img/boda1.png', alt: 'Ilustración de la pareja en la boda' },
    {
      src: 'img/boda2-removebg-preview.png',
      alt: 'Ilustración de la pareja tomándose una selfie',
    },
  ];

  /** Mensajes "Te extraño" visibles, cada uno con foto y posición aleatorias. */
  protected readonly messages = signal<MissingMessage[]>([]);

  /** Duración de cada mensaje (compartida con la animación CSS). */
  protected readonly duration = MISSING_MESSAGE_DURATION;

  /** Identificador incremental para cada mensaje creado. */
  private nextId = 0;

  /** Índice de la última foto mostrada, para no repetirla seguida. */
  private lastPhotoIndex = -1;

  /** Temporizadores que ocultan cada mensaje. */
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  constructor() {
    this.destroyRef.onDestroy(() => this.clearTimers());
  }

  /** Registra un evento personalizado y muestra un mensaje "Te extraño" con foto. */
  protected onHeartTap(): void {
    track('heart_tap');

    const anchor = this.messageAnchor();
    const id = ++this.nextId;
    const angle = Math.random() * Math.PI * 2;
    const distance = anchor.radius * (0.8 + Math.random() * 0.6);

    this.messages.update((messages) => [
      ...messages,
      {
        id,
        x: anchor.x + Math.cos(angle) * distance * 0.9,
        y: anchor.y + Math.sin(angle) * distance,
        rotation: (Math.random() - 0.5) * 10,
        photo: this.randomPhoto(),
      },
    ]);

    this.timers.set(
      id,
      setTimeout(() => this.removeMessage(id), MISSING_MESSAGE_DURATION),
    );
  }

  /** Devuelve una foto al azar, evitando repetir la última mostrada. */
  private randomPhoto(): Photo {
    const total = this.photos.length;

    if (total === 1) {
      return this.photos[0];
    }

    let index = Math.floor(Math.random() * total);
    if (index === this.lastPhotoIndex) {
      index = (index + 1) % total;
    }

    this.lastPhotoIndex = index;
    return this.photos[index];
  }

  /** Centro y radio del corazón, usados para colocar los mensajes. */
  private messageAnchor(): { x: number; y: number; radius: number } {
    const { top, left, width, height } = this.heart().nativeElement.getBoundingClientRect();

    // En entornos sin maquetación (tests) usamos el centro de la ventana.
    if (width === 0 || height === 0) {
      const size = Math.min(window.innerWidth, window.innerHeight);
      return { x: window.innerWidth / 2, y: window.innerHeight / 2, radius: size * 0.25 };
    }

    return { x: left + width / 2, y: top + height / 2, radius: width / 2 };
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
