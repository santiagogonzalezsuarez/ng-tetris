import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { TableroComponent } from '../tablero/tablero.component';
import { SetkeyComponent } from '../setkey/setkey.component';
import { CommonModule } from '@angular/common';
import { firstValueFrom, Subject, timer } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [
    SetkeyComponent,
    CommonModule,
    TranslateModule
  ],
  templateUrl: './config.component.html',
  styleUrl: './config.component.scss'
})
export class ConfigComponent {
  
  //#region Propiedades

  @Input("jugador1") public jugador1!: TableroComponent
  @Input("jugador2") public jugador2!: TableroComponent
  @Output("close") public close = new EventEmitter<void>()
  @ViewChild("setKey") public setKey!: SetkeyComponent
  @Output("set-players") public setPlayers = new EventEmitter<number>()
  @Input("bindPauseSubject") public bindPauseSubject?: Subject<void>

  //#endregion

  //#region Constructor

  constructor(
    public translate: TranslateService
  ) {}

  //#endregion

  //#region Opciones

  public getTecla(tecla: string[]): string {
    if (tecla == null || !Array.isArray(tecla)) return ''
    if (tecla[0] == 'Keyboard') {
      return tecla[1]
    }
    if (tecla[0] == 'Controller') {
      return tecla[1]
    }
    return ''
  }
  public showSetKey: boolean = false

  public async setTecla(nombreTecla: string, tecla: string[]): Promise<void> {
    this.showSetKey = true
    await firstValueFrom(timer(0))
    this.setKey.nombreTecla = nombreTecla
    let nuevaTecla = await firstValueFrom(this.setKey.getControlObservable())
    tecla[0] = nuevaTecla[0]
    tecla[1] = nuevaTecla[1]
    this.showSetKey = false
    if (this.jugador1) {
      this.jugador1.keySettingsReset()
      localStorage.setItem('configTeclas1', JSON.stringify(this.jugador1.configTeclas))
    }
    if (this.jugador2) {
      this.jugador2.keySettingsReset()
      localStorage.setItem('configTeclas2', JSON.stringify(this.jugador2.configTeclas))
    }
    if (this.bindPauseSubject) this.bindPauseSubject.next()
  }

  //#endregion

  //#region Idioma

  public setLanguage(language: string) {
    localStorage.setItem('language', language)
    this.translate.setDefaultLang(language)
  }

  //#endregion

}
