import { GameState, Player, Card } from './src/app/models/game.models';

// Mock dependencies
const mockPlayers: Player[] = [
    { id: '1', name: 'P1', isHost: true, handCount: 5, score: 0 },
    { id: '2', name: 'P2', isHost: false, handCount: 5, score: 0 },
    { id: '3', name: 'P3', isHost: false, handCount: 5, score: 0 }
];

let state: GameState = {
    roomCode: '1234',
    hostId: '1',
    phase: 'PLAYING',
    players: mockPlayers,
    currentPlayerId: '3', // Start with P3 as per scenario
    centerStack: [],
    deckSize: 10,
    consecutivePasses: 0
};

function updateState(newState: Partial<GameState>) {
    state = { ...state, ...newState };
    console.log('State Updated:', {
        currentPlayer: state.currentPlayerId,
        consecutivePasses: state.consecutivePasses,
        stackSize: state.centerStack.length
    });
}

function getNextPlayerId(currentId: string, players: Player[]): string {
    const idx = players.findIndex(p => p.id === currentId);
    const nextIdx = (idx + 1) % players.length;
    return players[nextIdx].id;
}

// Logic from handlePassAction
function handlePassAction(playerId: string) {
    if (state.currentPlayerId !== playerId) {
        console.error(`Wrong player tried to pass. Current: ${state.currentPlayerId}, Tried: ${playerId}`);
        return;
    }

    let consecutivePasses = (state.consecutivePasses || 0) + 1;
    let centerStack = state.centerStack;
    const totalPlayers = state.players.length;

    const nextPlayerId = getNextPlayerId(playerId, state.players);

    console.log(`Player ${playerId} passing. Passes so far (before this): ${state.consecutivePasses}. New: ${consecutivePasses}. Validating against ${totalPlayers - 1}`);

    // Check if everyone else passed
    if (consecutivePasses >= totalPlayers - 1) {
        console.log('Round Ends! Clearing stack.');
        consecutivePasses = 0;
        centerStack = [];
    }

    updateState({
        currentPlayerId: nextPlayerId,
        consecutivePasses,
        centerStack
    });
}

function handlePlayAction(playerId: string) {
    if (state.currentPlayerId !== playerId) return;
    const nextPlayerId = getNextPlayerId(playerId, state.players);

    // Simulate playing cards
    const centerStack = [...state.centerStack, [{ id: 'c1', value: 1, color: 'Red' } as Card]];

    updateState({
        players: state.players,
        centerStack, // Add to stack
        currentPlayerId: nextPlayerId,
        consecutivePasses: 0 // Reset passes
    });
}

async function runScenario() {
    console.log('--- Starting Scenario ---');
    // 1- Joueur 3 joue
    console.log('1. P3 Plays');
    handlePlayAction('3');

    // 2- Joueur 1 joue
    console.log('2. P1 Plays');
    handlePlayAction('1');

    // 3 - Joueur 2 passe
    console.log('3. P2 Passes');
    handlePassAction('2');

    // 4- Joueur 3 passe
    console.log('4. P3 Passes');
    handlePassAction('3');

    console.log('--- Final Check ---');
    if (state.centerStack.length === 0 && state.currentPlayerId === '1') {
        console.log('SUCCESS: Stack is empty and it is P1s turn.');
    } else {
        console.error('FAILURE: State is invalid.', state);
    }
}

runScenario();
