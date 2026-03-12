import { Application, Assets, Container, Sprite, Ticker } from 'pixi.js';


function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}


interface AnimCard extends Sprite {
  fromX: number;
  fromY: number;
  fromRot: number;
  toX: number;
  toY: number;
  toRot: number;
}

type Phase = 'split' | 'riffle' | 'settle' | 'idle';


const CARD_COUNT = 36;
const CARD_W = 80;
const CARD_H = 112;
const SPLIT_DUR = 0.55;
const CARD_INTERVAL = 0.042;
const CARD_FLY_DUR = 0.28;
const SETTLE_DUR = 0.45;
const SHUFFLES = 3;


export class ShuffleAnimation {
  private container: Container;
  private app: Application;
  private cards: AnimCard[] = [];
  private phase: Phase = 'idle';
  private phaseTime = 0;
  private shufflesLeft = 0;
  private riffleQueue: AnimCard[] = [];
  private onComplete?: () => void;
  private onShufflingDeck?: () => void;
    private cx = 0;
  private cy = 0;

  private destX = 0;
  private destY = 0;

  constructor(app: Application, container: Container) {
    this.app = app;
    this.container = container;
  }

  getCards(): AnimCard[] {
    return this.cards;
  }
  play(
    onComplete?: () => void,
    destX?: number,
    destY?: number,
    onShufflingDeck?: () => void
  ): void {
    this.onComplete = onComplete;
    this.onShufflingDeck = onShufflingDeck;
    this.cx = this.app.screen.width / 2;
    this.cy = this.app.screen.height / 2;
    this.destX = destX ?? this.cx;
    this.destY = destY ?? this.cy;

    this.buildCards();
    
    this.shufflesLeft = SHUFFLES;
    this.beginSplit();
    this.app.ticker.add(this.tick, this);
  }

  destroy(): void {
    this.app.ticker.remove(this.tick, this);
    for (const c of this.cards) c.destroy();
    this.cards = [];
  }


  private buildCards(): void {
    const texture = Assets.get('card_back');
    this.container.sortableChildren = true;
    this.onShufflingDeck?.();
    for (let i = 0; i < CARD_COUNT; i++) {
      const sprite = new Sprite(texture) as AnimCard;
      sprite.anchor.set(0.5);
      sprite.width = CARD_W;
      sprite.height = CARD_H;

      sprite.x = this.cx + i * 0.15;
      sprite.y = this.cy - i * 0.4;
      sprite.zIndex = i;

      sprite.fromX = sprite.x;
      sprite.fromY = sprite.y;
      sprite.fromRot = 0;
      sprite.toX = sprite.x;
      sprite.toY = sprite.y;
      sprite.toRot = 0;

      this.container.addChild(sprite);
      this.cards.push(sprite);
    }
  }


  private beginSplit(): void {
    this.phase = 'split';
    this.phaseTime = 0;

    const half = CARD_COUNT / 2;

    for (let i = 0; i < CARD_COUNT; i++) {
      const c = this.cards[i];
      c.fromX = c.x;
      c.fromY = c.y;
      c.fromRot = c.rotation;

      if (i < half) {
        const progress = i / half;
        c.toX = this.cx - 130 + progress * 5;
        c.toY = this.cy - (half - i) * 0.5;
        c.toRot = -0.10 - progress * 0.04;
      } else {
        const j = i - half;
        const progress = j / half;
        c.toX = this.cx + 130 - progress * 5;
        c.toY = this.cy - (CARD_COUNT - i) * 0.5;
        c.toRot = 0.10 + progress * 0.04;
      }
    }
  }


  private beginRiffle(): void {
    this.phase = 'riffle';
    this.phaseTime = 0;

    const half = CARD_COUNT / 2;
    const left = this.cards.slice(0, half).reverse();
    const right = this.cards.slice(half).reverse();

    this.riffleQueue = [];
    let l = 0, r = 0;

    while (l < left.length || r < right.length) {
      const fromLeft = Math.min(Math.ceil(Math.random() * 2), left.length - l);
      for (let k = 0; k < fromLeft && l < left.length; k++, l++) {
        this.riffleQueue.push(left[l]);
      }
      const fromRight = Math.min(Math.ceil(Math.random() * 2), right.length - r);
      for (let k = 0; k < fromRight && r < right.length; k++, r++) {
        this.riffleQueue.push(right[r]);
      }
    }

    for (let i = 0; i < this.riffleQueue.length; i++) {
      const c = this.riffleQueue[i];
      c.fromX = c.x;
      c.fromY = c.y;
      c.fromRot = c.rotation;
      c.toX = this.cx + (Math.random() - 0.5) * 8;
      c.toY = this.cy - i * 0.4;
      c.toRot = (Math.random() - 0.5) * 0.04;
      c.zIndex = i;
    }
  }


  private beginSettle(): void {
    this.phase = 'settle';
    this.phaseTime = 0;

    for (let i = 0; i < this.cards.length; i++) {
      const c = this.cards[i];
      c.fromX = c.x;
      c.fromY = c.y;
      c.fromRot = c.rotation;
      c.toX = this.destX + i * 0.15;
      c.toY = this.destY - i * 0.4;
      c.toRot = 0;
      c.zIndex = i;
    }
  }


  private tick = (ticker: Ticker): void => {
    const dt = ticker.deltaMS / 1000;

    if (this.phase === 'split') {
      this.phaseTime += dt;
      const t = easeInOut(Math.min(this.phaseTime / SPLIT_DUR, 1));

      for (const c of this.cards) {
        c.x = lerp(c.fromX, c.toX, t);
        c.y = lerp(c.fromY, c.toY, t);
        c.rotation = lerp(c.fromRot, c.toRot, t);
      }

      if (this.phaseTime >= SPLIT_DUR) this.beginRiffle();

    } else if (this.phase === 'riffle') {
      this.phaseTime += dt;

      for (let i = 0; i < this.riffleQueue.length; i++) {
        const cardStart = i * CARD_INTERVAL;
        const elapsed = this.phaseTime - cardStart;
        if (elapsed <= 0) break;

        const c = this.riffleQueue[i];
        const t = easeOut(Math.min(elapsed / CARD_FLY_DUR, 1));
        c.x = lerp(c.fromX, c.toX, t);
        c.y = lerp(c.fromY, c.toY, t);
        c.rotation = lerp(c.fromRot, c.toRot, t);
      }

      const totalDur = this.riffleQueue.length * CARD_INTERVAL + CARD_FLY_DUR + 0.05;
      if (this.phaseTime >= totalDur) {
        this.shufflesLeft--;
        if (this.shufflesLeft > 0) {
          this.beginSplit();
        } else {
          this.beginSettle();
        }
      }

    } else if (this.phase === 'settle') {
      this.phaseTime += dt;
      const t = easeOut(Math.min(this.phaseTime / SETTLE_DUR, 1));

      for (const c of this.cards) {
        c.x = lerp(c.fromX, c.toX, t);
        c.y = lerp(c.fromY, c.toY, t);
        c.rotation = lerp(c.fromRot, c.toRot, t);
      }

      if (this.phaseTime >= SETTLE_DUR) {
        this.phase = 'idle';
        this.app.ticker.remove(this.tick, this);
        this.onComplete?.();
      }
    }
  };
}
