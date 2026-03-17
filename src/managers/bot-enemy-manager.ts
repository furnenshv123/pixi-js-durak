import { CardData } from "../types/cards/cards";
import { TableManager } from "./table-manager";

export class BotEnemyManager {
    private enemyCards: CardData[] = [];
    private tableManager: TableManager;

    constructor(tableManager: TableManager, enemyCards: CardData[]) {
        this.tableManager = tableManager;
        this.enemyCards = enemyCards;
    }
    analyzePlayerAttcak() { }
    analyzeTable() { }
    endAttack() { }
    takeCards() { }
    doneDefending() {
    }
    saveCardsTurns() { }
}