import { Component } from '@angular/core';
import { fromEvent, map, Observable, race } from 'rxjs';
import { GamepadService } from '../services/gamepad.service';

@Component({
  selector: 'app-setkey',
  standalone: true,
  imports: [],
  templateUrl: './setkey.component.html',
  styleUrl: './setkey.component.scss'
})
export class SetkeyComponent {

  //#region Propiedades

  public nombreTecla: string = ''

  //#endregion

  //#region Constructor

  constructor(
    private gamepad: GamepadService
  ) { }

  //#endregion

  //#region Observable

  public getControlObservable(): Observable<string[]> {
    let keyboardObservable = fromEvent(document, 'keydown').pipe(
      map(p => {
        return ['Keyboard', (p as KeyboardEvent).code]
      })
    )
    let gamepadObservable = this.gamepad.getControlPressedObservable().pipe(
      map(p => {
        return ['Controller', p]
      })
    )
    return race(keyboardObservable, gamepadObservable)
  }

  //#endregion

}
