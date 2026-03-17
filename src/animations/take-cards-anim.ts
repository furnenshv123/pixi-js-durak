import { Application, Container, Sprite, Ticker } from 'pixi.js';

const CARD_W = 80;
const FLY_DUR = 0.38;
const CARD_INTERVAL = 0.1;

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function bezier(p0: number, p1: number, p2: number, t: number): number {
  return (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2;
}

interface FlyCard {
  sprite: Sprite;
  fromX: number;
  fromY: number;
  midX: number;
  midY: number;
  toX: number;
  toY: number;
  delay: number;
  done: boolean;
}

export class TakeCardsAnimation {
  private app: Application;
  private playerHandLayer: Container;

  private queue: FlyCard[] = [];
  private phaseTime = 0;
  private onComplete?: () => void;

  constructor(app: Application, playerHandLayer: Container) {
    this.app = app;
    this.playerHandLayer = playerHandLayer;
  }

  play(sprites: Sprite[], currentHandCount: number, onComplete?: () => void): void {
    this.onComplete = onComplete;
    this.queue = [];
    this.phaseTime = 0;

    if (sprites.length === 0) {
      onComplete?.();
      return;
    }

    const screenW = this.app.screen.width;
    const screenH = this.app.screen.height;
    const destY = screenH - 80;
    const spacing = CARD_W + 10;
    const totalAfter = currentHandCount + sprites.length;
    const totalWidth = (totalAfter - 1) * spacing;
    const startX = screenW / 2 - totalWidth / 2;
    const midY = screenH * 0.65;

    for (let i = 0; i < sprites.length; i++) {
      const sp = sprites[i];
      const handIndex = currentHandCount + i;
      const destX = startX + handIndex * spacing;

      this.queue.push({
        sprite: sp,
        fromX: sp.x,
        fromY: sp.y,
        midX: screenW / 2,
        midY,
        toX: destX,
        toY: destY,
        delay: i * CARD_INTERVAL,
        done: false,
      });
    }

    this.app.ticker.add(this.tick, this);
  }

  destroy(): void {
    this.app.ticker.remove(this.tick, this);
  }

  private tick = (ticker: Ticker): void => {
    const dt = ticker.deltaMS / 1000;
    this.phaseTime += dt;
    let allDone = true;

    for (const item of this.queue) {
      if (item.done) continue;

      if (this.phaseTime < item.delay) {
        allDone = false;
        continue;
      }

      const elapsed = this.phaseTime - item.delay;
      const t = easeOut(Math.min(elapsed / FLY_DUR, 1));

      item.sprite.x = bezier(item.fromX, item.midX, item.toX, t);
      item.sprite.y = bezier(item.fromY, item.midY, item.toY, t);
      item.sprite.rotation = Math.sin(t * Math.PI) * 0.2;

      if (elapsed >= FLY_DUR) {
        item.sprite.x = item.toX;
        item.sprite.y = item.toY;
        item.sprite.rotation = 0;
        item.done = true;
        this.playerHandLayer.addChild(item.sprite); 
      }

      allDone = false;
    }

    if (allDone) {
      this.app.ticker.remove(this.tick, this);
      this.onComplete?.();
    }
  };
}
