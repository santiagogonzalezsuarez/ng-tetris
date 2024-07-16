import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BehaviorSubject, filter, firstValueFrom, fromEvent, interval, startWith, Subject, takeUntil, timer } from 'rxjs';
import { ControlsService } from '../services/controls.service';
import * as randomSeed from 'random-seed'

@Component({
  selector: 'app-tablero',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './tablero.component.html',
  styleUrl: './tablero.component.scss'
})
export class TableroComponent {

  //#region Propiedades

  public Tablero$!: BehaviorSubject<number[]>
  @Input("filas") public filas: number = 20
  @Input("columnas") public columnas: number = 10
  @Input("tamano-cuadradito") public tamanoCuadradito: number = 30
  public colores = [0, 360, 35, 51, 123, 204, 255, 296]
  public pieza: number[][] | null = null
  public piezaSiguiente: number[][] | null = null
  public piezaX = 3
  public piezaY = -1
  private destroy$ = new Subject<void>()
  public rotacion: number = 0
  @Input("pause") public pause: boolean = false
  private PiezaColocada$ = new Subject<void>()
  private ResetFall$ = new Subject<void>()
  public gameOver: boolean = false
  public Puntuacion$ = new BehaviorSubject<number>(0)
  private pushDownPoints: number = 0
  public nivel: number = 0
  public lines: number = 0
  @Input("config-teclas") public configTeclas = {
    "Izquierda": ["Keyboard", "a"],
    "Derecha": ["Keyboard", "d"],
    "Abajo": ["Keyboard", "s"],
    "RotarCW": ["Keyboard", "."],
    "RotarCCW": ["Keyboard", ","]
  }
  @Input("random-seed") public rndSeed: number = 0
  private rnd?: randomSeed.RandomSeed
  @Output("hacer-lineas") public hacerLinea = new EventEmitter<number>()

  // La velocidad de cada nivel la copio del Tetris original de la NES, las unidades son el número de Frames que tardan
  // en bajar las piezas en una pantalla NSTC (60fps)
  public LevelsSpeed = [48, 43, 38, 33, 28, 23, 18, 13, 8, 6, 5, 5, 5, 4, 4, 4, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1]
  public numLineasAdd: number = 0

  //#endregion

  //#region Randomness

  public setRandomSeed(): void {
    this.rnd = randomSeed.create(this.rndSeed.toString())
  }

  //#endregion

  //#region Piezas y rotaciones

  public piezas = [
    /* PALO */
    [
      [
        0, 0, 0, 0,
        0, 0, 0, 0,
        1, 1, 1, 1,
        0, 0, 0, 0
      ],
      [
        0, 0, 1, 0,
        0, 0, 1, 0,
        0, 0, 1, 0,
        0, 0, 1, 0
      ]
    ],
    /* J */
    [
      [
        0, 0, 0,
        2, 2, 2,
        0, 0, 2
      ],
      [
        0, 2, 0,
        0, 2, 0,
        2, 2, 0
      ],
      [
        2, 0, 0,
        2, 2, 2,
        0, 0, 0
      ],
      [
        0, 2, 2,
        0, 2, 0,
        0, 2, 0
      ]
    ],
    /* L */
    [
      [
        0, 0, 0,
        3, 3, 3,
        3, 0, 0
      ],
      [
        3, 3, 0,
        0, 3, 0,
        0, 3, 0
      ],
      [
        0, 0, 3,
        3, 3, 3,
        0, 0, 0
      ],
      [
        0, 3, 0,
        0, 3, 0,
        0, 3, 3
      ] 
    ],
    /* CUADRADO */
    [
      [
        4, 4,
        4, 4
      ]
    ],
    /* S */
    [
      [
        0, 0, 0,
        0, 5, 5,
        5, 5, 0
      ],
      [
        0, 5, 0,
        0, 5, 5,
        0, 0, 5
      ]
    ],
    /* T */
    [
      [
        0, 0, 0,
        6, 6, 6,
        0, 6, 0
      ],
      [
        0, 6, 0,
        6, 6, 0,
        0, 6, 0
      ],
      [
        0, 6, 0,
        6, 6, 6,
        0, 0, 0
      ],
      [
        0, 6, 0,
        0, 6, 6,
        0, 6, 0
      ]
    ],
    /* Z */
    [
      [
        0, 0, 0,
        7, 7, 0,
        0, 7, 7
      ],
      [
        0, 0, 7,
        0, 7, 7,
        0, 7, 0
      ]
    ]
  ]

  //#endregion

  //#region Init

  constructor(
    private controls: ControlsService
  ) { }

