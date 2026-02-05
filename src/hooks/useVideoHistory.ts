import { useState, useEffect, useCallback } from 'react';
import { SavedVideo } from '../types';

const STORAGE_KEY = 'waketube-video-history';
const MAX_HISTORY_SIZE = 10;

/**
 * Hook for managing YouTube video history with localStorage persistence.
 */
export function useVideoHistory() {
    const [videos, setVideos] = useState<SavedVideo[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    // No longer rely on useEffect for persistence due to unmount race conditions
    // useEffect(() => { ... }, [videos]);

    /**
     * Add a video to history. If it already exists, moves it to the top.
     */
    const addVideo = useCallback((url: string, title: string) => {
        setVideos((prev) => {
            // Remove existing entry with the same URL
            const filtered = prev.filter((v) => v.url !== url);

            // Add new entry at the beginning
            const newVideo: SavedVideo = {
                url,
                title,
                addedAt: Date.now(),
            };

            const updated = [newVideo, ...filtered].slice(0, MAX_HISTORY_SIZE);

            // Persist immediately to handle component unmounting
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            } catch (e) {
                console.error("Failed to save video history", e);
            }

            return updated;
        });
    }, []);

    /**
     * Remove a video from history by URL.
     */
    const removeVideo = useCallback((url: string) => {
        setVideos((prev) => {
            const updated = prev.filter((v) => v.url !== url);
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            } catch (e) {
                console.error("Failed to save video history", e);
            }
            return updated;
        });
    }, []);

    /**
     * Clear all video history.
     */
    const clearHistory = useCallback(() => {
        setVideos([]);
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {
            console.error("Failed to clear video history", e);
        }
    }, []);

    return {
        videos,
        addVideo,
        removeVideo,
        clearHistory,
    };
}
