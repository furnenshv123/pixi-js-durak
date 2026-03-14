import { Assets, Container, Graphics, Sprite, Text, TextStyle } from 'pixi.js';
import { Scene } from '../impl/scene-impl';
import { Navigator } from '../utils/navigator';
import { ShuffleAnimation } from '../animations/shuffle-animation';
import { CardData, createShuffledDeck, selectRandomTrump } from '../types/cards/cards';
import { TrumpSelectAnimation } from '../animations/trump-select-anim';
import { DistributeAnimation } from '../animations/distribution-anim';
import { GoingFirstScene } from './going-first-scene';

export class GameScene extends Scene {
  private shuffle: ShuffleAnimation | null = null;
  private cardLayer!: Container;
  private mainDeck: CardData[] = [];
  private trumpCard: CardData | null = null;
  private trumpSelectAnim: TrumpSelectAnimation | null = null;
  private enemyHandLayer!: Container;
  private playerHandLayer!: Container;
  private tableLayer!: Container;
  private playerCards: CardData[] = [];
  private enemyCards: CardData[] = [];

  onStart(): void {
    const w = Navigator.width;
    const h = Navigator.height;

    const bg = new Graphics().rect(0, 0, w, h).fill(0x0d3d1f);
    this.addChild(bg);
    this.enemyHandLayer = new Container();
    this.addChild(this.enemyHandLayer);
    this.playerHandLayer = new Container();
    this.addChild(this.playerHandLayer);
    this.cardLayer = new Container();
    this.addChild(this.cardLayer);
    this.tableLayer = new Container();
    this.addChild(this.tableLayer);
    const chifir = new Sprite(Assets.get('/assets/chifir.png'));
    const spichki = new Sprite(Assets.get('/assets/spichki.png'));
    chifir.anchor.set(0.5);
    spichki.anchor.set(0.5);
    chifir.x = w - 200;
    chifir.y = h - 100;
    chifir.scale.set(0.5);
    spichki.x = 300;
    spichki.y = 200;
    spichki.scale.set(0.5);
    this.addChild(chifir, spichki);
    
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
      await this.trumpSelect(label);
      label.text = 'Ready!';

    }, 200, Navigator.height / 2, async () => {
      this.mainDeck = await createShuffledDeck();
    });

  }

  private distributionStart(label: Text): void {
    this.playerCards = this.mainDeck.slice(0, 6);
    this.enemyCards = this.mainDeck.slice(6, 12);
    const dist = new DistributeAnimation(
      Navigator.app,
      this.cardLayer,
      this.playerHandLayer,
      this.enemyHandLayer,
      () => {
        label.text = 'Cards dealt!';
        this.selectFirstGoingPlayer(label);
      }
    );

    dist.play(this.playerCards, this.enemyCards);
  }
  private selectFirstGoingPlayer(label: Text): void {
    Navigator.push(new GoingFirstScene());
    Navigator.once('selectPlayer', (player: 'player' | 'enemy') => {
      label.text = `${player === 'player' ? 'You' : 'Enemy'} goes first!`;
      Navigator.pop();
    });
  }
  private async trumpSelect(label: Text): Promise<void> {
    if (!this.trumpCard) return;
    this.trumpSelectAnim = new TrumpSelectAnimation(Navigator.app, this.cardLayer, this.trumpCard, () => {
      this.distributionStart(label);

    });
    this.trumpSelectAnim.play();
  }
  onDestroy(): void {
    this.shuffle?.destroy();
    this.shuffle = null;
  }
}