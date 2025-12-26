import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-language-switcher',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="lang-switcher">
      <button 
        [class.active]="currentLang === 'en'" 
        (click)="switchLang('en')">
        🇬🇧 EN
      </button>
      <button 
        [class.active]="currentLang === 'fr'" 
        (click)="switchLang('fr')">
        🇫🇷 FR
      </button>
    </div>
  `,
    styles: [`
    .lang-switcher {
      display: flex;
      gap: 5px;
      background: rgba(255, 255, 255, 0.2);
      padding: 4px;
      border-radius: 20px;
      backdrop-filter: blur(5px);
    }
    button {
      background: transparent;
      border: none;
      padding: 5px 10px;
      border-radius: 15px;
      cursor: pointer;
      font-weight: bold;
      color: var(--color-text-main, #333);
      transition: all 0.2s;
      font-size: 0.9rem;
      opacity: 0.7;
    }
    button:hover {
        opacity: 1;
        background: rgba(255,255,255,0.3);
    }
    button.active {
      background: white;
      color: black;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      opacity: 1;
    }
  `]
})
export class LanguageSwitcherComponent {
    translate = inject(TranslateService);

    get currentLang() {
        return this.translate.currentLang;
    }

    switchLang(lang: string) {
        this.translate.use(lang);
    }
}
