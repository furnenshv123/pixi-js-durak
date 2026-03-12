import { Application, Container, Ticker } from "pixi.js";


function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

function easeOut(t: number): number {
    return 1 - Math.pow(1 - t, 3);
}

function easeInOut(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

type Phase = 'defender' | 'attacker' | 'idle'

const SLIDE_OUT_DUR = 0.5;
const ROTATE_DUR = 0.6;


export class DistributionAnimation {
    private container: Container;
    private app: Application;


    private phase: Phase = 'idle';
    private phaseTime = 0;

    private fromX = 0;
    private fromY = 0;
    private fromRot = 0;
    private toX = 0;
    private toY = 0;
    private toRot = 0;


    constructor(app: Application, container: Container) {
        this.app = app;
        this.container = container;
    }
    play(): void {

    }
    destroy(): void {

    }


     private tick = (ticker: Ticker): void => {
            const dt = ticker.deltaMS / 1000;
    
            if (this.phase === 'defender') {
                this.phaseTime += dt;
                const t = easeInOut(Math.min(this.phaseTime / SLIDE_OUT_DUR, 1));
                s.x = lerp(this.fromX, this.toX, t);
                s.y = lerp(this.fromY, this.toY, t);
    
                if (this.phaseTime >= SLIDE_OUT_DUR) this.beginRotate();
    
            } else if (this.phase === 'attacker') {
                this.phaseTime += dt;
                const t = easeInOut(Math.min(this.phaseTime / ROTATE_DUR, 1));
                s.rotation = lerp(this.fromRot, this.toRot, t);
    
    
            } 
        };
}