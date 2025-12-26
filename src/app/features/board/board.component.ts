import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../services/game-state.service';
import { GameEngineService } from '../../services/game-engine.service';
import { PeerService } from '../../services/peer.service';
import { CardComponent } from './card/card.component';
import { HandComponent } from './hand/hand.component';
import { Card } from '../../models/game.models';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, CardComponent, HandComponent],
  template: `
    <div class="board-container">
      <!-- HEADER -->
      <div class="header">
        <div class="room-info">
           <h1>ODIN</h1>
           <span class="code">CODE: {{ state.roomCode() }}</span>
        </div>
        <div class="turn-info">
           Phase: {{ state.phase() }}
           <span *ngIf="isMyTurn()" class="your-turn">YOUR TURN</span>
        </div>
      </div>

      <!-- Pickup Banner -->
      <div *ngIf="isPickingUp" class="pickup-banner">
          <p>PICK UP A CARD FROM THE CENTER</p>
          <button (click)="handlePass()">CANCEL</button>
      </div>

      <!-- Results Overlay -->
      <div *ngIf="state.phase() === 'ROUND_END' || state.phase() === 'GAME_END'" class="results-overlay">
          <h2>{{ state.phase() === 'GAME_END' ? 'GAME OVER!' : 'ROUND OVER!' }}</h2>
          <div class="score-table">
              <div *ngFor="let p of state.players()" class="score-row">
                  <span>{{ p.name }}</span>
                  <span class="score-val">{{ p.score }} pts</span>
                  <span *ngIf="p.id === state.winnerId()">🏆</span>
              </div>
          </div>
          <button *ngIf="showNextRoundButton()" (click)="engine.nextRound()" class="next-round-btn">
              {{ state.phase() === 'GAME_END' ? 'RESTART GAME' : 'NEXT ROUND' }}
          </button>
          <p *ngIf="!showNextRoundButton()">Waiting for host to continue...</p>
      </div>

      <!-- PLAYERS -->
      <div class="players-bar">
         <div *ngFor="let p of state.players()" 
              class="player-badge" 
              [class.active]="p.id === state.currentPlayerId()"
              [class.me]="p.id === peer.myId()">
            <div class="p-name">{{ p.name }}</div>
            <div class="p-hand">{{ p.handCount }} Cards</div>
            <div class="p-score">{{ p.score }} Total Pts</div>
         </div>
      </div>

      <!-- CENTER  -->
      <div class="center-area" [class.is-picking-up]="isPickingUp">
         <!-- Start Button for Host -->
         <div *ngIf="showStartButton()" class="start-overlay">
             <h2>Waiting for players...</h2>
             <button (click)="engine.startGame()">START GAME</button>
         </div>

         <!-- Active Play Pile (Last 2 sets) -->
         <div class="play-stack">
            <!-- Current Top Set -->
            <div class="card-set top" [class.selectable]="isPickingUp">
               <app-card *ngFor="let c of topCards()" 
                         [card]="c"
                         (click)="onCenterCardClick(c)">
               </app-card>
            </div>
         </div>
      </div>

      <!-- HAND -->
      <app-hand (onPlay)="handlePlay($event)" (onPass)="handlePass()">
      </app-hand>
    </div>
  `,
  styles: [`
    .board-container {
      height: 100vh;
      background: #0f172a;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      color: white;
      font-family: 'Inter', sans-serif;
    }
    .header {
      padding: 10px 20px;
      display: flex;
      justify-content: space-between;
      background: #1e293b;
      align-items: center;
      border-bottom: 1px solid #334155;
      z-index: 100;
    }
    h1 { margin: 0; font-size: 1.5rem; color: #f59e0b; }
    .code { font-weight: bold; background: #334155; padding: 5px 10px; border-radius: 5px; margin-left: 10px; }
    .your-turn { background: #22c55e; padding: 5px 10px; border-radius: 5px; font-weight: bold; margin-left: 10px; }

    /* Redesigned Pickup Banner */
    .pickup-banner {
        background: linear-gradient(90deg, #f59e0b, #d97706);
        color: #0f172a;
        padding: 10px;
        text-align: center;
        font-weight: bold;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 20px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        animation: slideDown 0.3s ease-out;
    }
    .pickup-banner p { margin: 0; font-size: 1.1rem; }
    .pickup-banner button { 
        background: #0f172a; 
        color: white; 
        border: none; 
        padding: 5px 15px; 
        border-radius: 5px; 
        cursor: pointer;
        font-size: 0.9rem;
    }

    @keyframes slideDown {
        from { transform: translateY(-100%); }
        to { transform: translateY(0); }
    }

    .players-bar {
      display: flex;
      justify-content: center;
      gap: 20px;
      padding: 15px;
      background: #0f172a;
    }
    .player-badge {
      background: #334155;
      padding: 8px 16px;
      border-radius: 10px;
      text-align: center;
      border: 2px solid transparent;
      opacity: 0.8;
      transition: all 0.3s;
    }
    .player-badge.active { border-color: #f59e0b; opacity: 1; transform: scale(1.05); background: #1e293b; }
    .player-badge.me { box-shadow: 0 0 15px rgba(245, 158, 11, 0.2); }
    
    .center-area {
      flex: 1;
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      background: radial-gradient(circle, #1e293b 0%, #0f172a 100%);
    }

    /* Highlight center area when picking up */
    .center-area.is-picking-up::after {
        content: '';
        position: absolute;
        inset: 10%;
        border: 2px dashed #f59e0b;
        border-radius: 20px;
        pointer-events: none;
        animation: pulse 2s infinite;
    }

    @keyframes pulse {
        0% { opacity: 0.3; transform: scale(1); }
        50% { opacity: 0.6; transform: scale(1.02); }
        100% { opacity: 0.3; transform: scale(1); }
    }

    .play-stack {
       display: flex;
       justify-content: center;
       align-items: center;
       min-height: 150px;
    }
    
    .card-set {
       display: flex;
       gap: 10px;
       transition: transform 0.3s;
    }
    .card-set.selectable {
        cursor: pointer;
        z-index: 50;
    }
    .card-set.selectable app-card {
        cursor: pointer;
        pointer-events: auto;
        box-shadow: 0 0 20px #f59e0b;
    }
  `]
})
export class BoardComponent {
  state = inject(GameStateService);
  engine = inject(GameEngineService);
  peer = inject(PeerService);

