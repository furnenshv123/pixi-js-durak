import { Assets, Container, Graphics, Sprite, Text, TextStyle } from 'pixi.js';
import { Scene } from '../impl/scene-impl';
import { Navigator } from '../utils/navigator';
import { ShuffleAnimation } from '../animations/shuffle-animation';
import { CardData, createShuffledDeck, selectRandomTrump } from '../types/cards/cards';
import { TrumpSelectAnimation } from '../animations/trump-select-anim';
import { DistributeAnimation } from '../animations/distribution-anim';
import { GoingFirstScene } from './going-first-scene';
import { TableManager } from '../managers/table-manager';
import { DraggableCard } from '../types/cards/draggable-card';

type TurnPhase =
  | 'player-attack'    
  | 'enemy-defense'    
  | 'enemy-attack'    
  | 'player-defense'  
  | 'round-end';       

export class GameScene extends Scene {
  private shuffle: ShuffleAnimation | null = null;
  private cardLayer!: Container;
  private mainDeck: CardData[] = [];
  private trumpCard: CardData | null = null;
  private trumpSelectAnim: TrumpSelectAnimation | null = null;
  private enemyHandLayer!: Container;
  private playerHandLayer!: Container;
  private tableLayer!: Container;
  private uiLayer!: Container;
  private playerCards: CardData[] = [];
  private enemyCards: CardData[] = [];
  private tableManager: TableManager | null = null;
  private turnPhase: TurnPhase = 'player-attack';
  private draggableCards: DraggableCard[] = [];
  private statusLabel!: Text;
  private btnEndAttack!: Container;
  private btnTakeCards!: Container;
  private btnDoneDefending!: Container;
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
    this.uiLayer = new Container();
    this.addChild(this.uiLayer);

    this.statusLabel = new Text({
      text: '',
      style: new TextStyle({ fontFamily: 'monospace', fontSize: 16, fontWeight: 'bold', fill: 0xffd700 }),
    });
    this.statusLabel.anchor.set(0.5);
    this.statusLabel.x = w / 2;
    this.statusLabel.y = h / 2 + 160;
    this.uiLayer.addChild(this.statusLabel);

    this.btnEndAttack = this.createButton('Done Attacking', w / 2 + 120, h - 50, 0x225522, () => this.onEndAttack());
    this.uiLayer.addChild(this.btnEndAttack);

    this.btnTakeCards = this.createButton('Take Cards', w / 2 + 120, h - 50, 0x882222, () => this.onPlayerTakeCards());
    this.uiLayer.addChild(this.btnTakeCards);

    this.btnDoneDefending = this.createButton('Done Defending', w / 2 + 120, h - 50, 0x225588, () => this.onDoneDefending());
    this.uiLayer.addChild(this.btnDoneDefending);

