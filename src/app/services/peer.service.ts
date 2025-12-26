import { Injectable, signal } from '@angular/core';
import Peer, { DataConnection } from 'peerjs';
import { NetworkMessage } from '../models/game.models';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class PeerService {
    private peer: Peer | null = null;

    // Connection Status
    readonly myId = signal<string>('');
    readonly isConnected = signal<boolean>(false);
    readonly connectionError = signal<string | null>(null);

    // Message Stream
    readonly message$ = new Subject<{ connection: DataConnection, message: NetworkMessage }>();
    readonly connection$ = new Subject<DataConnection>();

    constructor() { }

    /**
     * Initialize PeerJS.
     * @param specificId Optional ID to claim (for Room Codes)
     */
    init(specificId?: string): Promise<string> {
        if (this.peer) this.peer.destroy();

        return new Promise((resolve, reject) => {
            // Create Peer
            const options = { debug: 2 };
            this.peer = specificId ? new Peer(specificId, options) : new Peer(options);

            this.peer.on('open', (id) => {
                console.log('[Peer] Open with ID:', id);
                this.myId.set(id);
                this.isConnected.set(true);
                this.connectionError.set(null);
                resolve(id);
            });

            this.peer.on('connection', (conn) => {
                console.log('[Peer] Incoming connection from:', conn.peer);
                this.setupConnection(conn);
                this.connection$.next(conn);
            });

            this.peer.on('error', (err) => {
                console.error('[Peer] Error:', err);
                // "unavailable-id" means room code taken (good for collision check)
                this.connectionError.set(err.type);
                reject(err);
            });

            this.peer.on('disconnected', () => {
                console.log('[Peer] Disconnected from signalling server');
                this.isConnected.set(false);
            });
        });
    }

    connectToPeer(targetId: string): Promise<DataConnection> {
        return new Promise((resolve, reject) => {
            if (!this.peer || !this.isConnected()) {
                reject('Peer not initialized');
                return;
            }

            const conn = this.peer.connect(targetId);

            conn.on('open', () => {
                console.log('[Peer] Connected to Host:', targetId);
                this.setupConnection(conn);
                resolve(conn);
            });

            conn.on('error', (err) => {
                console.error('[Peer] Connection Error:', err);
                reject(err);
            });

            // Timeout safety
            setTimeout(() => {
                if (!conn.open) reject('Connection timeout');
            }, 5000);
        });
    }

    send(conn: DataConnection | undefined, msg: NetworkMessage) {
        if (conn && conn.open) {
            conn.send(msg);
        } else {
            console.warn('[Peer] Cannot send, connection closed', msg);
        }
    }

    private setupConnection(conn: DataConnection) {
        conn.on('data', (data) => {
            // Validate Basic Structure?
            this.message$.next({ connection: conn, message: data as NetworkMessage });
        });

        conn.on('close', () => {
            console.log('[Peer] Connection closed:', conn.peer);
        });
    }
}