  private centerPiece(): void {
    if (this.pieza) {
      this.piezaX = Math.floor(this.columnas / 2 - this.getPiezaSize(this.pieza[this.rotacion]) / 2)
    }
  }

  public calcularVelocidadNivel(nivel: number): number {
    let frames = 1
    if (nivel < this.LevelsSpeed.length) {
      frames = this.LevelsSpeed[nivel]
    }
    let speed = frames / 60 * 1000
    return speed
  }

  public startToFallPiece() {
    this.ResetFall$.next()
    interval(this.calcularVelocidadNivel(this.nivel)).pipe(
      filter(() => !this.pause),
      filter(() => !this.gameOver),
      takeUntil(this.destroy$),
      takeUntil(this.ResetFall$)
    ).subscribe(() => {
      this.moveDown()
      this.update()
    })
  }

  public ngOnInit(): void {

    this.setRandomSeed()
    let tablero: number[] = []
    for (let j = 0; j < this.filas; ++j) {
      for (let i = 0; i < this.columnas; ++i) {
        tablero.push(0)
      }
    }
    this.Tablero$ = new BehaviorSubject<number[]>(tablero)
    let pieceNumber = Math.floor(this.rnd!.random() * 7)
    this.pieza = this.piezas[pieceNumber]
    this.piezaY = pieceNumber == 0 ? -2 : pieceNumber == 3 ? 0 : -1
    this.piezaSiguiente = this.piezas[Math.floor(this.rnd!.random() * 7)]
    this.centerPiece()

    this.startToFallPiece()

    this.bindKeys()

  }

  public async reset(): Promise<void> {
    this.setRandomSeed()
    let tablero: number[] = []
    for (let j = 0; j < this.filas; ++j) {
      for (let i = 0; i < this.columnas; ++i) {
        tablero.push(0)
      }
    }
    this.Tablero$.next(tablero)
    let pieceNumber = Math.floor(this.rnd!.random() * 7)
    this.pieza = this.piezas[pieceNumber]
    this.piezaY = pieceNumber == 0 ? -2 : pieceNumber == 3 ? 0 : -1
    this.piezaSiguiente = this.piezas[Math.floor(this.rnd!.random() * 7)]
    this.centerPiece
    this.gameOver = false
    this.numLineasAdd = 0
    this.nivel = 0
    this.lines = 0
    this.Puntuacion$.next(0)

    this.startToFallPiece()

  }

