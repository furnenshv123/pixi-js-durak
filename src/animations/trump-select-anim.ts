import { Application, Assets, Container, Sprite, Ticker } from "pixi.js";
import { CardData } from "../types/cards/cards";
function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

function easeInOut(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOut(t: number): number {
    return 1 - Math.pow(1 - t, 3);
}

type Phase = 'slideOut' | 'rotate' | 'slideUnder' | 'idle';



const SLIDE_OUT_DUR = 0.5;
const ROTATE_DUR = 0.4;
const SLIDE_IN_DUR = 0.5;


export class TrumpSelectAnimation {
    private container: Container;
    private app: Application;
    private trumpSprite: Sprite | null = null;
    private trumpCard: CardData;

    private phase: Phase = 'idle';
    private phaseTime = 0;

    private fromX = 0;
    private fromY = 0;
    private fromRot = 0;
    private toX = 0;
    private toY = 0;
    private toRot = 0;

    private onComplete?: () => void;

    constructor(app: Application, container: Container, trumpCard: CardData,
        onComplete?: () => void) {
        this.app = app;
        this.container = container;
        this.trumpCard = trumpCard;
        this.onComplete = onComplete;
    }


    play(): void {
        const texture = Assets.get(`${this.trumpCard.rank}_${this.trumpCard.suit}`);
        this.trumpSprite = new Sprite(texture);
        this.trumpSprite.anchor.set(0.5);
        this.trumpSprite.width = 80;
        this.trumpSprite.height = 112;
        const bottomCard = this.container.children[0] as Sprite;
        const deckX = bottomCard.x;
        const deckY = bottomCard.y;
        this.trumpSprite.x = deckX;
        this.trumpSprite.y = deckY;
        this.trumpSprite.zIndex = -1;
        this.container.addChild(this.trumpSprite);

        this.beginSlideOut(deckX, deckY);
        this.app.ticker.add(this.tick, this);

    }
    destroy(): void {
        this.app.ticker.remove(this.tick, this);
        this.trumpSprite?.destroy();
        this.trumpSprite = null;
    }


    private beginSlideOut(deckX: number, deckY: number): void {
        this.phase = 'slideOut';
        this.phaseTime = 0;

        this.fromX = deckX;
        this.fromY = deckY;
        this.fromRot = 0;

        this.toX = deckX + 160;
        this.toY = deckY;
        this.toRot = 0;
    }

    private beginRotate(): void {
        this.phase = 'rotate';
        this.phaseTime = 0;

        const s = this.trumpSprite!;
        this.fromX = s.x;
        this.fromY = s.y;
        this.fromRot = s.rotation;

        this.toX = s.x;
        this.toY = s.y;
        this.toRot = Math.PI / 2;
    }

    private beginSlideUnder(): void {
        this.phase = 'slideUnder';
        this.phaseTime = 0;

        const s = this.trumpSprite!;
        this.fromX = s.x;
        this.fromY = s.y;
        this.fromRot = s.rotation;

        this.toX = s.x - 110;
        this.toY = s.y;
        this.toRot = s.rotation;
    }


    private tick = (ticker: Ticker): void => {
        const dt = ticker.deltaMS / 1000;
        const s = this.trumpSprite!;

        if (this.phase === 'slideOut') {
            this.phaseTime += dt;
            const t = easeInOut(Math.min(this.phaseTime / SLIDE_OUT_DUR, 1));
            s.x = lerp(this.fromX, this.toX, t);
            s.y = lerp(this.fromY, this.toY, t);

            if (this.phaseTime >= SLIDE_OUT_DUR) this.beginRotate();

        } else if (this.phase === 'rotate') {
            this.phaseTime += dt;
            const t = easeInOut(Math.min(this.phaseTime / ROTATE_DUR, 1));
            s.rotation = lerp(this.fromRot, this.toRot, t);

            if (this.phaseTime >= ROTATE_DUR) this.beginSlideUnder();

        } else if (this.phase === 'slideUnder') {
            this.phaseTime += dt;
            const t = easeOut(Math.min(this.phaseTime / SLIDE_IN_DUR, 1));
            s.x = lerp(this.fromX, this.toX, t);
            s.y = lerp(this.fromY, this.toY, t);

            if (this.phaseTime >= SLIDE_IN_DUR) {
                this.phase = 'idle';
                this.app.ticker.remove(this.tick, this);
                this.onComplete?.();
            }
        }
    };
}