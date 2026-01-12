import { db, PendingRequest } from './db';
import { toast } from 'sonner';
import { apiClient } from '@/integrations/api/client';
import { useEffect, useState } from 'react';
import { queryClient } from '@/lib/queryClient';

class OfflineManager {
    private isSyncing = false;
    private listeners: ((count: number) => void)[] = [];

    constructor() {
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => {
                console.log('App is online. Starting sync...');
                this.sync();
            });

            // Periodic check or initial check
            setTimeout(() => this.sync(), 2000);
        }
    }

    subscribe(listener: (count: number) => void) {
        this.listeners.push(listener);
        this.getPendingCount().then(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notifyListeners() {
        this.getPendingCount().then(count => {
            this.listeners.forEach(l => l(count));
        });
    }

    async getPendingCount() {
        return await db.pendingRequests.count();
    }

    async queueRequest(config: any) {
        let { url, method, data, headers } = config;

        // We only queue state-changing requests
        if (['post', 'put', 'patch', 'delete'].includes(method.toLowerCase())) {
            try {
                let serializedData = data;
                let isFormData = false;

                if (data instanceof FormData) {
                    isFormData = true;
                    serializedData = await this.serializeFormData(data);
                }

                await db.pendingRequests.add({
                    url,
                    method: method.toUpperCase(),
                    data: { content: serializedData, isFormData },
                    headers: this.sanitizeHeaders(headers),
                    timestamp: Date.now(),
                });
                this.notifyListeners();
            } catch (error) {
                console.error('Failed to queue request:', error);
            }
        }
    }

    private async serializeFormData(formData: FormData) {
        const object: Record<string, any> = {};
        const entries = Array.from(formData.entries());

        for (const [key, value] of entries) {
            if (value instanceof File) {
                // Convert File to Blob and store its metadata
                object[key] = {
                    _type: 'file',
                    name: value.name,
                    type: value.type,
                    data: value // Dexie can store Blobs/Files
                };
            } else {
                object[key] = value;
            }
        }
        return object;
    }

    private deserializeFormData(serializedData: any) {
        const formData = new FormData();
        for (const key in serializedData) {
            const value = serializedData[key];
            if (value && typeof value === 'object' && value._type === 'file') {
                formData.append(key, value.data, value.name);
            } else {
                formData.append(key, value);
            }
        }
        return formData;
    }

    private sanitizeHeaders(headers: any) {
        const clean: Record<string, string> = {};
        const sensitive = ['common', 'delete', 'get', 'head', 'post', 'put', 'patch', 'Authorization'];

        // We keep Authorization if it exists, because we need it for re-sync
        // But axios might have nested headers we want to avoid
        for (const key in headers) {
            if (!sensitive.includes(key.toLowerCase()) || key === 'Authorization') {
                if (typeof headers[key] === 'string') {
                    clean[key] = headers[key];
                }
            }
        }
        return clean;
    }

    async sync() {
        if (this.isSyncing) return;
        if (typeof navigator !== 'undefined' && !navigator.onLine) return;

        const count = await db.pendingRequests.count();
        if (count === 0) return;

        this.isSyncing = true;
        const toastId = toast.loading(`Đang đồng bộ ${count} thay đổi...`);

        const requests = await db.pendingRequests.orderBy('timestamp').toArray();
        let successCount = 0;

        for (const req of requests) {
            try {
                let actualData = req.data;
                if (req.data && typeof req.data === 'object' && req.data.isFormData) {
                    actualData = this.deserializeFormData(req.data.content);
                } else if (req.data && typeof req.data === 'object' && 'content' in req.data) {
                    actualData = req.data.content;
                }

                await apiClient({
                    url: req.url,
                    method: req.method,
                    data: actualData,
                    headers: req.headers,
                });
                await db.pendingRequests.delete(req.id!);
                successCount++;
                this.notifyListeners();
            } catch (error: any) {
                console.error(`Failed to sync request ${req.id}:`, error);
                // If it's a network error again, stop syncing
                if (!error.response) {
                    break;
                }
                // If it's a server error (4xx/5xx), we might want to skip or keep?
                // For 4xx (except 401/403), it's likely a bad request, so we should probably delete to avoid stuck queue
                if (error.response?.status >= 400 && error.response?.status < 500 && ![401, 403].includes(error.response.status)) {
                    await db.pendingRequests.delete(req.id!);
                    this.notifyListeners();
                } else {
                    // Server error or auth error, stop and retry later
                    break;
                }
            }
        }

        this.isSyncing = false;
        toast.dismiss(toastId);

        if (successCount > 0) {
            toast.success(`Đã đồng bộ thành công ${successCount} thay đổi.`);
            // Optional: reload or invalidate queries
            queryClient.invalidateQueries();
        }
    }
}

export const offlineManager = new OfflineManager();

export const useOfflineStatus = () => {
    const [pendingCount, setPendingCount] = useState(0);
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        const unsubscribe = offlineManager.subscribe(setPendingCount);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            unsubscribe();
        };
    }, []);

    return { isOnline, pendingCount };
};
