export type CardColor = 'Red' | 'Blue' | 'Green' | 'Yellow' | 'Purple' | 'Orange';

export interface Card {
    id: string;
    value: number;
    color: CardColor;
}

export interface Player {
    id: string; // PeerID
    name: string;
    isHost: boolean;
    handCount: number;
    score: number;
}

export interface NetworkMessage {
    type: 'JOIN_REQUEST' | 'JOIN_ACCEPT' | 'GAME_STATE' | 'PLAYER_ACTION_PLAY' | 'PLAYER_ACTION_PASS' | 'ERROR' | 'PRIVATE_HAND' | 'PICK_UP_CARD' | 'PLAY_RESULT';
    payload: any;
}

export interface GameState {
    roomCode: string; // The 4 digit suffix
    hostId: string;
    phase: 'LOBBY' | 'PLAYING' | 'ROUND_END' | 'GAME_END';
    players: Player[];
    currentPlayerId: string | null;
    centerStack: Card[][]; // Stack of played sets. Top is active.
    deckSize: number;
    consecutivePasses: number;
    winnerId?: string;
    lastRoundFirstPlayerId?: string;
}

export const INITIAL_GAME_STATE: GameState = {
    roomCode: '',
    hostId: '',
    phase: 'LOBBY',
    players: [],
    currentPlayerId: null,
    centerStack: [],
    deckSize: 0,
    consecutivePasses: 0
};
