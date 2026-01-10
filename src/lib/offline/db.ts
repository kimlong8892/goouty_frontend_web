import Dexie, { Table } from 'dexie';

export interface PendingRequest {
    id?: number;
    url: string;
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    data: any;
    headers: Record<string, string>;
    timestamp: number;
}

export class OfflineDatabase extends Dexie {
    pendingRequests!: Table<PendingRequest>;

    constructor() {
        super('OfflineDB');
        this.version(1).stores({
            pendingRequests: '++id, url, timestamp' // Primary key and indexed props
        });
    }
}

export const db = new OfflineDatabase();
