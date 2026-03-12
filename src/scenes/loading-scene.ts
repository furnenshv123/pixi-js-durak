import { Assets, Graphics, Text, TextStyle } from 'pixi.js';
import { Navigator } from '../utils/navigator';
import { CARD_ASSETS } from '../types/cards/cards';
import { Scene } from '../impl/scene-impl';

export class LoadingScene extends Scene {
  private bar!: Graphics;
  private barBg!: Graphics;
  private onComplete: () => void;

  constructor(onComplete: () => void) {
    super();
    this.onComplete = onComplete;
  }

  onStart() {
    const w = Navigator.width;
    const h = Navigator.height;

    const bg = new Graphics().rect(0, 0, w, h).fill(0x1a1a2e);
    this.addChild(bg);

    const title = new Text({
      text: 'DURAK',
      style: new TextStyle({
        fontFamily: 'monospace',
        fontSize: 52,
        fontWeight: 'bold',
        fill: 0xffd700,
        dropShadow: {
          color: 0x000000,
          blur: 8,
          distance: 4,
        },
      }),
    });
    title.anchor.set(0.5);
    title.x = w / 2;
    title.y = h / 2 - 100;
    this.addChild(title);

    const barW = 400;
    const barH = 24;
    this.barBg = new Graphics()
      .roundRect(w / 2 - barW / 2, h / 2 - barH / 2, barW, barH, 6)
      .fill(0x333355);
    this.addChild(this.barBg);

    this.bar = new Graphics();
    this.addChild(this.bar);
    this.loadAssets(barW, barH);
  }

  private async loadAssets(barW: number, barH: number) {
    const w = Navigator.width;
    const h = Navigator.height;

    await Assets.load(CARD_ASSETS, (progress) => {
      const pct = Math.round(progress * 100);

      this.bar.clear();
      this.bar
        .roundRect(
          w / 2 - barW / 2,
          h / 2 - barH / 2,
          barW * progress,
          barH,
          6
        )
        .fill(0xffd700);
    });

    this.onComplete();
  }

  onDestroy() {}
}