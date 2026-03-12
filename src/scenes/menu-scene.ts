import { FederatedPointerEvent, Graphics, Text, TextStyle } from "pixi.js";
import { Scene } from "../impl/scene-impl";
import { Navigator } from '../utils/navigator';
import { GameScene } from "./game-scene";

export class MenuScene extends Scene {
    onStart(): void {
        const w = Navigator.width;
        const h = Navigator.height;

        const bg = new Graphics().rect(0, 0, w, h).fill(0x1a1a2e);
        this.addChild(bg);



        const title = new Text({
            text: 'DURAK',
            style: new TextStyle({
                fontFamily: 'monospace',
                fontSize: 72,
                fontWeight: 'bold',
                fill: 0xffd700,
                dropShadow: { color: 0x000000, blur: 12, distance: 6 },
            }),
        });
        title.anchor.set(0.5);
        title.x = w / 2;
        title.y = h / 2 - 160;
        this.addChild(title);

        const subtitle = new Text({
            text: '♠ Card Game ♥',
            style: new TextStyle({
                fontFamily: 'monospace',
                fontSize: 22,
                fill: 0xaaaacc,
            }),
        });
        subtitle.anchor.set(0.5);
        subtitle.x = w / 2;
        subtitle.y = h / 2 - 90;
        this.addChild(subtitle);

        this.createButton('▶  Play Game', w / 2, h / 2 + 20, 0xffd700, 0x1a1a2e, () => {
            Navigator.switchTo(new GameScene());
        });

        this.createButton('⚙  Settings', w / 2, h / 2 + 100, 0x333355, 0xaaaacc, () => {
        });

        this.createButton('?  How to Play', w / 2, h / 2 + 180, 0x333355, 0xaaaacc, () => {
        });
    }

    private createButton(label: string, x: number, y: number, bgColor: number, textColor: number, onClick: () => void) {
        const btnW = 260;
        const btnH = 52;

        const btn = new Graphics()
            .roundRect(-btnW / 2, -btnH / 2, btnW, btnH, 10)
            .fill(bgColor);
        btn.x = x;
        btn.y = y;
        btn.eventMode = 'static';
        btn.cursor = 'pointer';

        const text = new Text({
            text: label,
            style: new TextStyle({
                fontFamily: 'monospace',
                fontSize: 20,
                fontWeight: 'bold',
                fill: textColor,
            }),
        });
        text.anchor.set(0.5);
        btn.addChild(text);

        btn.on('pointerover', () => btn.alpha = 0.85);
        btn.on('pointerout', () => btn.alpha = 1);
        btn.on('pointerdown', (e: FederatedPointerEvent) => { onClick(); });

        this.addChild(btn);
        return btn;
    }
    onDestroy(): void {
    }
}