import { Component, NgZone, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TableroComponent } from './tablero/tablero.component';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, filter, firstValueFrom, fromEvent, Subject, takeUntil, timer } from 'rxjs';
import { ConfigComponent } from './config/config.component';
import { ControlsService } from './services/controls.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    TableroComponent,
    CommonModule,
    ConfigComponent,
    TranslateModule
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
  @ViewChild("configScreen") public configScreen!: ConfigComponent
  public config: boolean = false
  public numJugadores!: BehaviorSubject<number>
  public keysDestroy$ = new Subject<void>()
  public bindPauseSubject = new Subject<void>()
  
  //#endregion

  //#region Constructor

  constructor(
    private controls: ControlsService,
    private translate: TranslateService
  ) {
    this.randomSeed = Math.random() * 1000000
    let numPlayers = 1
    try {
      numPlayers = JSON.parse(localStorage.getItem('numPlayers') as string)
    } catch (ex) {}
    this.numJugadores = new BehaviorSubject<number>(numPlayers)
    this.bindPauseSubject.pipe(
      takeUntil(this.destory$)
    ).subscribe(() => {
      this.bindPause()
    })
  }

  //#endregion

  //#region Pausa

  public bindPause(): void {
    this.keysDestroy$.next()
    if (this.jugador1) {
      this.controls.getControlPressObservable(this.jugador1.configTeclas["Pause"]).pipe(
        takeUntil(this.destory$),
        takeUntil(this.keysDestroy$)
      ).subscribe(() => {
        if (!this.config) {
          this.pause = !this.pause
        }
      })
    }
    if (this.jugador2) {
      this.controls.getControlPressObservable(this.jugador2.configTeclas["Pause"]).pipe(
        takeUntil(this.destory$),
        takeUntil(this.keysDestroy$)
      ).subscribe(() => {
        if (!this.config) {
          this.pause = !this.pause
        }
      })
    }
  }

  //#endregion

  //#region Init

  public getLanguage(langString: string): string {
    let language: string
    if (langString.indexOf('-') != -1) {
      language = langString.split('-')[0]
    } else {
      language = langString.toLowerCase()
    }    
    switch (language.toLowerCase()) {
      case 'es':
        return 'es'
      default:
        return 'en'
    }
  }

  public ngOnInit(): void {
    let language = localStorage.getItem('language') || this.getLanguage(navigator.language)
    this.translate.setDefaultLang(language);
  }

  public async ngAfterViewInit(): Promise<void> {
    await this.loadConfig()
  }

  public async loadConfig(): Promise<void> {
    try {
      this.jugador1.configTeclas = JSON.parse(localStorage.getItem('configTeclas1') as string)
      this.jugador2.configTeclas = JSON.parse(localStorage.getItem('configTeclas2') as string)
    } catch (ex) { }
    // No se puede cargar la configuración, revertimos a los valores predeterminados
    if (this.jugador1) {
      if (this.jugador1.configTeclas == null) this.jugador1.configTeclas = {
        "Izquierda": ["Keyboard", "KeyA"],
        "Derecha": ["Keyboard", "KeyD"],
        "Abajo": ["Keyboard", "KeyS"],
        "RotarCW": ["Keyboard", "Period"],
        "RotarCCW": ["Keyboard", "Comma"],
        "Pause": ["Keyboard", "KeyP"]
      }
      this.jugador1?.keySettingsReset()
    }
    if (this.jugador2) {
      if (this.jugador2.configTeclas == null) this.jugador2.configTeclas = {
        "Izquierda": ["Keyboard", "ArrowLeft"],
        "Derecha": ["Keyboard", "ArrowRight"],
        "Abajo": ["Keyboard", "ArrowDown"],
        "RotarCW": ["Keyboard", "ShiftRight"],
        "RotarCCW": ["Keyboard", "Slash"],
        "Pause": ["Keyboard", "Enter"]
      }
      this.jugador2?.keySettingsReset()
    }
    this.bindPauseSubject.next()
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
    if (jugador == 1) this.jugador2?.putear(numLineasAdd)
    if (jugador == 2) this.jugador1?.putear(numLineasAdd)
  }

  //#endregion

  //#region Reset

  public async reset(): Promise<void> {
    this.randomSeed = Math.random() * 1000000
    if (this.jugador1) {
      this.jugador1.rndSeed = this.randomSeed
      this.jugador1.reset()
    }
    if (this.jugador2) {
      this.jugador2.rndSeed = this.randomSeed
      this.jugador2.reset()
    }
  }

  //#endregion

  //#region Configuración

  public async showConfig(): Promise<void> {
    this.config = true
    await firstValueFrom(timer(0))
    this.configScreen.jugador1 = this.jugador1
    this.configScreen.jugador2 = this.jugador2
  }

  //#endregion

  //#region Número de jugadores

  public async setPlayers(numPlayers: number): Promise<void> {
    localStorage.setItem('numPlayers', JSON.stringify(numPlayers))
    this.numJugadores.next(numPlayers)
    await firstValueFrom(timer(0))
    this.configScreen.jugador1 = this.jugador1
    this.configScreen.jugador2 = this.jugador2
    await this.loadConfig()
    this.reset()
  }

  //#endregion

}
