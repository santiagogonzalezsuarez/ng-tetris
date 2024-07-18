import { Component } from '@angular/core';
import { fromEvent, map, Observable, race } from 'rxjs';

@Component({
  selector: 'app-setkey',
  standalone: true,
  imports: [],
  templateUrl: './setkey.component.html',
  styleUrl: './setkey.component.scss'
})
export class SetkeyComponent {
  public nombreTecla: string = ''

  public getControlObservable(): Observable<string[]> {
    let keyboardObservable = fromEvent(document, 'keydown').pipe(
      map(p => {
        return ['Keyboard', (p as KeyboardEvent).code]
      })
    )
    return race(keyboardObservable)
  }
}
