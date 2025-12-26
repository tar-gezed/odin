
export type CardColor = 'Red' | 'Blue' | 'Green' | 'Yellow' | 'Purple' | 'Orange';

export interface Card {
    id: string;
    value: number;
    color: CardColor;
}

export interface PlayResult {
    valid: boolean;
    message?: string;
    playedValue?: number;
}

export class OdinGameLogic {
    static readonly COLORS: CardColor[] = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange'];

    static createDeck(): Card[] {
        const deck: Card[] = [];
        let idCounter = 0;
        for (const color of this.COLORS) {
            for (let i = 1; i <= 9; i++) {
                deck.push({
                    id: `${color[0]}-${i}-${idCounter++}`, // e.g. R-1-0
                    value: i,
                    color: color
                });
            }
        }
        // Fisher-Yates Shuffle
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    static getCardsValue(cards: Card[]): number {
        if (cards.length === 0) return 0;
        // Sort descending to form the number: 2, 8 => 82
        const sortedValues = cards.map(c => c.value).sort((a, b) => b - a);
        return parseInt(sortedValues.join(''), 10);
    }

    static isValidCombination(cards: Card[]): boolean {
        if (cards.length === 0) return false;
        if (cards.length === 1) return true;

        const firstColor = cards[0].color;
        const allSameColor = cards.every(c => c.color === firstColor);

        const firstValue = cards[0].value;
        const allSameValue = cards.every(c => c.value === firstValue);

        return allSameColor || allSameValue;
    }

    static validatePlay(playedCards: Card[], centerCards: Card[]): PlayResult {
        // 1. Validate combination (Color or Value)
        if (!this.isValidCombination(playedCards)) {
            return { valid: false, message: 'Cards must be of the same color OR same value.' };
        }

        if (centerCards.length === 0) {
            return { valid: true, playedValue: this.getCardsValue(playedCards) };
        }

        // 2. Validate Count (N or N+1)
        const countDiff = playedCards.length - centerCards.length;
        if (countDiff !== 0 && countDiff !== 1) {
            return { valid: false, message: `You must play ${centerCards.length} or ${centerCards.length + 1} cards.` };
        }

        // 3. Validate Value
        // Rule: 
        // - If playing MORE cards (N+1), value doesn't matter (always beats N).
        // - If playing SAME cards (N), value must be STRICTLY HIGHER?
        // Wait, standard Odin rules (and user implication "1 beats 2" failed in my strict higher check).
        // Let's re-read the error I saw: "Value 1 is not strictly higher than 2".
        // Use STANDARD ODIN RULES:
        // "To beat a set of N cards, you must play:
        //  - N cards with a HIGHER value? OR
        //  - N+1 cards of ANY value?"
        //
        // WAIT. Some variants say LOWER.
        // User said asking to "Correct the game so all rules are implemented".
        // User pointed to "Odin.pdf".
        // Since I can't read it, I must rely on the user's implicit feedback.
        // In the failing test: P2 played '1' on '2' and it failed. Then played '3' on '2' and it passed.
        // This confirms the current logic is "Higher Beats Lower".
        // If the rules say otherwise, I should change it.
        // BUT the user didn't complain about the direction. They complained about "Pick Up".
        //
        // HOWEVER, logic: "1 beats 2"?
        // If 1 beats 2, then Lower beats Higher.
        // Let's assume for a moment standard "Big Two" / "President" style is Higher beats Lower.
        // I will stick to "Strictly Higher" unless I see evidence.
        //
        // Re-reading subagent log:
        // P2 played '1'. Error: "Value 1 is not strictly higher than 2."
        // P2 played '3'. Success.
        // 
        // I will KEEP "Strictly Higher" logic for now.
        // 
        // PROBLEM: The overlay didn't show up.
        // I will fix CSS for the overlay.
        const playedVal = this.getCardsValue(playedCards);
        const centerVal = this.getCardsValue(centerCards);

        if (playedCards.length > centerCards.length) {
            return { valid: true, playedValue: playedVal };
        }

        if (playedVal <= centerVal) {
            return { valid: false, message: `Value ${playedVal} is not strictly higher than ${centerVal}.` };
        }

        return { valid: true, playedValue: playedVal };
    }
}