  topCards = this.state.topCenterCards;

  isPickingUp = false;
  pendingPlayedCards: Card[] = [];

  isMyTurn() {
    return this.state.currentPlayerId() === this.peer.myId();
  }

  showNextRoundButton() {
    const isHost = this.state.players().find(p => p.id === this.peer.myId())?.isHost;
    const isRoundEnd = this.state.phase() === 'ROUND_END' || this.state.phase() === 'GAME_END';
    return isHost && isRoundEnd;
  }

  showStartButton() {
    return this.state.phase() === 'LOBBY' && this.state.players().find(p => p.id === this.peer.myId())?.isHost;
  }

  handlePlay(cards: Card[]) {
    const top = this.topCards();
    const myId = this.peer.myId();
    const myPlayer = this.state.players().find(p => p.id === myId);

    // If playing these cards empties my hand, I don't need to pick up!
    // NOTE: This assumes cards are from my hand.
    const willEmptyHand = myPlayer && (myPlayer.handCount === cards.length);

    if (top && top.length > 0 && !willEmptyHand) {
      this.pendingPlayedCards = cards;
      this.isPickingUp = true;
    } else {
      this.engine.playCards(cards);
    }
  }

  handlePass() {
    if (this.isPickingUp) {
      this.isPickingUp = false;
      this.pendingPlayedCards = [];
      return;
    }
    this.engine.passTurn();
  }

  onCenterCardClick(card: Card) {
    if (this.isPickingUp) {
      this.engine.playCards(this.pendingPlayedCards, card.id);
      this.isPickingUp = false;
      this.pendingPlayedCards = [];
    }
  }
}
