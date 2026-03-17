import { Application, Assets, Sprite, Ticker } from 'pixi.js';

const FLY_DUR = 0.55;     // total duration per card
const CARD_INTERVAL = 0.1; // stagger between cards

function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

interface DiscardCard {
  sprite: Sprite;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  delay: number;
  flipped: boolean;
  done: boolean;
}

export class DiscardAnimation {
  private app: Application;

  private queue: DiscardCard[] = [];
  private phaseTime = 0;
  private onComplete?: () => void;

  constructor(app: Application) {
    this.app = app;
  }

  play(sprites: Sprite[], onComplete?: () => void): void {
    this.onComplete = onComplete;
    this.queue = [];
    this.phaseTime = 0;

    if (sprites.length === 0) {
      onComplete?.();
      return;
    }

    const screenW = this.app.screen.width;
    const screenH = this.app.screen.height;

    const pileX = screenW + 60;
    const pileY = screenH / 2;

    for (let i = 0; i < sprites.length; i++) {
      const sp = sprites[i];
      this.queue.push({
        sprite: sp,
        fromX: sp.x,
        fromY: sp.y,
        toX: pileX,
        toY: pileY,
        delay: i * CARD_INTERVAL,
        flipped: false,
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
      const progress = Math.min(elapsed / FLY_DUR, 1);
      const t = easeInOut(progress);

      item.sprite.x = lerp(item.fromX, item.toX, t);
      item.sprite.y = lerp(item.fromY, item.toY, t);

      const flipT = progress * 2; 
      if (flipT <= 1) {
        item.sprite.scale.x = Math.abs(1 - flipT) * Math.sign(item.sprite.scale.x || 1) || 0.001;
      } else {
        if (!item.flipped) {
          item.flipped = true;
          item.sprite.texture = Assets.get('card_back');
        }
        item.sprite.scale.x = (flipT - 1);
      }

      if (elapsed >= FLY_DUR) {
        item.sprite.x = item.toX;
        item.sprite.y = item.toY;
        item.sprite.scale.x = 1;
        item.done = true;
      }

      allDone = false;
    }

    if (allDone) {
      this.app.ticker.remove(this.tick, this);
      this.onComplete?.();
    }
  };
}
