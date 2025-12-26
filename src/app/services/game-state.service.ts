import { Injectable, computed, signal } from '@angular/core';
import { GameState, INITIAL_GAME_STATE, Player, Card } from '../models/game.models';

@Injectable({
    providedIn: 'root'
})
export class GameStateService {
    private readonly _state = signal<GameState>(INITIAL_GAME_STATE); // Private writable

    // Public Read-only signals
    readonly state = this._state.asReadonly();

    readonly players = computed(() => this.state().players);
    readonly phase = computed(() => this.state().phase);
    readonly roomCode = computed(() => this.state().roomCode);

    readonly currentPlayerId = computed(() => this.state().currentPlayerId);
    readonly winnerId = computed(() => this.state().winnerId);

    // Hand is separate because it is PRIVATE info (Host knows all, Peer knows ONLY theirs).
    // But for simplicity in V2, we can keep "myHand" separate.
    readonly myHand = signal<Card[]>([]);

    readonly centerStack = computed(() => this.state().centerStack);
    readonly topCenterCards = computed(() => {
        const stack = this.state().centerStack;
        return stack.length > 0 ? stack[stack.length - 1] : [];
    });

    // --- Mutations ---

    updateState(partial: Partial<GameState>) {
        this._state.update(s => ({ ...s, ...partial }));
    }

    setHand(cards: Card[]) {
        this.myHand.set(cards);
    }

    addPlayer(p: Player) {
        this._state.update(s => ({
            ...s,
            players: [...s.players, p]
        }));
    }

    reset() {
        this._state.set(INITIAL_GAME_STATE);
        this.myHand.set([]);
    }
}
