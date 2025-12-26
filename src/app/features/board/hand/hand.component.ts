import { Component, inject, computed, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../card/card.component';
import { GameStateService } from '../../../services/game-state.service';
import { PeerService } from '../../../services/peer.service';
import { Card } from '../../../models/game.models';
import { OdinGameLogic } from '../../../models/odin.logic';

@Component({
    selector: 'app-hand',
    standalone: true,
    imports: [CommonModule, CardComponent],
    template: `
    <div class="hand-container">
      <div class="cards-list">
        @for (card of mySortedHand(); track card.id) {
          <app-card 
            [card]="card" 
            [selected]="isSelected(card)"
            (click)="toggleSelection(card)">
          </app-card>
        }
      </div>

      <div class="controls" *ngIf="isMyTurn()">
        <div class="info">
           Selected: {{ selectedCards().length }} 
           <span *ngIf="validationMessage()" class="error">({{ validationMessage() }})</span>
        </div>
        <div class="actions">
          <button (click)="play()" [disabled]="!canPlay()">PLAY</button>
          <button (click)="pass()" class="pass">PASS</button>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .hand-container {
      position: fixed;
      bottom: 20px;
      left: 0;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }
    .cards-list {
      display: flex;
      gap: -30px; /* Overlap */
      padding: 20px;
    }
    .controls {
      background: rgba(0,0,0,0.8);
      padding: 15px 30px;
      border-radius: 50px;
      display: flex;
      gap: 20px;
      align-items: center;
      color: white;
    }
    button {
      padding: 10px 20px;
      border-radius: 20px;
      border: none;
      font-weight: bold;
      cursor: pointer;
      background: #22c55e;
      color: white;
    }
    button:disabled { background: #555; cursor: not-allowed; }
    button.pass { background: #ef4444; }
    .error { color: #f87171; font-size: 0.9rem; margin-left: 10px; }
  `]
})
export class HandComponent {
    state = inject(GameStateService);
    peer = inject(PeerService);

    onPlay = output<Card[]>();
    onPass = output<void>();

    selectedIds = signal<Set<string>>(new Set());

    mySortedHand = computed(() => {
        // Sort by color then value for display
        return this.state.myHand().slice().sort((a, b) => {
            if (a.color !== b.color) return a.color.localeCompare(b.color);
            return a.value - b.value;
        });
    });

    isMyTurn = computed(() => this.state.currentPlayerId() === this.peer.myId());

    // Validation
    validationResult = computed(() => {
        const selected = this.mySortedHand().filter(c => this.selectedIds().has(c.id));
        const center = this.state.topCenterCards();
        return OdinGameLogic.validatePlay(selected, center || []);
    });

    isValid = computed(() => this.validationResult().valid);
    validationMessage = computed(() => this.validationResult().message);

    // Selection
    selectedCards = computed(() =>
        this.mySortedHand().filter(c => this.selectedIds().has(c.id))
    );

    toggleSelection(card: Card) {
        if (!this.isMyTurn()) return; // Selection Guard

        this.selectedIds.update(ids => {
            const newIds = new Set(ids);
            if (newIds.has(card.id)) newIds.delete(card.id);
            else newIds.add(card.id);
            return newIds;
        });
    }

    isSelected(card: Card) {
        return this.selectedIds().has(card.id);
    }

    play() {
        if (this.isValid()) {
            this.onPlay.emit(this.selectedCards());
            this.selectedIds.set(new Set()); // Clear selection
        }
    }

    canPlay() {
        return this.isValid();
    }

    pass() {
        this.onPass.emit();
        this.selectedIds.set(new Set());
    }
}
