import { Sprite, Container, FederatedPointerEvent } from 'pixi.js';
import { CardData } from './cards';
import { TableManager } from '../../managers/table-manager';


export class DraggableCard {
  sprite: Sprite;
  card: CardData;

  private dragging = false;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private originX = 0;
  private originY = 0;
  private tableManager: TableManager;
  private role: 'attack' | 'defense';

  private onPlaced?: (card: CardData, sprite: Sprite) => void;

  constructor(
    sprite: Sprite,
    card: CardData,
    tableManager: TableManager,
    role: 'attack' | 'defense',
    onPlaced?: (card: CardData, sprite: Sprite) => void
  ) {
    this.sprite = sprite;
    this.card = card;
    this.tableManager = tableManager;
    this.role = role;
    this.onPlaced = onPlaced;

    this.originX = sprite.x;
    this.originY = sprite.y;

    this.enable();
  }

  enable(): void {
    this.sprite.eventMode = 'static';
    this.sprite.cursor = 'grab';

    this.sprite.on('pointerdown', this.onDragStart, this);
    this.sprite.on('pointermove', this.onDragMove, this);
    this.sprite.on('pointerup', this.onDragEnd, this);
    this.sprite.on('pointerupoutside', this.onDragEnd, this);
  }

  disable(): void {
    this.sprite.eventMode = 'none';
    this.sprite.cursor = 'default';
    this.sprite.removeAllListeners();
  }


  private onDragStart = (e: FederatedPointerEvent): void => {
    this.dragging = true;
    this.sprite.cursor = 'grabbing';
    this.sprite.alpha = 0.85;
    this.sprite.zIndex = 999;

    const pos = e.getLocalPosition(this.sprite.parent!);
    this.dragOffsetX = pos.x - this.sprite.x;
    this.dragOffsetY = pos.y - this.sprite.y;
  };

  private onDragMove = (e: FederatedPointerEvent): void => {
    if (!this.dragging) return;

    const pos = e.getLocalPosition(this.sprite.parent!);
    this.sprite.x = pos.x - this.dragOffsetX;
    this.sprite.y = pos.y - this.dragOffsetY;
  };

  private onDragEnd = (e: FederatedPointerEvent): void => {
    if (!this.dragging) return;
    this.dragging = false;
    this.sprite.cursor = 'grab';
    this.sprite.alpha = 1;

    const pos = e.getLocalPosition(this.sprite.parent!);

    const slot = this.tableManager.findNearestSlot(pos.x, pos.y, this.role);
    const canPutCard = slot && (this.role === 'attack' ? this.tableManager.canPutAttackCard(this.card) : this.tableManager.canPutDefenseCard(this.card, slot.attackCard!));
    if (canPutCard) {
      this.tableManager.placeCard(slot, this.card, this.sprite, this.role);
      this.disable();
      this.onPlaced?.(this.card, this.sprite);
    } else {
      this.sprite.x = this.originX;
      this.sprite.y = this.originY;
      this.sprite.zIndex = 0;
    }
  };
}