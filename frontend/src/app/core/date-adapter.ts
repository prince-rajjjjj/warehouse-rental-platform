import { Injectable } from '@angular/core';
import { MatDateFormats, NativeDateAdapter } from '@angular/material/core';

export const DATE_INPUT_FORMAT = 'DD/MM/YYYY';

export const APP_DATE_FORMATS: MatDateFormats = {
  parse: { dateInput: DATE_INPUT_FORMAT },
  display: {
    dateInput: DATE_INPUT_FORMAT,
    monthYearLabel: { year: 'numeric', month: 'short' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' },
  },
};

@Injectable()
export class AppDateAdapter extends NativeDateAdapter {
  // Reads what the user typed, as day/month/year.
  override parse(value: any): Date | null {
    if (typeof value !== 'string') return super.parse(value);

    const text = value.trim();
    if (!text) return null;

    const m = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/.exec(text);
    if (!m) return this.invalid();

    const day = +m[1];
    const month = +m[2] - 1;
    const year = +m[3];
    const date = new Date(year, month, day);

    // Rejects impossible dates such as 31/02/2026.
    const real = date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
    return real ? date : this.invalid();
  }

  // Shows the chosen date in the input as DD/MM/YYYY.
  override format(date: Date, displayFormat: any): string {
    if (displayFormat === DATE_INPUT_FORMAT) {
      if (!this.isValid(date)) return '';
      const d = String(date.getDate()).padStart(2, '0');
      const m = String(date.getMonth() + 1).padStart(2, '0');
      return `${d}/${m}/${date.getFullYear()}`;
    }
    return super.format(date, displayFormat);
  }
}
