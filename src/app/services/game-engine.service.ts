import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PeerService } from './peer.service';
import { GameStateService } from './game-state.service';
import { NetworkMessage, Player, Card } from '../models/game.models';
import { DataConnection } from 'peerjs';
import { OdinGameLogic } from '../models/odin.logic';

@Injectable({
    providedIn: 'root'
})
export class GameEngineService {
    private peerService = inject(PeerService);
    private stateService = inject(GameStateService);
    private router = inject(Router);

    private hostConnection: DataConnection | null = null;
    private clientConnections = new Map<string, DataConnection>();

    constructor() {
        this.peerService.message$.subscribe(({ connection, message }) => {
            this.handleMessage(connection, message);
        });
    }

    // --- HOST ACTIONS ---

    async createGame(hostName: string): Promise<string> {
        let roomCode = '';
        let success = false;

        for (let i = 0; i < 3; i++) {
            roomCode = Math.floor(1000 + Math.random() * 9000).toString();
            const peerId = `odin-v2-${roomCode}`;
            try {
                await this.peerService.init(peerId);
                success = true;
                break;
            } catch (err: any) {
                if (err.type === 'unavailable-id') {
                    console.warn(`Room ${roomCode} taken, retrying...`);
                    continue;
                }
                throw err;
            }
        }

        if (!success) throw new Error('Could not generate a unique room code. Try again.');

        this.stateService.reset();
        const hostPlayer: Player = {
            id: this.peerService.myId(),
            name: hostName,
            isHost: true,
            handCount: 0,
            score: 0
        };

        this.stateService.updateState({
            roomCode: roomCode,
            hostId: hostPlayer.id,
            phase: 'LOBBY',
            players: [hostPlayer],
            consecutivePasses: 0
        });

        return roomCode;
    }

    // --- CLIENT ACTIONS ---

    async joinGame(roomCode: string, name: string): Promise<void> {
        await this.peerService.init();
        const hostPeerId = `odin-v2-${roomCode}`;
        this.hostConnection = await this.peerService.connectToPeer(hostPeerId);

        const myPlayer: Player = {
            id: this.peerService.myId(),
            name: name,
            isHost: false,
            handCount: 0,
            score: 0
        };

        this.peerService.send(this.hostConnection, {
            type: 'JOIN_REQUEST',
            payload: myPlayer
        });
    }

    startGame() {
        if (!this.isHost()) return;
        if (this.stateService.players().length < 2) {
            alert('Need at least 2 players!');
            return;
        }

        const deck = OdinGameLogic.createDeck();
        const players = this.stateService.players();

        for (const p of players) {
            const hand = deck.splice(0, 9);
            if (p.id === this.peerService.myId()) {
                this.stateService.setHand(hand);
            } else {
                const conn = this.clientConnections.get(p.id);
                if (conn) {
                    this.peerService.send(conn, { type: 'PRIVATE_HAND', payload: hand });
                }
            }
        }

        const startingPlayerId = players[0].id;
        const updatedPlayers = players.map(p => ({ ...p, handCount: 9 }));

        this.stateService.updateState({
            phase: 'PLAYING',
            players: updatedPlayers,
            currentPlayerId: startingPlayerId,
            centerStack: [],
            deckSize: deck.length,
            consecutivePasses: 0
        });

        this.broadcastState();
    }

    playCards(cards: Card[], pickUpCardId?: string) {
        const myId = this.peerService.myId();
        const payload = { cards, pickUpCardId };

        if (this.isHost()) {
            this.handlePlayAction(myId, payload);
        } else {
            this.peerService.send(this.hostConnection!, {
                type: 'PLAYER_ACTION_PLAY',
                payload: payload
            });
        }
    }

    passTurn() {
        const myId = this.peerService.myId();
        if (this.isHost()) {
            this.handlePassAction(myId);
        } else {
            this.peerService.send(this.hostConnection!, { type: 'PLAYER_ACTION_PASS', payload: null });
        }
    }

    // --- MESSAGE HANDLING ---

    private handleMessage(conn: DataConnection, msg: NetworkMessage) {
        switch (msg.type) {
            case 'JOIN_REQUEST':
                if (this.isHost()) this.handleJoinRequest(conn, msg.payload);
                break;
            case 'GAME_STATE':
                this.stateService.updateState(msg.payload);
                break;
            case 'PRIVATE_HAND':
                this.stateService.setHand(msg.payload);
                break;
            case 'PLAYER_ACTION_PLAY':
                if (this.isHost()) this.handlePlayAction(conn.peer, msg.payload);
                break;
            case 'PLAYER_ACTION_PASS':
                if (this.isHost()) this.handlePassAction(conn.peer);
                break;
            case 'PICK_UP_CARD':
                this.handlePickUpCard(msg.payload);
                break;
            case 'PLAY_RESULT':
                this.handlePlayResult(msg.payload);
                break;
        }
    }

