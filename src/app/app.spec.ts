import { TestBed } from '@angular/core/testing';
import { track } from '@vercel/analytics';
import { App } from './app';
import { initAnalytics } from './app.config';

vi.mock('@vercel/analytics', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vercel/analytics')>();
  return {
    ...actual,
    track: vi.fn(),
  };
});

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the heart with the "te amo" text', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.heart__text')?.textContent).toContain('te amo');
    expect(compiled.querySelector('.heart__shape')).toBeTruthy();
  });

  it('should track a custom event when the heart is tapped', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('.heart') as HTMLButtonElement;

    button.click();

    expect(vi.mocked(track)).toHaveBeenCalledWith('heart_tap');
  });

  it('should show a "Te extraño" message with a random photo and hide it after 3 seconds', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('.heart') as HTMLButtonElement;
    const compiled = fixture.nativeElement as HTMLElement;

    vi.useFakeTimers();
    try {
      button.click();
      fixture.detectChanges();

      const messages = compiled.querySelectorAll('.missing');
      expect(messages.length).toBe(1);
      expect(messages[0].textContent).toContain('Te extraño');

      const photo = messages[0].querySelector('.missing__photo') as HTMLImageElement;
      expect(['img/boda1.png', 'img/boda2-removebg-preview.png']).toContain(
        photo.getAttribute('src'),
      );

      vi.advanceTimersByTime(3000);
      fixture.detectChanges();

      expect(compiled.querySelectorAll('.missing').length).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('should stack a message on every tap with a random position and a different photo', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('.heart') as HTMLButtonElement;
    const compiled = fixture.nativeElement as HTMLElement;

    vi.useFakeTimers();
    try {
      button.click();
      button.click();
      button.click();
      fixture.detectChanges();

      const messages = compiled.querySelectorAll('.missing');
      expect(messages.length).toBe(3);

      const positions = Array.from(messages).map(
        (message) => message.getAttribute('style')?.match(/--x:\s*([^;]+)/)?.[1],
      );
      expect(new Set(positions).size).toBeGreaterThan(1);

      const sources = Array.from(messages).map((message) =>
        message.querySelector('.missing__photo')?.getAttribute('src'),
      );
      // Con dos fotos disponibles, nunca se repite la misma dos veces seguidas.
      expect(sources[0]).not.toBe(sources[1]);
      expect(sources[1]).not.toBe(sources[2]);

      vi.advanceTimersByTime(3000);
      fixture.detectChanges();

      expect(compiled.querySelectorAll('.missing').length).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('initAnalytics', () => {
  it('should inject the Vercel Analytics script into the document head', () => {
    TestBed.runInInjectionContext(() => initAnalytics());

    const script = document.head.querySelector<HTMLScriptElement>(
      'script[src*="vercel-scripts"], script[src*="_vercel/insights"]',
    );

    expect(script).toBeTruthy();
    expect(script?.dataset['sdkn']).toContain('@vercel/analytics');
  });
});
