import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Scene } from '../impl/scene-impl';
import { Navigator } from '../utils/navigator';
import { ShuffleAnimation } from '../animations/shuffle-animation';
import { CardData, createShuffledDeck, selectRandomTrump } from '../types/cards/cards';
import { TrumpSelectAnimation } from '../animations/trump-select-anim';

export class GameScene extends Scene {
  private shuffle: ShuffleAnimation | null = null;
  private cardLayer!: Container;
  private mainDeck: CardData[] = [];
  private trumpCard: CardData | null = null;
  private truumpSelectAnim: TrumpSelectAnimation | null = null;
  onStart(): void {
    const w = Navigator.width;
    const h = Navigator.height;

    const bg = new Graphics().rect(0, 0, w, h).fill(0x0d3d1f);
    this.addChild(bg);

    this.cardLayer = new Container();
    this.addChild(this.cardLayer);

    const label = new Text({
      text: 'Shuffling deck…',
      style: new TextStyle({
        fontFamily: 'monospace',
        fontSize: 18,
        fill: 0xaaccaa,
      }),
    });
    label.anchor.set(0.5);
    label.x = w / 2;
    label.y = h / 2 + 100;
    this.addChild(label);

    this.shuffle = new ShuffleAnimation(Navigator.app, this.cardLayer);
    this.shuffle.play(async () => {
      label.text = 'Selecting trump';
      this.trumpCard = await selectRandomTrump(this.mainDeck);
      this.trumpSelect();
      label.text = 'Ready!';
    }, 200, Navigator.height / 2, async () => {
      this.mainDeck = await createShuffledDeck();
    });

  }
  private trumpSelect(): void {
    if (!this.trumpCard) return;
    this.truumpSelectAnim = new TrumpSelectAnimation(Navigator.app, this.cardLayer, this.trumpCard, () => {
    });
    this.truumpSelectAnim.play();
  }
  onDestroy(): void {
    this.shuffle?.destroy();
    this.shuffle = null;
  }
}