import { canBeat, CardData, Suit } from "../types/cards/cards";
import { TableManager } from "./table-manager";

export class BotEnemyManager {
    private trumpSuit!: Suit;
    private deckRemaining!: number;
    private knownPlayerCards!: CardData[];
    private tableManager!: TableManager;
    constructor(tableManager: TableManager, trumpSuit: Suit, deckRemaining: number, knownPlayerCards: CardData[]) {
        this.tableManager = tableManager;
        this.trumpSuit = trumpSuit;
        this.deckRemaining = deckRemaining;
        this.knownPlayerCards = knownPlayerCards;
    }

    analyzePlayerAttack(attackCards: CardData[], enemyCards: CardData[]): Map<string, CardData | null> {
        const result = new Map<string, CardData | null>();
        const available = [...enemyCards];

        for (const attack of attackCards) {
            const defense = this.chooseBestDefense(attack, available);
            result.set(attack.id, defense);
            if (defense) {
                const idx = available.indexOf(defense);
                if (idx !== -1) available.splice(idx, 1);
            }
        }

        return result;
    }


    private chooseBestDefense(attackCard: CardData, available: CardData[]): CardData | null {
        const sameSuit = available
            .filter(c => c.suit === attackCard.suit && canBeat(attackCard, c, this.trumpSuit))
            .sort((a, b) => a.value - b.value);
        if (sameSuit.length > 0) return sameSuit[0];

        if (attackCard.suit !== this.trumpSuit) {
            const trumps = available
                .filter(c => c.suit === this.trumpSuit)
                .sort((a, b) => a.value - b.value);
            if (trumps.length > 0) return trumps[0];
        }

        return null;
    }
    analyzeTable() { }
    endAttack() { }
    takeCards() { }
    doneDefending() {
    }
    saveCardsTurns() { }
}