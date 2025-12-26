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
      background: linear-gradient(135deg, var(--color-ice-white) 0%, var(--color-ice-dark) 100%);
      color: var(--color-text-main);
    }
    h1 { 
        font-size: 6rem; 
        margin-bottom: 20px; 
        color: var(--color-viking-red);
        font-family: var(--font-display, sans-serif);
        text-shadow: 4px 4px 0 rgba(255,255,255,0.4);
        letter-spacing: 5px;
        margin-top: 0;
    }
    .panel {
      background: rgba(255, 255, 255, 0.45);
      backdrop-filter: blur(15px);
      padding: 50px;
      border-radius: 30px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.05);
      border: 1px solid rgba(255,255,255,0.6);
      width: 350px;
    }
    label { font-weight: bold; margin-bottom: -10px; color: var(--color-text-main); }
    input {
      padding: 15px;
      border-radius: 12px;
      border: 2px solid transparent;
      background: rgba(255,255,255,0.8);
      font-size: 1rem;
      outline: none;
      transition: border 0.3s;
      font-weight: bold;
      color: var(--color-text-main);
    }
    input:focus {
        border-color: var(--color-viking-orange);
        background: white;
    }
    button {
      padding: 15px 30px;
      border-radius: 12px;
      border: none;
      background: var(--color-viking-orange);
      color: white;
      font-weight: 800;
      cursor: pointer;
      font-size: 1rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }
    button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 15px rgba(0,0,0,0.15);
    }
    .actions { display: flex; flex-direction: column; gap: 20px; margin-top: 10px; }
    .join-area { 
        display: flex; 
        gap: 10px; 
        margin-top: 10px; 
        border-top: 1px solid rgba(0,0,0,0.05); 
        padding-top: 20px; 
        width: 100%; /* Ensure full width */
    }
    .join-area input { 
        flex: 1; 
        min-width: 0; /* Prevent input from forcing overflow */
        text-align: center; 
        letter-spacing: 2px; 
    }
    .join-area button {
        padding: 15px 20px; /* Reduced side padding slightly */
    }
    .error { 
        color: var(--color-viking-red); 
        font-weight: bold; 
        text-align: center; 
        background: rgba(217, 79, 48, 0.1);
        padding: 10px;
        border-radius: 8px;
    }
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
