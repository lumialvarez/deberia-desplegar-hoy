import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimations } from '@angular/platform-browser/animations';

import { NotFoundComponent } from './not-found.component';

describe('NotFoundComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimations(),
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(NotFoundComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render 404 message', () => {
    const fixture = TestBed.createComponent(NotFoundComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('404');
  });

  it('should have a link back to home', () => {
    const fixture = TestBed.createComponent(NotFoundComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const link = compiled.querySelector('a[href="/"]');
    expect(link).toBeTruthy();
  });
});
