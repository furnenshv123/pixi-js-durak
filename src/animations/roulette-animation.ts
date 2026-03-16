import { Application, Container, Graphics, Text, TextStyle, Ticker } from 'pixi.js';

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

const SPIN_DUR = 3.5;      
const MIN_SPINS = 5;        

type RouletteResult = 'player' | 'enemy';

export class RouletteAnimation {
  private app: Application;
  private container: Container;
  private wheel!: Container;
  private pointer!: Graphics;

  private spinning = false;
  private phaseTime = 0;
  private fromRot = 0;
  private toRot = 0;
  private winner: RouletteResult = 'player';

  private onComplete?: (result: RouletteResult) => void;

  constructor(app: Application, parent: Container, onComplete?: (result: RouletteResult) => void) {
    this.app = app;
    this.onComplete = onComplete;

    this.container = new Container();
    this.container.x = app.screen.width / 2;
    this.container.y = app.screen.height / 2;
    parent.addChild(this.container);

    this.buildWheel();
    this.buildPointer();
  }


  private buildWheel(): void {
    this.wheel = new Container();
    this.container.addChild(this.wheel);

    const radius = 120;

    const sections = [
      { label: '👤 You',    color: 0x2255aa, from: 0,        to: Math.PI },     
      { label: '🤖 Enemy',  color: 0xaa2222, from: Math.PI,  to: Math.PI * 2 }, 
    ];

    for (const section of sections) {
      const slice = new Graphics();
      slice.moveTo(0, 0);
      slice.arc(0, 0, radius, section.from, section.to);
      slice.lineTo(0, 0);
      slice.fill(section.color);
      slice.stroke({ color: 0xffffff, width: 2 });
      this.wheel.addChild(slice);

      const midAngle = (section.from + section.to) / 2;
      const label = new Text({
        text: section.label,
        style: new TextStyle({
          fontFamily: 'monospace',
          fontSize: 18,
          fontWeight: 'bold',
          fill: 0xffffff,
        }),
      });
      label.anchor.set(0.5);
      label.x = Math.cos(midAngle) * (radius * 0.6);
      label.y = Math.sin(midAngle) * (radius * 0.6);
      this.wheel.addChild(label);
    }

    const center = new Graphics()
      .circle(0, 0, 16)
      .fill(0xffffff)
      .stroke({ color: 0x333333, width: 2 });
    this.wheel.addChild(center);
  }

  private buildPointer(): void {
    
    this.pointer = new Graphics();
    this.pointer.moveTo(0, 0);
    this.pointer.lineTo(-12, -28);
    this.pointer.lineTo(12, -28);
    this.pointer.lineTo(0, 0);
    this.pointer.fill(0xffd700);
    this.pointer.stroke({ color: 0xffffff, width: 1 });
    this.pointer.y = -150; 
    this.container.addChild(this.pointer);
  }


  spin(): void {
    if (this.spinning) return;
    this.spinning = true;
    this.phaseTime = 0;
    this.fromRot = this.wheel.rotation;

    this.winner = Math.random() < 0.5 ? 'player' : 'enemy';

    const baseAngle = this.winner === 'player' ? -Math.PI : 0;

    const offset = (Math.random() * 0.8 - 0.4); 
    const targetAngle = baseAngle + offset;

    const currentNorm = ((this.fromRot % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const targetNorm  = ((targetAngle  % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    let delta = targetNorm - currentNorm;
    if (delta < 0) delta += Math.PI * 2;

    this.toRot = this.fromRot + delta + MIN_SPINS * Math.PI * 2;

    this.app.ticker.add(this.tick, this);
  }

  destroy(): void {
    this.app.ticker.remove(this.tick, this);
    this.container.destroy({ children: true });
  }


  private tick = (ticker: Ticker): void => {
    const dt = ticker.deltaMS / 1000;
    this.phaseTime += dt;

    const t = easeOut(Math.min(this.phaseTime / SPIN_DUR, 1));
    this.wheel.rotation = this.fromRot + (this.toRot - this.fromRot) * t;

    if (this.phaseTime >= SPIN_DUR) {
      this.wheel.rotation = this.toRot;
      this.spinning = false;
      this.app.ticker.remove(this.tick, this);
      this.announceResult();
    }
  };


  private announceResult(): void {
    const result = this.winner; 

    const label = new Text({
      text: result === 'player' ? '👤 You go first!' : '🤖 Enemy goes first!',
      style: new TextStyle({
        fontFamily: 'monospace',
        fontSize: 22,
        fontWeight: 'bold',
        fill: 0xffd700,
      }),
    });
    label.anchor.set(0.5);
    label.y = 170;
    this.container.addChild(label);

    this.onComplete?.(result);
  }
}