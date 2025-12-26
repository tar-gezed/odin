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
        <span class="corner top-left">{{ card().value }}</span>
        <div class="center-content">
           <span class="big-number">{{ card().value }}</span>
        </div>
        <span class="corner bottom-right">{{ card().value }}</span>
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
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }
    .card.selected {
      transform: translateY(-20px);
      box-shadow: 0 5px 15px rgba(0,0,0,0.4);
      border: 3px solid gold;
    }
    .card-inner {
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 5px;
      color: white;
      font-weight: bold;
      text-shadow: 1px 1px 0 rgba(0,0,0,0.5);
    }
    .corner { font-size: 1.2rem; }
    .center-content { display: flex; justify-content: center; align-items: center; flex: 1; }
    .big-number { font-size: 3rem; }

    /* Colors */
    .red { background: linear-gradient(135deg, #ef4444, #b91c1c); }
    .blue { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
    .green { background: linear-gradient(135deg, #22c55e, #15803d); }
    .yellow { background: linear-gradient(135deg, #eab308, #a16207); }
    .purple { background: linear-gradient(135deg, #a855f7, #7e22ce); }
    .orange { background: linear-gradient(135deg, #f97316, #c2410c); }
  `]
})
export class CardComponent {
    card = input.required<Card>();
    selected = input<boolean>(false);

    colorClass = computed(() => this.card().color.toLowerCase());
}
