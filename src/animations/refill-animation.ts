import { Application, Assets, Container, Sprite, Ticker } from 'pixi.js';
import { CardData } from '../types/cards/cards';

const CARD_W = 80;
const CARD_H = 112;
const FLY_DUR = 0.32;
const CARD_INTERVAL = 0.12;

function easeOut(t: number): number {
    return 1 - Math.pow(1 - t, 3);
}

function bezier(p0: number, p1: number, p2: number, t: number): number {
    return (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2;
}

interface RefillCard {
    sprite: Sprite;
    fromX: number;
    fromY: number;
    midX: number;
    midY: number;
    toX: number;
    toY: number;
    delay: number;
    handContainer: Container;
    done: boolean;
}

export interface RefillHandConfig {
    newCards: CardData[];
    existingCount: number;
    handContainer: Container;
    isEnemy: boolean;
}

export class RefillAnimation {
    private app: Application;
    private deckContainer: Container;

    private queue: RefillCard[] = [];
    private phaseTime = 0;
    private onComplete?: () => void;

    private firstConfig: RefillHandConfig | null = null;
    private secondConfig: RefillHandConfig | null = null;
    private currentPhase: 1 | 2 = 1;

    constructor(app: Application, deckContainer: Container) {
        this.app = app;
        this.deckContainer = deckContainer;
    }


    play(
        first: RefillHandConfig,
        second: RefillHandConfig | null,
        onComplete?: () => void,
    ): void {
        this.onComplete = onComplete;
        this.firstConfig = first;
        this.secondConfig = second;
        this.currentPhase = 1;

        this.startPhase(first, () => {
            if (second && second.newCards.length > 0) {
                this.currentPhase = 2;
                this.startPhase(second, () => {
                    this.onComplete?.();
                });
            } else {
                this.onComplete?.();
            }
        });
    }

    destroy(): void {
        this.app.ticker.remove(this.tick, this);
    }


    private startPhase(config: RefillHandConfig, phaseComplete: () => void): void {
        if (config.newCards.length === 0) {
            phaseComplete();
            return;
        }

        this.queue = [];
        this.phaseTime = 0;

        const topCard = this.deckContainer.children[this.deckContainer.children.length - 1] as Sprite;
        if (!topCard) {
            phaseComplete();
            return;
        }

        const deckX = topCard.x;
        const deckY = topCard.y;

        const screenW = this.app.screen.width;
        const screenH = this.app.screen.height;
        const spacing = CARD_W + 10;
        const totalAfter = config.existingCount + config.newCards.length;
        const totalWidth = (totalAfter - 1) * spacing;
        const startX = screenW / 2 - totalWidth / 2;

        const destY = config.isEnemy ? 80 : screenH - 80;
        const midY = config.isEnemy ? screenH * 0.35 : screenH * 0.65;
        const midX = screenW / 2;

        for (let i = 0; i < config.newCards.length; i++) {
            const handIndex = config.existingCount + i;
            const destX = startX + handIndex * spacing;

            const key = config.isEnemy
                ? 'card_back'
                : `${config.newCards[i].rank}_${config.newCards[i].suit}`;

            const sprite = new Sprite(Assets.get(key));
            sprite.anchor.set(0.5);
            sprite.width = CARD_W;
            sprite.height = CARD_H;
            sprite.x = deckX;
            sprite.y = deckY;
            this.deckContainer.addChild(sprite);

            this.queue.push({
                sprite,
                fromX: deckX,
                fromY: deckY,
                midX,
                midY,
                toX: destX,
                toY: destY,
                delay: i * CARD_INTERVAL,
                handContainer: config.handContainer,
                done: false,
            });
        }

        const onBatchDone = phaseComplete;
        this.app.ticker.remove(this.tick, this);
        this._batchComplete = onBatchDone;
        this.app.ticker.add(this.tick, this);
    }

    private _batchComplete: (() => void) | null = null;

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
            item.sprite.rotation = Math.sin(t * Math.PI) * 0.15;

            if (elapsed >= FLY_DUR) {
                item.sprite.x = item.toX;
                item.sprite.y = item.toY;
                item.sprite.rotation = 0;
                item.done = true;
                item.handContainer.addChild(item.sprite); 
            }

            allDone = false;
        }

        if (allDone) {
            this.app.ticker.remove(this.tick, this);
            const cb = this._batchComplete;
            this._batchComplete = null;
            cb?.();
        }
    };
}
