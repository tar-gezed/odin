import { Routes } from '@angular/router';
import { LobbyComponent } from './features/lobby/lobby.component';
import { BoardComponent } from './features/board/board.component';

export const routes: Routes = [
    { path: '', component: LobbyComponent },
    { path: 'board', component: BoardComponent },
    { path: '**', redirectTo: '' }
];
