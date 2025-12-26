import { GameState, Player, Card } from './src/app/models/game.models';
// Simplified interface for testing
interface TestState {
    players: Player[];
    centerStack: Card[][];
    currentPlayerId: string;
    phase: string;
}

// Mock dependencies
const mockPlayers: Player[] = [
    { id: '1', name: 'P1', isHost: true, handCount: 5, score: 0 },
    { id: '2', name: 'P2', isHost: false, handCount: 2, score: 0 }, // P2 has 2 cards
    { id: '3', name: 'P3', isHost: false, handCount: 5, score: 0 }
];

let state: TestState = {
    players: JSON.parse(JSON.stringify(mockPlayers)),
    centerStack: [[{ id: 'prev1', value: 5, color: 'Blue' } as Card]], // Stack has cards
    currentPlayerId: '2',
    phase: 'PLAYING'
};

function endRound() {
    console.log('--- endRound() CALLED ---');
    state.phase = 'ROUND_END';
}

function handlePlayAction(playerId: string, cards: Card[], pickUpCardId?: string) {
    console.log(`Player ${playerId} playing ${cards.length} cards...`);

    const currentHandCount = state.players.find(p => p.id === playerId)?.handCount || 0;
    const newHandCount = currentHandCount - cards.length;

    console.log(`Current Hand: ${currentHandCount}. New Hand (predicted): ${newHandCount}`);

    // --- ROUND END CHECK ---
    // If this play empties the hand, the round ends immediately.
    if (newHandCount === 0) {
        console.log('Hand invalidation check passed (Empty Hand). Round should end.');
        const players = state.players.map(p => {
            if (p.id === playerId) {
                return { ...p, handCount: 0 };
            }
            return p;
        });

        // Update state
        state.players = players;
        state.centerStack = [...state.centerStack, cards];

        endRound();
        return;
    }

    // --- PICK UP LOGIC ---
    let topCards = state.centerStack[state.centerStack.length - 1];
    let cardToPickUp: Card | null = null;

    if (topCards.length > 0) {
        if (!pickUpCardId) {
            console.error('FAILURE: Pick up required but not provided!');
            return;
        }
        cardToPickUp = topCards.find(c => c.id === pickUpCardId) || null;
    }

    // Update players
    const players = state.players.map(p => {
        if (p.id === playerId) {
            let newCount = p.handCount - cards.length;
            if (cardToPickUp) newCount++;
            return { ...p, handCount: newCount };
        }
        return p;
    });
    state.players = players;
    state.centerStack = [...state.centerStack, cards];
    console.log('Normal play executed. Round continues.');
}

async function runTest() {
    console.log('=== STARTING TEST: END ROUND LOGIC ===');

    // Scenario: P2 plays 2 cards. P2 starts with 2 cards.
    // Stack is NOT empty.
    // Expected: Round ends immediately. No pickup required.

    const cardsToPlay: Card[] = [
        { id: 'c1', value: 6, color: 'Red' } as Card,
        { id: 'c2', value: 6, color: 'Red' } as Card
    ];

    handlePlayAction('2', cardsToPlay); // No pickup ID provided!

    console.log('=== VERIFICATION ===');
    if (state.phase === 'ROUND_END') {
        console.log('SUCCESS: Round ended correctly.');
    } else {
        console.error('FAILURE: Round did not end. Phase:', state.phase);
    }

    const p2 = state.players.find(p => p.id === '2');
    if (p2 && p2.handCount === 0) {
        console.log('SUCCESS: P2 hand count is 0.');
    } else {
        console.error('FAILURE: P2 hand count incorrect:', p2?.handCount);
    }
}

runTest();
