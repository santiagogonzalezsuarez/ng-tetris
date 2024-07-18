import { Injectable } from '@angular/core';
import { filter, fromEvent, map, Observable, Subject, takeUntil } from 'rxjs';
import { GamepadService } from './gamepad.service';

@Injectable({
  providedIn: 'root'
})
export class ControlsService {

  //#region Constructor

  constructor(
    private gamepad: GamepadService
  ) { }

  //#endregion

  //#region Controles

  public getControlPressObservable(control: string[]): Observable<void> {
    if (control != null && Array.isArray(control) && control.length > 1) {
      let tipo: string = control[0]
      let key: string = control[1]
      switch (tipo) {
        case "Keyboard":
          return fromEvent(document, 'keydown').pipe(
            filter(p => (p as KeyboardEvent).code == key),
            map(() => void(0))
          )
        case "Controller":
          return this.gamepad.getControlPressedObservable().pipe(
            filter(p => p == key),
            map(() => void(0))
          )
        default:
          throw new Error(`Tipo no soportado: ${tipo}`)
      }
    }
    throw new Error(`Valor no válido para "control".`)
  }

  public getControlReleaseObservable(control: string[]): Observable<void> {
    if (control != null && Array.isArray(control) && control.length > 1) {
      let tipo: string = control[0]
      let key: string = control[1]
      switch (tipo) {
        case "Keyboard":
          return fromEvent(document, 'keyup').pipe(
            filter(p => (p as KeyboardEvent).code == key),
            map(() => void(0))
          )
        case "Controller":
          return this.gamepad.getControlReleasedObservable().pipe(
            filter(p => p == key),
            map(() => void(0))
          )
        default:
          throw new Error(`Tipo no soportado: ${tipo}`)
      }
    }
    throw new Error(`Valor no válido para "control".`)
  }

  //#endregion


}
