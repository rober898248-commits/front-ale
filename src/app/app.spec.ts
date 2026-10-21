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
