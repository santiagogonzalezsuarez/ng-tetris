import { Component, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TableroComponent } from './tablero/tablero.component';
import { CommonModule } from '@angular/common';
import { filter, fromEvent, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    TableroComponent,
    CommonModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  //#region Propiedades

  public pause: boolean = false
  private destory$ = new Subject<void>()
  public randomSeed: number = 0
  @ViewChild("jugador1") public jugador1!: TableroComponent
  @ViewChild("jugador2") public jugador2!: TableroComponent 
  
  //#endregion

  //#region Constructor

  constructor() {
    fromEvent(document, 'keydown').pipe(
      takeUntil(this.destory$),
      filter(p => (p as KeyboardEvent).key == 'p')
    ).subscribe(p => {
      this.pause = !this.pause
    })
    this.randomSeed = Math.random() * 1000000
  }

  //#endregion

  //#region Destructor

  ngOnDestroy(): void {
    this.destory$.next()
    this.destory$.complete()
  }

  //#endregion

  //#region Líneas

  public hacerLineas(jugador: number, lineas: number): void {
    let numLineasAdd = 0
    if (lineas == 3) numLineasAdd = 1
    if (lineas == 4) numLineasAdd = 2
    if (jugador == 1) this.jugador2.putear(numLineasAdd)
    if (jugador == 2) this.jugador1.putear(numLineasAdd)
  }

  //#endregion

  //#region Reset

  public async reset(): Promise<void> {
    this.randomSeed = Math.random() * 1000000
    this.jugador1.rndSeed = this.randomSeed
    this.jugador2.rndSeed = this.randomSeed
    this.jugador1.reset()
    this.jugador2.reset()
  }

  //#endregion

}
