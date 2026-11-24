import { Directive, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';

@Directive({
  selector: 'input[appDateMask]',
})
export class DateMaskDirective implements OnInit, OnDestroy {
  private el = inject<ElementRef<HTMLInputElement>>(ElementRef);

  private handler = () => {
    const input = this.el.nativeElement;
    const raw = input.value;

    // Keep only digits, maximum 8 (DDMMYYYY).
    const digits = raw.replace(/\D/g, '').slice(0, 8);

    // Add the slashes.
    let formatted = digits;
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    } else if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }

    if (formatted === raw) return;

    // Remember how many digits were before the cursor.
    const caret = input.selectionStart ?? raw.length;
    const digitsBeforeCaret = raw.slice(0, caret).replace(/\D/g, '').length;

    input.value = formatted;

    // Move the cursor to just after the same number of digits.
    let pos = 0;
    let seen = 0;
    while (pos < formatted.length && seen < digitsBeforeCaret) {
      if (/\d/.test(formatted[pos])) seen++;
      pos++;
    }
    input.setSelectionRange(pos, pos);
  };

  ngOnInit(): void {
    // "true" = capture phase, so this runs before the Material datepicker's own listener.
    this.el.nativeElement.addEventListener('input', this.handler, true);
  }

  ngOnDestroy(): void {
    this.el.nativeElement.removeEventListener('input', this.handler, true);
  }
}