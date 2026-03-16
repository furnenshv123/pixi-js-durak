import { Container, Graphics, Sprite } from 'pixi.js';
import { canBeat, CardData, Suit } from '../types/cards/cards';

const SLOT_W = 90;
const SLOT_H = 126;
const SLOT_GAP = 20;
export interface TableSlot {
  id: number;
  x: number;
  y: number;
  attackCard: CardData | null;
  defenseCard: CardData | null;
  sprite: Sprite | null;
  defSprite: Sprite | null;
}

export interface TableConfig {
  maxSlots: number;
  slots: TableSlot[];
}
export class TableManager {
  private config: TableConfig;
  private container: Container;
  private slotGraphics: Graphics[] = [];
  private trumpSuit: Suit;
  constructor(container: Container, maxSlots: number, centerX: number, centerY: number, trumpSuit: Suit) {
    this.container = container;
    this.config = {
      maxSlots,
      slots: [],
    };
    this.trumpSuit = trumpSuit;
    this.buildSlots(maxSlots, centerX, centerY);
  }


  private buildSlots(count: number, cx: number, cy: number): void {
    const totalW = count * SLOT_W + (count - 1) * SLOT_GAP;
    const startX = cx - totalW / 2 + SLOT_W / 2;

    for (let i = 0; i < count; i++) {
      const x = startX + i * (SLOT_W + SLOT_GAP);
      const y = cy;

      const outline = new Graphics()
        .roundRect(-SLOT_W / 2, -SLOT_H / 2, SLOT_W, SLOT_H, 8)
        .stroke({ color: 0xffffff, width: 1, alpha: 0.2 });
      outline.x = x;
      outline.y = y;
      this.container.addChild(outline);
      this.slotGraphics.push(outline);

      this.config.slots.push({
        id: i,
        x,
        y,
        attackCard: null,
        defenseCard: null,
        sprite: null,
        defSprite: null,
      });
    }
  }


  findNearestSlot(x: number, y: number, role: 'attack' | 'defense'): TableSlot | null {
    let nearest: TableSlot | null = null;
    let minDist = 80;

    for (const slot of this.config.slots) {
      if (role === 'attack' && slot.attackCard !== null) continue;

      if (role === 'defense' && (slot.attackCard === null || slot.defenseCard !== null)) continue;

      const dist = Math.hypot(slot.x - x, slot.y - y);
      if (dist < minDist) {
        minDist = dist;
        nearest = slot;
      }
    }

    return nearest;
  }


  placeCard(slot: TableSlot, card: CardData, sprite: Sprite, role: 'attack' | 'defense'): void {
    if (role === 'attack') {
      slot.attackCard = card;
      slot.sprite = sprite;
      sprite.x = slot.x;
      sprite.y = slot.y;
    } else {
      slot.defenseCard = card;
      slot.defSprite = sprite;
      sprite.x = slot.x + 12;
      sprite.y = slot.y + 12;
    }
    this.container.addChild(sprite);
  }


  canAttack(): boolean {
    return this.config.slots.some(s => s.attackCard !== null);
  }
  canPutAttackCard(card: CardData): boolean {
    const activeSlots = this.config.slots.filter(s => s.attackCard === null);
    console.log(activeSlots.length)
    return (activeSlots.length > 0 && this.config.slots.some(s => s.attackCard !== null && (s.attackCard.rank === card.rank))) || activeSlots.length === this.config.maxSlots;
  }
  canPutDefenseCard(defenseCard: CardData, attackCard: CardData): boolean{
    return canBeat(attackCard, defenseCard, this.trumpSuit);
  }
  allDefended(): boolean {
    return this.config.slots
      .filter(s => s.attackCard !== null)
      .every(s => s.defenseCard !== null);
  }

  updateMaxSlots(max: number): void {
    this.config.maxSlots = max;
  }

  getSlots(): TableSlot[] {
    return this.config.slots;
  }

  clearTable(): void {
    for (const slot of this.config.slots) {
      slot.attackCard = null;
      slot.defenseCard = null;
      slot.sprite?.destroy();
      slot.defSprite?.destroy();
      slot.sprite = null;
      slot.defSprite = null;
    }
  }
}