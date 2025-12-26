import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card } from '../../../models/game.models';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card" 
         [class]="colorClass()" 
         [class.selected]="selected()">
      <div class="card-inner">
        <div class="center-content">
           <span class="big-number">{{ card().value }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      width: 80px;
      height: 120px;
      border-radius: 10px;
      background: white;
      position: relative;
      cursor: pointer;
      user-select: none;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      font-family: var(--font-display, sans-serif);
      border: 2px solid white;
    }
    .card.selected {
      transform: translateY(-20px) scale(1.05);
      box-shadow: 0 10px 20px rgba(0,0,0,0.2);
      border: 3px solid var(--color-viking-orange);
      z-index: 100;
    }
    .card-inner {
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 5px;
      color: white;
      text-shadow: 0 2px 0 rgba(0,0,0,0.2);
    }
    .center-content { display: flex; justify-content: center; align-items: center; flex: 1; }
    .big-number { 
        font-size: 4rem; 
        font-weight: 400; /* Font itself is bold probably */
        font-family: var(--font-display, sans-serif);
    }

    /* Colors - More vibrant */
    .red { background: linear-gradient(135deg, #ef4444, #991b1b); }
    .blue { background: linear-gradient(135deg, #3b82f6, #1e40af); }
    .green { background: linear-gradient(135deg, #22c55e, #166534); }
    .yellow { background: linear-gradient(135deg, #eab308, #854d0e); }
    .purple { background: linear-gradient(135deg, #a855f7, #6b21a8); }
    .orange { background: linear-gradient(135deg, #f97316, #9a3412); }
  `]
})
export class CardComponent {
  card = input.required<Card>();
  selected = input<boolean>(false);

  colorClass = computed(() => this.card().color.toLowerCase());
}