  private bindKeys(): void {

    let leftPushed = false
    let rightPushed = false
    let downPushed = false

    // Izquierda
    this.controls.getControlPressObservable(this.configTeclas["Izquierda"]).pipe(
      takeUntil(this.destroy$),
      filter(() => !this.pause),
      filter(() => !this.gameOver)
    ).subscribe(() => {
      if (leftPushed) return
      leftPushed = true
      let keyDestroy$ = new Subject<void>()
      interval(100).pipe(
        startWith(0),
        takeUntil(keyDestroy$)
      ).subscribe(() => {
        this.moveLeft()
      })
      this.controls.getControlReleaseObservable(this.configTeclas["Izquierda"]).pipe(
        takeUntil(keyDestroy$)
      ).subscribe(() => {
        leftPushed = false
        keyDestroy$.next()
      })
    })

    // Derecha
    this.controls.getControlPressObservable(this.configTeclas["Derecha"]).pipe(
      takeUntil(this.destroy$),
      filter(() => !this.pause),
      filter(() => !this.gameOver)
    ).subscribe(() => {
      if (rightPushed) return
      rightPushed = true
      let keyDestroy$ = new Subject<void>()
      interval(100).pipe(
        startWith(0),
        takeUntil(keyDestroy$)
      ).subscribe(() => {
        this.moveRight()
      })
      this.controls.getControlReleaseObservable(this.configTeclas["Derecha"]).pipe(
        takeUntil(keyDestroy$)
      ).subscribe(() => {
        rightPushed = false
        keyDestroy$.next()
      })
    })

    // Abajo
    this.controls.getControlPressObservable(this.configTeclas["Abajo"]).pipe(
      takeUntil(this.destroy$),
      filter(() => !this.pause),
      filter(() => !this.gameOver)
    ).subscribe(() => {
      if (downPushed) return
      downPushed = true
      let keyDestroy$ = new Subject<void>()
      interval(50).pipe(
        startWith(0),
        takeUntil(keyDestroy$),
        takeUntil(this.PiezaColocada$)
      ).subscribe((c) => {
        this.pushDownPoints++
        this.moveDown()
        this.startToFallPiece() // Reseteamos el timer que hace que bajen las piezas.
      })
      this.controls.getControlReleaseObservable(this.configTeclas["Abajo"]).pipe(
        takeUntil(keyDestroy$)
      ).subscribe(() => {
        downPushed = false
        keyDestroy$.next()
      })
    })

    // Rotación (en sentido de las agujas del reloj)
    this.controls.getControlPressObservable(this.configTeclas["RotarCW"]).pipe(
      takeUntil(this.destroy$),
      filter(() => !this.pause),
      filter(() => !this.gameOver)
    ).subscribe(() => {
      this.rotateCW()
    })

    // Rotación (en sentido contrario de las agujas del reloj)
    this.controls.getControlPressObservable(this.configTeclas["RotarCCW"]).pipe(
      takeUntil(this.destroy$),
      filter(() => !this.pause),
      filter(() => !this.gameOver)
    ).subscribe(() => {
      this.rotateCCW()
    })

  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  //#endregion

  //#region Movimiento de las piezas

  public async moveLeft(): Promise<void> {
    if (!this.pieza) return
    if (await this.piezaChocaConTablero(this.pieza[this.rotacion], this.piezaX - 1, this.piezaY)) return
    this.piezaX--
    this.update()
  }

  public async moveRight(): Promise<void> {
    if (!this.pieza) return
    if (await this.piezaChocaConTablero(this.pieza[this.rotacion], this.piezaX + 1, this.piezaY)) return
    this.piezaX++
    this.update()
  }

  public async moveDown(): Promise<void> {
    if (!this.pieza) return
    if (await this.piezaChocaConTablero(this.pieza[this.rotacion], this.piezaX, this.piezaY + 1)) {
      if (this.gameOver) return
      await this.acoplarPieza(this.pieza[this.rotacion], this.piezaX, this.piezaY)
      await this.AddPoints(this.pushDownPoints)
      this.pushDownPoints = 0
      this.pieza = null
      await this.checkLineas()
      await this.addLineasAleatoriasAbajo(this.numLineasAdd)
      this.numLineasAdd = 0
      this.pieza = this.piezaSiguiente
      this.piezaSiguiente = this.piezas[Math.floor(this.rnd!.random() * 7)]
      let pieceNumber = this.piezas.indexOf(this.pieza!) 
      this.piezaY = pieceNumber == 0 ? -2 : pieceNumber == 3 ? 0 : -1
      this.rotacion = 0
      this.centerPiece()
      this.PiezaColocada$.next()
      if (await this.piezaChocaConTablero(this.pieza![this.rotacion], this.piezaX, this.piezaY)) {
        this.gameOver = true
        this.update()
      }
    } else {
      this.piezaY++
    }
    this.update()
  }

  private async checkLineas(): Promise<void> {
    let tablero = await firstValueFrom(this.Tablero$)
    let hayLineas: boolean = false
    for (let j = 0; j < this.filas; ++j) {
      let linea: boolean = true
      for (let i = 0; i < this.columnas && linea; ++i) {
        if (tablero[j * this.columnas + i] == 0) {
          linea = false
        }
      }
      if (linea) {
        hayLineas = true
        for (let i = 0; i < this.columnas; ++i) {
          tablero[j * this.columnas + i] += 8
        }
      }
    }
    if (hayLineas) {
      await firstValueFrom(timer(500))
      let numLineas = 0

      // Eliminamos las líneas y bajamos todo lo demás.
      for (let j = this.filas - 1; j >= 0; --j) {
        let linea: boolean = true
        while (linea) {
          for (let i = 0; i < this.columnas && linea; ++i) {
            if (tablero[j * this.columnas + i] == 0) {
              linea = false
            }
          }
          if (linea) {   
            numLineas++         
            // Copiamos todo el tablero hasta esta línea hacia abajo y eliminamos la línea de más arriba.
            for (let j2 = j; j2 >= 1; --j2) {
              for (let i = 0; i < this.columnas; ++i) {
                tablero[j2 * this.columnas + i] = tablero[(j2 - 1) * this.columnas + i]
              }
            }
            for (let i = 0; i < this.columnas; ++i) {
              tablero[i] = 0
            }
            this.Tablero$.next(tablero)
          } else {
            break
          }
        }
      }

      this.lines += numLineas
      this.hacerLinea.emit(numLineas)
      let nivelPorLineas = Math.floor(this.lines / 10)
      if (nivelPorLineas > this.nivel) {
        this.nivel = nivelPorLineas
        this.startToFallPiece()
      }
      this.AddPoints([0, 40, 100, 300, 1200][numLineas] * (this.nivel + 1))
      this.Tablero$.next(tablero)
    }
  }

  public async rotateCW(): Promise<void> {
    if (!this.pieza) return
    let rotacion = this.rotacion + 1
    if (rotacion >= this.pieza.length) rotacion = 0
    if (await this.piezaChocaConTablero(this.pieza[rotacion], this.piezaX, this.piezaY)) return
    this.rotacion = rotacion
    this.update()
  }

  public async rotateCCW(): Promise<void> {
    if (!this.pieza) return
    let rotacion = this.rotacion - 1
    if (rotacion < 0) rotacion = this.pieza.length - 1
    if (await this.piezaChocaConTablero(this.pieza[rotacion], this.piezaX, this.piezaY)) return
    this.rotacion = rotacion
    this.update()
  }

  //#endregion

  //#region Útil

  public getRows(tablero: number[]): number[][] {
    const result = [];
    for (let i = 0; i < tablero.length; i += this.columnas) {
      const chunk = tablero.slice(i, i + this.columnas);
      result.push(chunk);
    }
    return result;
  }

  public getPiezaSize(pieza: number[]): number {
    return Math.floor(Math.sqrt(pieza.length))
  }

  public getIterArray(n: number): number[] {
    return Array.from(Array(n).keys())
  }

  public async AddPoints(points: number): Promise<void> {
    let puntuacion = await firstValueFrom(this.Puntuacion$)
    puntuacion += points
    this.Puntuacion$.next(puntuacion)
  }

  //#endregion

  //#region Colisión

  public async piezaChocaConTablero(pieza: number[], piezaX: number, piezaY: number): Promise<boolean> {
    let piezaSize = this.getPiezaSize(pieza)
    let tablero = await firstValueFrom(this.Tablero$)
    for (let i = 0; i < piezaSize; ++i) {
      for (let j = 0; j < piezaSize; ++j) {
        if (
          i + piezaX >= 0 && i + piezaX < this.columnas &&
          j + piezaY >= 0 && j + piezaY < this.filas
        ) {
          if (pieza[j * piezaSize + i] != 0) {
            if (tablero[(j + piezaY) * this.columnas + (i + piezaX)] != 0) {
              return true
            }
          }
        } else {
          if (pieza[j * piezaSize + i] != 0) {
            // Nos estamos saliendo del tablero con un punto de la pieza que no es blanco, consideramos que estamos chocando
            // (con el borde de la pantalla, pero no consideramos colisión si choca por arriba.)
            if (j + piezaY >= 0) return true
            if (i + piezaX < 0 || i + piezaX >= this.columnas) return true // También nos salimos si la pieza está arriba pero se sale en el eje horizontal.
          }
        }
      }
    }
    return false
  }

  public async acoplarPieza(pieza: number[], piezaX: number, piezaY: number): Promise<void> {
    let piezaSize = this.getPiezaSize(pieza)
    let tablero = await firstValueFrom(this.Tablero$)
    for (let i = 0; i < piezaSize; ++i) {
      for (let j = 0; j < piezaSize; ++j) {
        if (
          i + piezaX >= 0 && i + piezaX < this.columnas &&
          j + piezaY >= 0 && j + piezaX < this.filas
        ) {
          if (pieza[j * piezaSize + i] != 0) {
            if (tablero[(j + piezaY) * this.columnas + (i + piezaX)] == 0) {
              tablero[(j + piezaY) * this.columnas + (i + piezaX)] = pieza[j * piezaSize + i]
            }
          }
        }
      }
    }
  }

  //#endregion

  //#region Update

  public async update(): Promise<void> {
    this.Tablero$.next(await firstValueFrom(this.Tablero$))
  }

  //#endregion

  //#region Contraoperativo

  public putear(numLineasAdd: number): void {
    this.numLineasAdd += numLineasAdd
  }

  // Añade líneas por la parte inferior del tablero con un hueco vacío para el modo contraoperativo.
  public async addLineasAleatoriasAbajo(numLineasAdd: number): Promise<void> {
    if (this.numLineasAdd < 1) return
    let tablero = await firstValueFrom(this.Tablero$)
    for (let j = numLineasAdd; j < this.filas; ++j) {
      for (let i = 0; i < this.columnas; ++i) {
        tablero[(j - numLineasAdd) * this.columnas + i] = tablero[j * this.columnas + i]
      }
    }
    for (let j = this.filas - numLineasAdd; j < this.filas; ++j) {
      let hueco = Math.floor(Math.random() * this.columnas)
      for (let i = 0; i < this.columnas; ++i) {
        if (i == hueco) {
          tablero[j * this.columnas + i] = 0
        } else {
          tablero[j * this.columnas + i] = 1 + Math.floor(Math.random() * 7)
        }
      }
    }
    this.Tablero$.next(tablero)
  }

  //#endregion

}
