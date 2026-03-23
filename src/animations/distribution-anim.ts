import { Application, Container, Sprite, Ticker, Assets } from 'pixi.js';
import { CardData } from '../types/cards/cards';


function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

const CARD_W = 80;
const CARD_H = 112;
const FLY_DUR = 0.35;         
const CARD_INTERVAL = 0.15;   
type Phase  = 'sliding' | 'done';
function bezier(p0: number, p1: number, p2: number, t: number): number {
  return (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2;
}

interface DealCard {
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

export class DistributeAnimation {
  private app: Application;
  private deckContainer: Container;       
  private playerContainer: Container;     
  private enemyContainer: Container;     
  phase : Phase = 'sliding';
  private dealQueue: DealCard[] = [];
  private phaseTime = 0;
  private onComplete?: () => void;

  constructor(
    app: Application,
    deckContainer: Container,
    playerContainer: Container,
    enemyContainer: Container,
    onComplete?: () => void
  ) {
    this.app = app;
    this.deckContainer = deckContainer;
    this.playerContainer = playerContainer;
    this.enemyContainer = enemyContainer;
    this.onComplete = onComplete;
  }

 
  play(playerCards: CardData[], enemyCards: CardData[]): void {
    this.dealQueue = [];
    this.phaseTime = 0;

    const topCard = this.deckContainer.children[
      this.deckContainer.children.length - 1
    ] as Sprite;

    const deckX = topCard.x;
    const deckY = topCard.y;

    const tableX = this.app.screen.width / 2;
    const tableY = this.app.screen.height / 2;

    const total = Math.max(playerCards.length, enemyCards.length);
    let delayCounter = 0;

    for (let i = 0; i < total; i++) {
      if (i < enemyCards.length) {
        const destX = this.calcHandX(i, enemyCards.length);
        const destY = 80; 

        this.dealQueue.push({
          sprite: this.buildCardSprite(enemyCards[i], true), 
          fromX: deckX,
          fromY: deckY,
          midX: tableX,
          midY: tableY - 60, 
          toX: destX,
          toY: destY,
          delay: delayCounter * CARD_INTERVAL,
          done: false,
        });
        delayCounter++;
      }

      if (i < playerCards.length) {
        const destX = this.calcHandX(i, playerCards.length);
        const destY = this.app.screen.height - 80; 

        this.dealQueue.push({
          sprite: this.buildCardSprite(playerCards[i], false), 
          fromX: deckX,
          fromY: deckY,
          midX: tableX,
          midY: tableY + 60,  
          toX: destX,
          toY: destY,
          delay: delayCounter * CARD_INTERVAL,
          done: false,
        });
        delayCounter++;
      }
    }

    for (const deal of this.dealQueue) {
      deal.sprite.x = deal.fromX;
      deal.sprite.y = deal.fromY;
      this.deckContainer.addChild(deal.sprite);
    }

    this.app.ticker.add(this.tick, this);
  }

  destroy(): void {
    this.app.ticker.remove(this.tick, this);
  }

  private calcHandX(index: number, total: number): number {
    const spacing = CARD_W + 10;
    const totalWidth = (total - 1) * spacing;
    const startX = this.app.screen.width / 2 - totalWidth / 2;
    return startX + index * spacing;
  }

  private buildCardSprite(card: CardData, faceDown: boolean): Sprite {
    const key = faceDown
      ? 'card_back'
      : `${card.rank}_${card.suit}`;

    const sprite = new Sprite(Assets.get(key));
    sprite.anchor.set(0.5);
    sprite.width = CARD_W;
    sprite.height = CARD_H;
    return sprite;
  }

  private tick = (ticker: Ticker): void => {
    const dt = ticker.deltaMS / 1000;
    this.phaseTime += dt;

    let allDone = true;

    for (const deal of this.dealQueue) {
      if (deal.done) continue;

      if (this.phaseTime < deal.delay) {
        allDone = false;
        continue;
      }

      const elapsed = this.phaseTime - deal.delay;
      const t = easeOut(Math.min(elapsed / FLY_DUR, 1));

      deal.sprite.x = bezier(deal.fromX, deal.midX, deal.toX, t);
      deal.sprite.y = bezier(deal.fromY, deal.midY, deal.toY, t);

      deal.sprite.rotation = Math.sin(t * Math.PI) * 0.18;

      if (elapsed >= FLY_DUR) {
        deal.sprite.x = deal.toX;
        deal.sprite.y = deal.toY;
        deal.sprite.rotation = 0;
        deal.done = true;

        this.assignToContainer(deal);
      }

      allDone = false;
    }

    if (allDone) {
      this.phase = 'done';
      this.app.ticker.remove(this.tick, this);
      this.onComplete?.();
    }
  };

  private assignToContainer(deal: DealCard): void {
    const isEnemy = deal.toY < this.app.screen.height / 2;

    if (isEnemy) {
      this.enemyContainer.addChild(deal.sprite);
    } else {
      this.playerContainer.addChild(deal.sprite);
    }
  }
}