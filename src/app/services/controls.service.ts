import { Injectable } from '@angular/core';
import { filter, fromEvent, Observable, Subject, takeUntil } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ControlsService {

  //#region Constructor

  constructor() { }

  //#endregion

  //#region Controles

  public getControlPressObservable(control: string[]): Observable<Event> {
    if (control != null && Array.isArray(control) && control.length > 1) {
      let tipo: string = control[0]
      let key: string = control[1]
      switch (tipo) {
        case "Keyboard":
          return fromEvent(document, 'keydown').pipe(
            filter(p => (p as KeyboardEvent).code == key)
          )
        default:
          throw new Error(`Tipo no soportado: ${tipo}`)
      }
    }
    throw new Error(`Valor no válido para "control".`)
  }

  public getControlReleaseObservable(control: string[]): Observable<Event> {
    if (control != null && Array.isArray(control) && control.length > 1) {
      let tipo: string = control[0]
      let key: string = control[1]
      switch (tipo) {
        case "Keyboard":
          return fromEvent(document, 'keyup').pipe(
            filter(p => (p as KeyboardEvent).code == key)
          )
        default:
          throw new Error(`Tipo no soportado: ${tipo}`)
      }
    }
    throw new Error(`Valor no válido para "control".`)
  }

  //#endregion


}