    private handlePlayResult(payload: { playedCardIds: string[], pickUpCard?: Card }) {
        const currentHand = this.stateService.myHand();
        const playedIds = new Set(payload.playedCardIds);
        let newHand = currentHand.filter(c => !playedIds.has(c.id));

        if (payload.pickUpCard) {
            newHand.push(payload.pickUpCard);
        }
        this.stateService.setHand(newHand);

        // Notify engine if hand is empty
        if (newHand.length === 0) {
            // The client doesn't need to do much, the host will detect it via handCount
        }
    }

    private endRound() {
        if (!this.isHost()) return;

        const state = this.stateService.state();
        const players = state.players.map(p => ({
            ...p,
            score: p.score + p.handCount
        }));

        const isGameOver = players.some(p => p.score >= 15);
        let winnerId: string | undefined;

        if (isGameOver) {
            // Lowest score wins
            winnerId = [...players].sort((a, b) => a.score - b.score)[0].id;
        }

        this.stateService.updateState({
            players,
            phase: isGameOver ? 'GAME_END' : 'ROUND_END',
            winnerId
        });

        this.broadcastState();
    }

    nextRound() {
        if (!this.isHost()) return;

        const state = this.stateService.state();
        const players = [...state.players];
        const deck = OdinGameLogic.createDeck();
        // deck is already shuffled by OdinGameLogic.createDeck()

        players.forEach(p => {
            const hand = deck.splice(0, 9);
            const conn = this.clientConnections.get(p.id);
            if (conn) {
                this.peerService.send(conn, { type: 'PRIVATE_HAND', payload: hand });
            } else if (p.id === this.peerService.myId()) {
                this.stateService.setHand(hand);
            }
            p.handCount = 9;
        });

        // Next round starting player: to the left of the previous starting player
        const prevFirstId = state.lastRoundFirstPlayerId || players[0].id;

        let nextFirstId = players[0].id;
        const idx = players.findIndex(p => p.id === prevFirstId);
        if (idx !== -1) {
            const nextIdx = (idx + 1) % players.length;
            nextFirstId = players[nextIdx].id;
        }

        this.stateService.updateState({
            players,
            phase: 'PLAYING',
            currentPlayerId: nextFirstId,
            lastRoundFirstPlayerId: nextFirstId,
            centerStack: [],
            consecutivePasses: 0
        });

        this.broadcastState();
    }

    private handlePickUpCard(card: Card) {
        const currentHand = this.stateService.myHand();
        this.stateService.setHand([...currentHand, card]);
    }

    private isHost(): boolean {
        return this.stateService.state().hostId === this.peerService.myId();
    }

    // --- HOST LOGIC ---

    private handleJoinRequest(conn: DataConnection, player: Player) {
        if (this.stateService.phase() !== 'LOBBY') {
            this.peerService.send(conn, { type: 'ERROR', payload: 'Game already started' });
            return;
        }
        this.clientConnections.set(player.id, conn);
        this.stateService.addPlayer(player);
        this.broadcastState();
    }

