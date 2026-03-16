import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Scene } from '../impl/scene-impl';
import { Navigator } from '../utils/navigator';
import { RouletteAnimation } from '../animations/roulette-animation';

export class GoingFirstScene extends Scene {
    private roulette: RouletteAnimation | null = null;
    private container!: Container;
    onStart(): void {
        const w = Navigator.width;
        const h = Navigator.height;
        this.container = new Container();
        this.addChild(this.container);
        const overlay = new Graphics()
            .rect(0, 0, w, h)
            .fill({ color: 0x000000, alpha: 0});
        this.addChild(overlay);



        const title = new Text({
            text: 'Who goes first?',
            style: new TextStyle({
                fontFamily: 'monospace',
                fontSize: 24,
                fontWeight: 'bold',
                fill: 0xffd700,
            }),
        });
        title.anchor.set(0.5);
        title.x = w / 2;
        title.y = h / 2 - 70;
        this.container.addChild(title);
        
        this.createButton('👤 You', w / 2, h / 2, 0x2255aa, 0xffffff, () => {
            Navigator.emit('selectPlayer', 'player');
            this.container.removeChildren();
        });

        this.createButton('🤖 Enemy', w / 2, h / 2 + 70, 0xaa2222, 0xffffff, () => {
            Navigator.emit('selectPlayer', 'enemy');
            this.container.removeChildren();
        });
        this.createButton('🎲 Random', w / 2, h / 2 + 140, 0x228822, 0xffffff, () => {
            this.container.removeChildren();
            this.roulette = new RouletteAnimation(Navigator.app, this, async (result) => {
                Navigator.emit('selectPlayer', result);
                this.onDestroy();
            });
            this.roulette.spin();
        });
    }

    private createButton(
        label: string,
        x: number,
        y: number,
        bgColor: number,
        textColor: number,
        onClick: () => void
    ): void {
        const btnW = 220;
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

        btn.on('pointerover', () => (btn.alpha = 0.85));
        btn.on('pointerout', () => (btn.alpha = 1));
        btn.on('pointerdown', onClick);
        this.container.addChild(btn);
    }

    onDestroy(): void {
        this.roulette?.destroy();

    }
}