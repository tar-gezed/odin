import { Component, inject, computed, signal, output, input } from '@angular/core';
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
        <div class="info" *ngIf="!isPickingUp()">
           Selected: {{ selectedCards().length }} 
           <span *ngIf="validationMessage()" class="error">({{ validationMessage() }})</span>
        </div>
        <div class="info" *ngIf="isPickingUp()">
           Select a card from the center...
        </div>

        <div class="actions">
          <button *ngIf="!isPickingUp()" (click)="play()" [disabled]="!canPlay()">PLAY</button>
          <button (click)="pass()" class="pass">
            {{ isPickingUp() ? 'CANCEL' : 'PASS' }}
          </button>
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
      gap: 10px;
      z-index: 100;
      pointer-events: none; /* Let clicks pass through around controls */
    }
    .cards-list {
      display: flex;
      gap: -40px; /* Stronger overlap for fan effect */
      padding: 10px;
      pointer-events: auto;
      perspective: 1000px;
    }
    .cards-list:hover {
        gap: -10px; /* Expand on hover */
        transition: gap 0.3s ease;
    }

    .controls {
      pointer-events: auto;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(10px);
      padding: 10px 30px;
      border-radius: 50px;
      display: flex;
      gap: 20px;
      align-items: center;
      color: var(--color-text-main);
      box-shadow: 0 10px 20px rgba(0,0,0,0.1);
      border: 1px solid rgba(255,255,255,0.5);
    }
    button {
      padding: 10px 24px;
      border-radius: 20px;
      border: none;
      font-weight: 800;
      cursor: pointer;
      background: var(--color-viking-orange);
      color: white;
      text-transform: uppercase;
      letter-spacing: 1px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(0,0,0,0.15);
    }
    button:disabled { background: #cbd5e1; cursor: not-allowed; box-shadow: none; transform: none; }
    button.pass { background: #ef4444; }
    .error { color: #ef4444; font-size: 0.9rem; margin-left: 10px; font-weight: bold; }
  `]
})
export class HandComponent {
  state = inject(GameStateService);
  peer = inject(PeerService);

  isPickingUp = input<boolean>(false);

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
    // If picking up, maybe we shouldn't select cards from hand? 
    // Actually normally you are done playing from hand when picking up.
    // So we can probably block selection if isPickingUp().
    if (this.isPickingUp()) return;

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