    this.hideAllButtons();
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
        this.selectFirstGoingPlayer();
      }
    );

    dist.play(this.playerCards, this.enemyCards);
  }
  private selectFirstGoingPlayer(): void {
    Navigator.push(new GoingFirstScene());
    Navigator.once('selectPlayer', (player: 'player' | 'enemy') => {
      Navigator.pop();
      if (player === 'player') {
        this.startPlayerAttackPhase();
      } else {
        this.startEnemyAttackPhase();
      }
    });
  }


  private startPlayerAttackPhase(): void {
    this.turnPhase = 'player-attack';
    this.setupTable();
    this.makeCardsDraggable('attack');
    this.statusLabel.text = 'Your turn — drag cards to attack';
    this.showOnly(this.btnEndAttack);
  }

  private onEndAttack(): void {
    const attacked = this.tableManager!.getSlots().filter(s => s.attackCard !== null).length;
    if (attacked === 0) return; 
    this.hideAllButtons();
    this.disableAllDraggable();
    this.turnPhase = 'enemy-defense';
    this.statusLabel.text = 'Enemy is defending...';

    setTimeout(() => this.simulateEnemyDefense(), 1000);
  }

  private simulateEnemyDefense(): void {
    const canDefend = false; 

    if (canDefend) {
     
      this.statusLabel.text = 'Enemy defended! Round over.';
      setTimeout(() => this.endRound(false), 1200);
    } else {
      this.statusLabel.text = 'Enemy takes the cards!';
      setTimeout(() => this.endRound(true), 1200); 
    }
  }

  private startEnemyAttackPhase(): void {
    this.turnPhase = 'enemy-attack';
    this.setupTable();
    this.statusLabel.text = 'Enemy is attacking...';
    this.hideAllButtons();

    setTimeout(() => {
      this.statusLabel.text = 'Enemy attacked! Defend or take cards.';
      this.turnPhase = 'player-defense';
      this.makeCardsDraggable('defense');
      this.showOnly(this.btnTakeCards);   
      this.uiLayer.addChild(this.btnDoneDefending);
      this.showOnly(this.btnDoneDefending);
      this.btnTakeCards.visible = true;
      this.btnDoneDefending.visible = true;
    }, 1500);
  }

  private onPlayerTakeCards(): void {
    this.hideAllButtons();
    this.disableAllDraggable();
    this.statusLabel.text = 'You took the cards.';
    setTimeout(() => this.endRound(false), 1000);
  }

  private onDoneDefending(): void {
    this.hideAllButtons();
    this.disableAllDraggable();
    this.statusLabel.text = 'Round over!';
    setTimeout(() => this.endRound(false), 1000);
  }

  private endRound(enemyTookCards: boolean): void {
    this.tableManager?.clearTable();
    this.draggableCards = [];
    this.statusLabel.text = 'Next round...';
    setTimeout(() => {
      if (enemyTookCards) {
        this.startPlayerAttackPhase(); 
      } else {
        this.startEnemyAttackPhase(); 
      }
    }, 1200);
  }


  private createButton(label: string, x: number, y: number, color: number, onClick: () => void): Container {
    const btn = new Container();
    btn.x = x;
    btn.y = y;
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    const bg = new Graphics().roundRect(-90, -20, 180, 40, 8).fill(color);
    const text = new Text({
      text: label,
      style: new TextStyle({ fontFamily: 'monospace', fontSize: 15, fontWeight: 'bold', fill: 0xffffff }),
    });
    text.anchor.set(0.5);

    btn.addChild(bg, text);
    btn.on('pointerover', () => (btn.alpha = 0.8));
    btn.on('pointerout', () => (btn.alpha = 1));
    btn.on('pointerdown', onClick);
    return btn;
  }

  private hideAllButtons(): void {
    this.btnEndAttack.visible = false;
    this.btnTakeCards.visible = false;
    this.btnDoneDefending.visible = false;
  }

  private showOnly(btn: Container): void {
    this.hideAllButtons();
    btn.visible = true;
  }

  private disableAllDraggable(): void {
    this.draggableCards.forEach(d => d.disable());
  }
  private async trumpSelect(label: Text): Promise<void> {
    if (!this.trumpCard) return;
    this.trumpSelectAnim = new TrumpSelectAnimation(Navigator.app, this.cardLayer, this.trumpCard, () => {
      this.distributionStart(label);

    });
    this.trumpSelectAnim.play();
  }
  private setupTable(): void {
    const w = Navigator.width;
    const h = Navigator.height;
    this.tableManager = new TableManager(this.tableLayer, 5, w / 2, h / 2, this.trumpCard!.suit);

  }

  private makeCardsDraggable(role: 'attack' | 'defense'): void {
    this.draggableCards = [];
    if (this.turnPhase !== 'player-attack' && this.turnPhase !== 'player-defense') return;
    for (let i = 0; i < this.playerCards.length; i++) {
      const sprite = this.playerHandLayer.children[i] as Sprite;
      if (!sprite) continue;
      const card = this.playerCards[i];
      const drag = new DraggableCard(sprite, card, this.tableManager!, role, () => {
        if (role === 'defense' && this.tableManager?.allDefended()) {
          this.statusLabel.text = 'All attacks defended!';
          this.showOnly(this.btnDoneDefending);
        }
      });
      this.draggableCards.push(drag);
    }
  }

  onDestroy(): void {
    this.shuffle?.destroy();
    this.shuffle = null;
  }
}