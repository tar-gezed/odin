
export type CardColor = 'Red' | 'Blue' | 'Green' | 'Yellow' | 'Purple' | 'Orange';

export interface Card {
    id: string;
    value: number;
    color: CardColor;
}

export interface PlayResult {
    valid: boolean;
    message?: string;
    messageKey?: string;
    messageParams?: any;
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

    static validatePlay(playedCards: Card[], centerCards: Card[], playerHandCount?: number): PlayResult {
        // 1. Validate combination (Color or Value)
        if (!this.isValidCombination(playedCards)) {
            return {
                valid: false,
                message: 'Cards must be of the same color OR same value.',
                messageKey: 'ERRORS.SAME_COLOR_OR_VALUE'
            };
        }

        if (centerCards.length === 0) {
            // Rule: First turn (or clearing set) -> Only 1 card OR entire hand
            if (playerHandCount !== undefined) {
                if (playedCards.length > 1 && playedCards.length !== playerHandCount) {
                    return {
                        valid: false,
                        message: 'You can only play 1 card to start (or your whole hand)!',
                        messageKey: 'ERRORS.FIRST_TURN_RULE'
                    };
                }
            }
            return { valid: true, playedValue: this.getCardsValue(playedCards) };
        }

        // 2. Validate Count (N or N+1)
        const countDiff = playedCards.length - centerCards.length;
        if (countDiff !== 0 && countDiff !== 1) {
            return {
                valid: false,
                message: `You must play ${centerCards.length} or ${centerCards.length + 1} cards.`,
                messageKey: 'ERRORS.MUST_PLAY_COUNT',
                messageParams: { count1: centerCards.length, count2: centerCards.length + 1 }
            };
        }

        // 3. Validate Value
        const playedVal = this.getCardsValue(playedCards);
        const centerVal = this.getCardsValue(centerCards);

        if (playedCards.length > centerCards.length) {
            return { valid: true, playedValue: playedVal };
        }

        if (playedVal <= centerVal) {
            return {
                valid: false,
                message: `Value ${playedVal} is not strictly higher than ${centerVal}.`,
                messageKey: 'ERRORS.VALUE_NOT_HIGHER',
                messageParams: { played: playedVal, center: centerVal }
            };
        }

        return { valid: true, playedValue: playedVal };
    }
}
