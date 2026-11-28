import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../environments/environment';

@Pipe({ name: 'imageUrl' })
export class ImageUrlPipe implements PipeTransform {
  transform(path: string): string {
    return path.startsWith('http') ? path : `${environment.apiUrl}${path}`;
  }
}