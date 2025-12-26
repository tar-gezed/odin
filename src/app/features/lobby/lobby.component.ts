import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GameEngineService } from '../../services/game-engine.service';

@Component({
    selector: 'app-lobby',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="lobby-container">
      <h1>ODIN</h1>
      
      <div class="panel">
        <label>Pseudo</label>
        <input [(ngModel)]="username" placeholder="Votre nom" />
        
        <div class="actions">
           <button (click)="create()">CRÉER</button>
           <div class="join-area">
             <input [(ngModel)]="code" placeholder="Code (4 chiffres)" maxlength="4" />
             <button (click)="join()">REJOINDRE</button>
           </div>
        </div>
        
        <div class="error" *ngIf="error()">{{ error() }}</div>
      </div>
    </div>
  `,
    styles: [`
    .lobby-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: #1e293b;
      color: white;
      font-family: sans-serif;
    }
    h1 { font-size: 4rem; margin-bottom: 40px; }
    .panel {
      background: rgba(255,255,255,0.1);
      padding: 40px;
      border-radius: 20px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    input {
      padding: 10px;
      border-radius: 8px;
      border: none;
    }
    button {
      padding: 10px 20px;
      border-radius: 8px;
      border: none;
      background: #f59e0b;
      font-weight: bold;
      cursor: pointer;
    }
    .join-area { display: flex; gap: 10px; margin-top: 20px; border-top: 1px solid #ffffff33; padding-top: 20px; }
    .error { color: #f87171; font-weight: bold; }
  `]
})
export class LobbyComponent {
    engine = inject(GameEngineService);
    router = inject(Router);

    username = 'Player';
    code = '';
    error = signal('');

    async create() {
        this.error.set('Création...');
        try {
            await this.engine.createGame(this.username);
            this.router.navigate(['/board']);
        } catch (e: any) {
            this.error.set(e.message || e);
        }
    }

    async join() {
        if (this.code.length !== 4) {
            this.error.set('Code invalide (4 chiffres)');
            return;
        }
        this.error.set('Connexion...');
        try {
            await this.engine.joinGame(this.code, this.username);
            this.router.navigate(['/board']);
        } catch (e: any) {
            this.error.set('Erreur: ' + (e.message || 'Hôte introuvable'));
        }
    }
}
