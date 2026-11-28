import { Component, computed, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ImageUrlPipe } from '../core/image-url.pipe';

interface GalleryData {
  urls: string[];
  title: string;
}

interface LightboxData extends GalleryData {
  index: number;
}

/* ---------- 1. Full-size photo popup ---------- */

@Component({
  selector: 'app-photo-lightbox',
  imports: [ImageUrlPipe],
  template: `
    <div class="box" tabindex="0" (keydown.arrowleft)="prev()" (keydown.arrowright)="next()">
      <img [src]="current() | imageUrl" [alt]="data.title + ' photo ' + (index() + 1)" />

      <button type="button" class="close" aria-label="Close" (click)="ref.close()">
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
          />
        </svg>
      </button>

      @if (data.urls.length > 1) {
        <button type="button" class="nav left" aria-label="Previous photo" (click)="prev()">
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            <path fill="currentColor" d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
        </button>
        <button type="button" class="nav right" aria-label="Next photo" (click)="next()">
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            <path fill="currentColor" d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
          </svg>
        </button>
        <span class="counter">{{ index() + 1 }} / {{ data.urls.length }}</span>
      }
    </div>
  `,
  styles: `
    .box {
      position: relative;
      background: #111;
      height: 80vh;
      outline: none;
    }
    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    button {
      position: absolute;
      border: 0;
      cursor: pointer;
      color: #222;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    button:hover {
      background: #fff;
    }
    .close {
      top: 12px;
      right: 12px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
    }
    .nav {
      top: 50%;
      transform: translateY(-50%);
      width: 48px;
      height: 48px;
      border-radius: 50%;
    }
    .left {
      left: 12px;
    }
    .right {
      right: 12px;
    }
    .counter {
      position: absolute;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.6);
      color: #fff;
      font-size: 13px;
      padding: 2px 12px;
      border-radius: 12px;
    }
  `,
})
export class PhotoLightbox {
  readonly data = inject<LightboxData>(MAT_DIALOG_DATA);
  readonly ref = inject(MatDialogRef<PhotoLightbox>);

  index = signal(this.data.index);
  current = computed(() => this.data.urls[this.index()]);

  next(): void {
    this.index.update((i) => (i + 1) % this.data.urls.length);
  }

  prev(): void {
    this.index.update((i) => (i - 1 + this.data.urls.length) % this.data.urls.length);
  }
}

/* ---------- 2. "All photos" grid popup ---------- */

@Component({
  selector: 'app-photo-grid',
  imports: [ImageUrlPipe],
  template: `
    <div class="header">
      <h2>{{ data.title }} ({{ data.urls.length }} photos)</h2>
      <button type="button" class="close" aria-label="Close" (click)="ref.close()">
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
          />
        </svg>
      </button>
    </div>

    <div class="grid">
      @for (url of data.urls; track url; let i = $index) {
        <button
          type="button"
          class="thumb"
          [attr.aria-label]="'Open photo ' + (i + 1)"
          (click)="open(i)"
        >
          <img [src]="url | imageUrl" alt="" loading="lazy" />
        </button>
      }
    </div>
  `,
  styles: `
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
    }
    h2 {
      margin: 0;
      font-size: 20px;
    }
    .close {
      border: 0;
      background: none;
      cursor: pointer;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .close:hover {
      background: rgba(0, 0, 0, 0.08);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 12px;
      padding: 0 24px 24px;
      max-height: 70vh;
      overflow-y: auto;
    }
    .thumb {
      padding: 0;
      border: 0;
      background: none;
      cursor: zoom-in;
      border-radius: 8px;
      overflow: hidden;
    }
    .thumb img {
      display: block;
      width: 100%;
      aspect-ratio: 4 / 3;
      object-fit: cover;
      transition: transform 0.2s ease;
    }
    .thumb:hover img {
      transform: scale(1.05);
    }
  `,
})
export class PhotoGrid {
  readonly data = inject<GalleryData>(MAT_DIALOG_DATA);
  readonly ref = inject(MatDialogRef<PhotoGrid>);
  private dialog = inject(MatDialog);

  open(index: number): void {
    this.dialog.open(PhotoLightbox, {
      data: { ...this.data, index },
      width: '1000px',
      maxWidth: '95vw',
    });
  }
}

/* ---------- 3. The carousel shown on the page ---------- */

@Component({
  selector: 'app-photo-gallery',
  imports: [ImageUrlPipe, MatButtonModule],
  template: `
    @if (images().length === 0) {
      <div class="placeholder">No photos yet</div>
    } @else {
      <div class="viewer" tabindex="0" (keydown.arrowleft)="prev()" (keydown.arrowright)="next()">
        <button
          type="button"
          class="photo"
          aria-label="View this photo full size"
          (click)="openLightbox()"
        >
          <img [src]="current() | imageUrl" [alt]="title() + ' photo ' + (index() + 1)" />
        </button>

        @if (images().length > 1) {
          <button type="button" class="nav left" aria-label="Previous photo" (click)="prev()">
            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
              <path fill="currentColor" d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
          </button>
          <button type="button" class="nav right" aria-label="Next photo" (click)="next()">
            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
              <path fill="currentColor" d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
            </svg>
          </button>
          <span class="counter">{{ index() + 1 }} / {{ images().length }}</span>
        }
      </div>

      @if (images().length > 1) {
        <button mat-stroked-button type="button" class="all" (click)="openGrid()">
          Show all photos ({{ images().length }})
        </button>
      }
    }
  `,
  styles: `
    :host {
      display: block;
      margin: 16px 0;
    }
    .viewer {
      position: relative;
      border-radius: 12px;
      overflow: hidden;
      background: #eceff1;
    }
    .photo {
      display: block;
      width: 100%;
      padding: 0;
      border: 0;
      background: none;
      cursor: zoom-in;
    }
    .photo img {
      display: block;
      width: 100%;
      aspect-ratio: 16 / 9;
      max-height: 400px;
      object-fit: cover;
    }
    .nav {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 44px;
      height: 44px;
      border: 0;
      border-radius: 50%;
      cursor: pointer;
      color: #222;
      background: rgba(255, 255, 255, 0.9);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .nav:hover {
      background: #fff;
    }
    .left {
      left: 12px;
    }
    .right {
      right: 12px;
    }
    .counter {
      position: absolute;
      bottom: 12px;
      right: 12px;
      background: rgba(0, 0, 0, 0.6);
      color: #fff;
      font-size: 13px;
      padding: 2px 10px;
      border-radius: 12px;
    }
    .all {
      margin-top: 12px;
    }
    .placeholder {
      aspect-ratio: 16 / 9;
      max-height: 320px;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #eceff1;
      color: #78909c;
      border-radius: 12px;
    }
  `,
})
export class PhotoGallery {
  private dialog = inject(MatDialog);

  images = input.required<string[]>();
  title = input('');

  index = signal(0);
  current = computed(() => this.images()[this.index()] ?? this.images()[0]);

  next(): void {
    const n = this.images().length;
    if (n > 0) this.index.update((i) => (i + 1) % n);
  }

  prev(): void {
    const n = this.images().length;
    if (n > 0) this.index.update((i) => (i - 1 + n) % n);
  }

  openGrid(): void {
    this.dialog.open(PhotoGrid, {
      data: { urls: this.images(), title: this.title() },
      width: '900px',
      maxWidth: '95vw',
    });
  }

  openLightbox(): void {
    this.dialog.open(PhotoLightbox, {
      data: { urls: this.images(), title: this.title(), index: this.index() },
      width: '1000px',
      maxWidth: '95vw',
    });
  }
}
