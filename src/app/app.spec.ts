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

  it('should show the "Te extraño" message on tap and hide it after 3 seconds', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('.heart') as HTMLButtonElement;

    vi.useFakeTimers();
    try {
      button.click();
      fixture.detectChanges();

      const messages = fixture.nativeElement.querySelectorAll('.missing');
      expect(messages.length).toBe(1);
      expect(messages[0].textContent).toContain('Te extraño');

      vi.advanceTimersByTime(3000);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelectorAll('.missing').length).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('should stack a new message with a random position on every tap', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('.heart') as HTMLButtonElement;

    vi.useFakeTimers();
    try {
      button.click();
      button.click();
      button.click();
      fixture.detectChanges();

      const messages = (fixture.nativeElement as HTMLElement).querySelectorAll('.missing');
      expect(messages.length).toBe(3);

      const positions = Array.from(messages).map((message) =>
        message.getAttribute('style')?.match(/--dx:\s*([^;]+)/)?.[1],
      );
      expect(new Set(positions).size).toBeGreaterThan(1);

      vi.advanceTimersByTime(3000);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelectorAll('.missing').length).toBe(0);
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