    private handlePlayAction(playerId: string, payload: { cards: Card[], pickUpCardId?: string }) {
        const state = this.stateService.state();
        if (state.currentPlayerId !== playerId) return;

        const { cards, pickUpCardId } = payload;

        // Sort played cards (High -> Low)
        cards.sort((a, b) => b.value - a.value);

        const centerStack = state.centerStack;
        // Logic: if consecutive passes cleared stack, top is empty.
        const topCards = centerStack.length > 0 ? centerStack[centerStack.length - 1] : [];

        const valid = OdinGameLogic.validatePlay(cards, topCards);
        if (!valid.valid) {
            console.warn('Invalid play by', playerId, valid.message);
            return;
        }

        const currentHandCount = state.players.find(p => p.id === playerId)?.handCount || 0;
        const newHandCount = currentHandCount - cards.length;

        // --- ROUND END CHECK ---
        // If this play empties the hand, the round ends immediately (Rule 1 & 2).
        // No pickup is required even if stack has cards.
        if (newHandCount === 0) {
            const players = state.players.map(p => {
                if (p.id === playerId) {
                    return { ...p, handCount: 0 };
                }
                return p;
            });

            // Update Local Hand if Host
            if (playerId === this.peerService.myId()) {
                const currentHand = this.stateService.myHand();
                const playedIds = new Set(cards.map(c => c.id));
                const newHand = currentHand.filter(c => !playedIds.has(c.id));
                this.stateService.setHand(newHand);
            }

            // Update state to reflect play, BUT then immediately end round.
            // Actually, we can just update state and call endRound.
            // However, we should probably show the played cards for a split second?
            // The rules say "Round ends". 
            // We should update the stack so others see what was played.

            this.stateService.updateState({
                players,
                centerStack: [...centerStack, cards],
                // We don't really need to set next player, as round ends.
                consecutivePasses: 0
            });

            this.broadcastState();
            this.endRound();
            return;
        }

        // --- PICK UP LOGIC (Normal Refill) ---
        // If topCards is NOT empty, Player MUST pick up a card.
        // We expect pickUpCardId to be present and valid.
        let cardToPickUp: Card | null = null;

        if (topCards.length > 0) {
            if (!pickUpCardId) {
                console.warn('Invalid play: Must pick up a card', playerId);
                // In a robust system we would send error back.
                return;
            }

            cardToPickUp = topCards.find(c => c.id === pickUpCardId) || null;
            if (!cardToPickUp) {
                console.warn('Invalid play: Pick up card not found in previous set', playerId);
                return;
            }
        }

        const players = state.players.map(p => {
            if (p.id === playerId) {
                // We already know handCount > 0 here
                let newCount = p.handCount - cards.length;
                if (cardToPickUp) newCount++; // Add picked up card
                return { ...p, handCount: newCount };
            }
            return p;
        });

        const nextPlayerId = this.getNextPlayerId(playerId);

        // Update Local Hand if Host
        if (playerId === this.peerService.myId()) {
            const currentHand = this.stateService.myHand();
            const playedIds = new Set(cards.map(c => c.id));
            let newHand = currentHand.filter(c => !playedIds.has(c.id));

            if (cardToPickUp) {
                newHand.push(cardToPickUp);
            }
            this.stateService.setHand(newHand);
        } else {
            // Send result to client
            const conn = this.clientConnections.get(playerId);
            if (conn) {
                this.peerService.send(conn, {
                    type: 'PLAY_RESULT',
                    payload: {
                        playedCardIds: cards.map(c => c.id),
                        pickUpCard: cardToPickUp
                    }
                });
            }
        }

        // Update Center Stack: Remove previous top, Add new top.
        // BUT we need to keep history? 
        // Logic: "The rest of the set is discarded".
        // So effectively, the stack grows but previous items are "dead".
        // Visually we often show a pile. 
        // If I replace the array, it might look cleaner.
        // Let's just APPEND for now (so we see history), but we know logic only checks last.
        // Wait, if I append, `topCards` next time will be the one I just played. Correct.
        // What about the one underneath? It's effectively gone from logic. 
        // Visuals might get cluttered.
        // I will keep appending. 

        this.stateService.updateState({
            players,
            centerStack: [...centerStack, cards],
            currentPlayerId: nextPlayerId,
            consecutivePasses: 0
        });

        this.broadcastState();
    }

    private handlePassAction(playerId: string) {
        const state = this.stateService.state();
        if (state.currentPlayerId !== playerId) return;

        let consecutivePasses = (state.consecutivePasses || 0) + 1;
        let centerStack = state.centerStack;
        const totalPlayers = state.players.length;

        const nextPlayerId = this.getNextPlayerId(playerId);

        // Check if everyone else passed
        if (consecutivePasses >= totalPlayers - 1) {
            // Round ends! Stack clears.
            // The NEXT player starts (who is effectively the one who played last, or just the next in line if everyone passed from start -- rare)
            // Actually, if P1 plays, P2 pass, P3 pass. consecutivePasses = 2. Total = 3. 2 >= 2. True.
            // Next player is P1. P1 starts new.
            consecutivePasses = 0;
            centerStack = [];
        }

        this.stateService.updateState({
            currentPlayerId: nextPlayerId,
            consecutivePasses,
            centerStack
        });
        this.broadcastState();
    }

    private broadcastState() {
        const currentState = this.stateService.state();
        for (const conn of this.clientConnections.values()) {
            this.peerService.send(conn, { type: 'GAME_STATE', payload: currentState });
        }
    }

    private getNextPlayerId(currentId: string): string {
        const players = this.stateService.players();
        if (players.length === 0) return currentId;
        const idx = players.findIndex(p => p.id === currentId);
        const nextIdx = (idx + 1) % players.length;
        return players[nextIdx].id;
    }
}
