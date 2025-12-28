import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../services/game-state.service';
import { GameEngineService } from '../../services/game-engine.service';
import { PeerService } from '../../services/peer.service';
import { Router } from '@angular/router';
import { CardComponent } from './card/card.component';
import { HandComponent } from './hand/hand.component';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';
import { TranslateModule } from '@ngx-translate/core';
import { Card } from '../../models/game.models';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, CardComponent, HandComponent, TranslateModule, LanguageSwitcherComponent],
  template: `
    <div class="board-container">
      <!-- HEADER -->
      <div class="header">
        <div class="room-info">
           <h1 (click)="onLogoClick()" title="Home" style="cursor: pointer;">ODIN</h1>
           <span class="code" (click)="copyRoomCode()" [title]="'BOARD.ROOM_CODE_COPIED' | translate" style="cursor: pointer;">
              CODE: {{ state.roomCode() }}
           </span>
        </div>
        
        <div class="lang-switcher">
            <app-language-switcher></app-language-switcher>
        </div>

        <div class="turn-info">
           {{ 'BOARD.HEADER.PHASE' | translate }}: {{ 'PHASE.' + state.phase() | translate }}
           <span *ngIf="isMyTurn()" class="your-turn">{{ 'BOARD.HEADER.YOUR_TURN' | translate }}</span>
        </div>
      </div>

      <!-- Toast Notification -->
      <div *ngIf="showCopyToast()" class="copy-toast">
          {{ 'BOARD.ROOM_CODE_COPIED' | translate }}
      </div>

      <!-- Exit Confirmation Modal -->
      <div *ngIf="isExitModalOpen()" class="modal-overlay">
          <div class="modal-box">
              <h2>{{ 'BOARD.CONFIRM_EXIT.TITLE' | translate }}</h2>
              <p>{{ 'BOARD.CONFIRM_EXIT.MESSAGE' | translate }}</p>
              <div class="modal-actions">
                  <button class="btn-cancel" (click)="isExitModalOpen.set(false)">
                      {{ 'BOARD.CONFIRM_EXIT.STAY' | translate }}
                  </button>
                  <button class="btn-confirm" (click)="confirmExit()">
                      {{ 'BOARD.CONFIRM_EXIT.EXIT' | translate }}
                  </button>
              </div>
          </div>
      </div>

      <!-- Pickup Banner (Floating Top) -->
      <div *ngIf="isPickingUp" class="pickup-banner">
          <p>{{ 'BOARD.PICKUP_BANNER.TEXT' | translate }}</p>
          <button (click)="handlePass()">{{ 'BOARD.PICKUP_BANNER.CANCEL' | translate }}</button>
      </div>

      <!-- Results Overlay -->
      <div *ngIf="state.phase() === 'ROUND_END' || state.phase() === 'GAME_END'" class="results-overlay">
          <div class="results-box">
            <h2>{{ (state.phase() === 'GAME_END' ? 'BOARD.RESULTS.GAME_OVER' : 'BOARD.RESULTS.ROUND_OVER') | translate }}</h2>
            <div class="score-table">
                <div *ngFor="let p of state.players()" class="score-row" style="display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee;">
                    <span>{{ p.name }}</span>
                    <span class="score-val" style="font-weight: bold; color: var(--color-viking-red);">{{ p.score }} {{ 'BOARD.PLAYER.PTS' | translate }}</span>
                    <span *ngIf="p.id === state.winnerId()">🏆</span>
                </div>
            </div>
            <div style="margin-top: 20px;">
                <button *ngIf="showNextRoundButton()" (click)="engine.nextRound()" class="next-round-btn" style="background: var(--color-viking-red); color: white; padding: 10px 20px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
                    {{ (state.phase() === 'GAME_END' ? 'BOARD.RESULTS.RESTART' : 'BOARD.RESULTS.NEXT_ROUND') | translate }}
                </button>
                <p *ngIf="!showNextRoundButton()" style="color: #888;">{{ 'BOARD.RESULTS.WAITING_HOST' | translate }}</p>
            </div>
          </div>
      </div>

      <!-- PLAYERS -->
      <div class="players-bar">
         <div *ngFor="let p of state.players()" 
              class="player-badge" 
              [class.active]="p.id === state.currentPlayerId()"
              [class.me]="p.id === peer.myId()">
            <div class="p-name">{{ p.name }}</div>
            <div class="p-cards">{{ p.handCount }} {{ 'BOARD.PLAYER.CARDS' | translate }}</div>
            <div class="p-score">{{ p.score }} {{ 'BOARD.PLAYER.PTS' | translate }}</div>
         </div>
      </div>

      <!-- CENTER  -->
      <div class="center-area" [class.is-picking-up]="isPickingUp">
         <!-- Pickup Instruction Overlay -->
         <div *ngIf="isPickingUp" class="pickup-instruction">
             {{ 'BOARD.CENTER.SELECT_INSTRUCTION' | translate }}
         </div>

         <!-- Start Button for Host -->
         <div *ngIf="showStartButton()" class="start-overlay">
             <h2>{{ 'BOARD.START_OVERLAY.WAITING' | translate }}</h2>
             <button (click)="engine.startGame()">{{ 'BOARD.START_OVERLAY.START' | translate }}</button>
         </div>

         <!-- Play Mat Decoration -->
         <div class="play-mat">

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
      </div>

      <!-- HAND -->
      <app-hand 
            (onPlay)="handlePlay($event)" 
            (onPass)="handlePass()"
            [isPickingUp]="isPickingUp">
      </app-hand>
    </div>
  `,
  styles: [`
    .board-container {
      height: 100vh;
      background: linear-gradient(135deg, var(--color-ice-light) 0%, var(--color-ice-dark) 100%);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      color: var(--color-text-main);
      font-family: var(--font-main);
      position: relative;
    }
    
    /* Decoration - Icebergs/Mountains (pseudo-element for aesthetics) */
    .board-container::before {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 30vh;
        background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="%23EFF9FC" fill-opacity="0.4" d="M0,224L60,213.3C120,203,240,181,360,181.3C480,181,600,203,720,224C840,245,960,267,1080,261.3C1200,256,1320,224,1380,208L1440,192L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path></svg>');
        background-repeat: no-repeat;
        background-size: cover;
        pointer-events: none;
        z-index: 0;
    }

    .header {
      padding: 15px 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.5); /* Glassmorphism */
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
      z-index: 100;
      border-bottom: 1px solid rgba(255,255,255,0.6);
    }
    .room-info {
        display: flex;
        align-items: center;
        gap: 20px;
    }
    h1 { 
        margin: 0; 
        font-size: 3rem; /* Slightly larger title */
        color: var(--color-viking-red); 
        text-shadow: 2px 2px 0px rgba(0,0,0,0.1); 
        letter-spacing: 2px;
        font-family: var(--font-display, sans-serif);
        font-weight: 900;
        line-height: 1; /* Fix vertical alignment */
    }
    .code { 
        font-weight: bold; 
        background: white; 
        color: var(--color-text-main);
        padding: 8px 16px; 
        border-radius: 12px; 
        margin-left: 0; /* Handled by gap */
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        font-size: 1.2rem;
    }
    .turn-info {
        font-weight: 600;
        background: white;
        padding: 5px 15px;
        border-radius: 20px;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .your-turn { 
        background: var(--color-viking-red); 
        color: white; 
        padding: 4px 10px; 
        border-radius: 6px; 
        font-size: 0.8rem;
        animation: pulseTurn 1.5s infinite;
    }

    @keyframes pulseTurn {
        0% { box-shadow: 0 0 0 0 rgba(217, 79, 48, 0.4); }
        70% { box-shadow: 0 0 0 10px rgba(217, 79, 48, 0); }
        100% { box-shadow: 0 0 0 0 rgba(217, 79, 48, 0); }
    }

    /* Pickup Banner */
    .pickup-banner {
        background: var(--color-viking-orange);
        color: white;
        padding: 12px;
        text-align: center;
        font-weight: bold;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 20px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        z-index: 90;
        border-bottom: 4px solid #cc8d00;
    }
    .pickup-banner p { margin: 0; font-size: 1.2rem; text-shadow: 1px 1px 2px rgba(0,0,0,0.2); }
    .pickup-banner button { 
        background: white; 
        color: var(--color-viking-orange); 
        border: none; 
        padding: 8px 16px; 
        border-radius: 20px; 
        cursor: pointer;
        font-weight: 800;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }
    .pickup-banner button:hover { transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,0.2); }

    .players-bar {
      display: flex;
      justify-content: center;
      gap: 20px;
      padding: 15px;
      z-index: 100;
    }
    .player-badge {
      background: white;
      padding: 10px 20px;
      border-radius: 12px;
      text-align: center;
      border: 3px solid transparent;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
      transition: all 0.3s;
      color: var(--color-text-main);
      position: relative;
    }
    .player-badge.active { 
        border-color: var(--color-viking-orange); 
        transform: translateY(-5px); 
        box-shadow: 0 10px 20px rgba(242, 169, 0, 0.2);
    }
    .player-badge.me { 
        border-color: var(--color-ice-dark); 
        background: #f0f9ff;
    }
    .p-name { font-weight: 800; font-size: 1.1rem; }
    .p-cards { font-size: 0.9rem; color: #666; margin-top: 4px;}
    .p-score { font-weight: bold; color: var(--color-viking-red); margin-top: 4px; }
    
    .center-area {
      flex: 1;
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      background: none; /* Removed heavy gradients */
      z-index: 10;
    }

    /* Highlight center area when picking up */
    .pickup-instruction {
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding-top: 40px;
        color: white;
        font-weight: bold;
        text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        font-size: 1.5rem;

        position: absolute;
        width: 778px;
        height: 310px;
        transform: translate(-50%, -50%);
        left: 50% !important;
        top: 42% !important;
        border-radius: 20px;
        
        inset: 20px;
        border: 4px dashed var(--color-viking-orange);
        pointer-events: none;
        background: rgba(242, 169, 0, 0.1);
        animation: pulseBorder 1.5s infinite;
        z-index: 55; /* Higher than mat, lower than cards? No, cards are z-index 50/100? */
    }

    @keyframes pulseBorder {
        0% { opacity: 0.8; }
        50% { opacity: 0.4; }
        100% { opacity: 0.8; }
    }

    .play-stack {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 90%;
    }

    .play-mat {
        position: absolute;
        width: 860px;
        height: 500px;
        border: 3px solid rgba(255,255,255,0.6);
        border-radius: 40px;
        transform: translate(-50%, -50%);
        left: 50%;
        /* Shift up to leave space for hand at bottom */
        top: 42%; 
        pointer-events: none;
        background: rgba(255,255,255,0.15);
        box-shadow: inset 0 0 30px rgba(255,255,255,0.2);
    }
    
    .card-set {
       display: flex;
       justify-content: center;
       gap: 10px;
       transition: transform 0.3s;
       filter: drop-shadow(0 10px 15px rgba(0,0,0,0.2));
    }
    .card-set.selectable {
        cursor: pointer;
        z-index: 50;
    }
    .card-set.selectable app-card {
        cursor: pointer;
        pointer-events: auto;
        /* Highlight cards specifically */
        transition: transform 0.2s;
    }
    .card-set.selectable app-card:hover {
        transform: scale(1.1) translateY(-10px);
        filter: brightness(1.1);
    }

    .results-overlay {
        position: fixed;
        inset: 0;
        background: rgba(125, 182, 217, 0.95); /* ice dark with opacity */
        z-index: 200;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: white;
        animation: fadeIn 0.3s;
    }
    .results-box {
        background: white;
        padding: 40px;
        border-radius: 20px;
        color: var(--color-text-main);
        box-shadow: 0 20px 50px rgba(0,0,0,0.2);
        text-align: center;
        min-width: 400px;
    }
    .start-overlay {
        position: absolute;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
        z-index: 60;
    }
    .start-overlay button {
        background: var(--color-viking-orange);
        color: white;
        font-size: 1.5rem;
        padding: 15px 40px;
        border-radius: 50px;
        border: none;
        border-bottom: 6px solid #cc8d00;
        font-weight: 900;
        cursor: pointer;
    }
    .start-overlay button:active {
        transform: translateY(4px);
        border-bottom-width: 2px;
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    /* Mobile Responsive tweaks maybe? */

    /* Copy Toast */
    .copy-toast {
        position: fixed;
        bottom: 120px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 25px;
        border-radius: 30px;
        font-weight: 600;
        z-index: 1000;
        animation: slideUpFade 0.3s ease-out, fadeOut 0.3s ease-in 2s forwards;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    }

    @keyframes slideUpFade {
        from { opacity: 0; transform: translate(-50%, 20px); }
        to { opacity: 1; transform: translate(-50%, 0); }
    }
    @keyframes fadeOut {
        to { opacity: 0; }
    }

    /* Modals */
    .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(5px);
        z-index: 1000;
        display: flex;
        justify-content: center;
        align-items: center;
        animation: fadeIn 0.2s;
    }
    .modal-box {
        background: white;
        padding: 40px;
        border-radius: 20px;
        text-align: center;
        max-width: 450px;
        width: 90%;
        box-shadow: 0 15px 35px rgba(0,0,0,0.3);
        border: 4px solid var(--color-ice-dark);
    }
    .modal-box h2 {
        margin: 0 0 15px;
        color: var(--color-viking-red);
        font-weight: 900;
        font-size: 2rem;
    }
    .modal-box p {
        font-size: 1.1rem;
        color: #444;
        margin-bottom: 30px;
    }
    .modal-actions {
        display: flex;
        gap: 15px;
        justify-content: center;
    }
    .modal-actions button {
        padding: 12px 30px;
        border-radius: 12px;
        font-weight: 800;
        cursor: pointer;
        font-size: 1rem;
        transition: transform 0.2s;
    }
    .modal-actions button:hover {
        transform: scale(1.05);
    }
    .btn-cancel {
        background: #eee;
        border: none;
        color: #666;
    }
    .btn-confirm {
        background: var(--color-viking-red);
        border: none;
        color: white;
        box-shadow: 0 4px 8px rgba(217, 79, 48, 0.3);
    }
  `]
})
export class BoardComponent {
  state = inject(GameStateService);
  engine = inject(GameEngineService);
  peer = inject(PeerService);
  router = inject(Router);
  // No need to inject TranslateService unless used in code logic, pipe is enough for template

  topCards = this.state.topCenterCards;

  isPickingUp = false;
  pendingPlayedCards: Card[] = [];

  showCopyToast = signal(false);
  isExitModalOpen = signal(false);

  copyRoomCode() {
    navigator.clipboard.writeText(this.state.roomCode());
    this.showCopyToast.set(true);
    setTimeout(() => this.showCopyToast.set(false), 2500);
  }

  onLogoClick() {
    this.isExitModalOpen.set(true);
  }

  confirmExit() {
    this.isExitModalOpen.set(false);
    this.router.navigate(['/']);
  }

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
