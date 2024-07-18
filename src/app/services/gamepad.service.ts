import { Injectable, NgZone } from '@angular/core';
import { firstValueFrom, interval, Observable, Subject, Subscriber, takeUntil, timer } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GamepadService {
  
  //#region Propiedades

  private destroy$ = new Subject<void>()
  private gamepads: Record<number, boolean[]>
  private buttonPressed = new Subject<string>()
  private buttonReleased = new Subject<string>()

  //#endregion

  //#region Constructor

  constructor(
    private zone: NgZone
  ) {
    this.gamepads = {}
    this.zone.runOutsideAngular(() => {
      interval(16.667).pipe(
        takeUntil(this.destroy$)
      ).subscribe(() => {
        this.updateGamepadStatus()
      })
    })
  }
  
  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  //#endregion

  //#region Observable

  public getControlPressedObservable(): Observable<string> {
    let observableControlPressed = new Observable<string>((subscriber: Subscriber<string>) => {
      let subscription = this.buttonPressed.subscribe((buttonName) => {
        this.zone.run(() => {
          subscriber.next(buttonName)
        })
      })
      return () => {
        subscription.unsubscribe()
      }
    })
    return observableControlPressed
  }

  public getControlReleasedObservable(): Observable<string> {
    let observableControlReleased = new Observable<string>((subscriber: Subscriber<string>) => {
      let subscription = this.buttonReleased.subscribe((buttonName) => {
        this.zone.run(() => {
          subscriber.next(buttonName)
        })
      })
      return () => {
        subscription.unsubscribe()
      }
    })
    return observableControlReleased
  }

  //#endregion

  //#region Gamepad

  private updateGamepadStatus() {
    const gamepads = navigator.getGamepads()
    for (let i = 0; i < gamepads.length; ++i) {
      const gamepad = gamepads[i]
      if (gamepad) {
        let oldButtonStatus = this.gamepads[i]
        let newButtonStatus = []
        for (let button = 0; button < gamepad.buttons.length; ++button) {
          if (oldButtonStatus) {
            if (gamepad.buttons[button].pressed && (!oldButtonStatus[button])) {
              this.buttonPressed.next(`Gamepad ${i + 1}: Button ${button}`)
            }
            if ((!gamepad.buttons[button].pressed) && oldButtonStatus[button]) {
              this.buttonReleased.next(`Gamepad ${i + 1}: Button ${button}`)
            }
          } 
          newButtonStatus.push(gamepad.buttons[button].pressed)
        }
        this.gamepads[i] = newButtonStatus
      }
    }
  }

  //#endregion

}
