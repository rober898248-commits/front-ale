import { Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { track } from '@vercel/analytics';

interface Sparkle {
  left: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
}

/** Foto del carrusel. */
interface Photo {
  src: string;
  alt: string;
}

/** Milisegundos que cada mensaje "Te extraño" permanece visible. */
const MISSING_MESSAGE_DURATION = 3000;

/** Distancia mínima (px) para considerar un gesto como deslizamiento. */
const SWIPE_THRESHOLD = 40;

/** Un mensaje "Te extraño" flotando alrededor del corazón. */
interface MissingMessage {
  id: number;
  /** Posición horizontal en píxeles (respecto a la ventana). */
  x: number;
  /** Posición vertical en píxeles (respecto a la ventana). */
  y: number;
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

  /** Fotos del carrusel (una imagen por columna). */
  protected readonly photos: Photo[] = [
    { src: 'img/boda1.png', alt: 'Ilustración de la pareja en la boda' },
    {
      src: 'img/boda2-removebg-preview.png',
      alt: 'Ilustración de la pareja tomándose una selfie',
    },
  ];

  /** Índice de la foto visible en el carrusel. */
  protected readonly photoIndex = signal(0);

  /** Mensajes "Te extraño" visibles, cada uno en una posición aleatoria. */
  protected readonly messages = signal<MissingMessage[]>([]);

  /** Duración de cada mensaje (compartida con la animación CSS). */
  protected readonly duration = MISSING_MESSAGE_DURATION;

  /** Identificador incremental para cada mensaje creado. */
  private nextId = 0;

  /** Temporizadores que ocultan cada mensaje. */
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  /** Posición horizontal donde empezó el gesto de deslizamiento. */
  private swipeStartX: number | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.clearTimers());
  }

  /** Registra un evento personalizado y muestra un mensaje "Te extraño". */
  protected onHeartTap(): void {
    track('heart_tap');

    const anchor = this.messageAnchor();
    const id = ++this.nextId;
    const angle = Math.random() * Math.PI * 2;
    const distance = anchor.radius * (0.7 + Math.random() * 0.55);

    this.messages.update((messages) => [
      ...messages,
      {
        id,
        x: anchor.x + Math.cos(angle) * distance * 0.9,
        y: anchor.y + Math.sin(angle) * distance,
        rotation: (Math.random() - 0.5) * 12,
      },
    ]);

    this.timers.set(
      id,
      setTimeout(() => this.removeMessage(id), MISSING_MESSAGE_DURATION),
    );
  }

  /** Muestra la foto siguiente del carrusel. */
  protected nextPhoto(): void {
    this.photoIndex.update((index) => (index + 1) % this.photos.length);
  }

  /** Muestra la foto anterior del carrusel. */
  protected previousPhoto(): void {
    const total = this.photos.length;
    this.photoIndex.update((index) => (index - 1 + total) % total);
  }

  /** Muestra una foto concreta del carrusel. */
  protected goToPhoto(index: number): void {
    this.photoIndex.set(index);
  }

  /** Guarda el punto de partida del gesto de deslizamiento. */
  protected onSwipeStart(event: PointerEvent): void {
    this.swipeStartX = event.clientX;
  }

  /** Cambia de foto según la dirección del deslizamiento. */
  protected onSwipeEnd(event: PointerEvent): void {
    if (this.swipeStartX === null) {
      return;
    }

    const delta = event.clientX - this.swipeStartX;
    this.swipeStartX = null;

    if (Math.abs(delta) < SWIPE_THRESHOLD) {
      return;
    }

    if (delta < 0) {
      this.nextPhoto();
    } else {
      this.previousPhoto();
    }
  }

  /** Cancela el gesto de deslizamiento en curso. */
  protected onSwipeCancel(): void {
    this.swipeStartX = null;
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
