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

    // Persist to localStorage whenever videos change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(videos));
        } catch {
            // Ignore storage errors (e.g., quota exceeded)
        }
    }, [videos]);

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

            // Cap at MAX_HISTORY_SIZE
            return [newVideo, ...filtered].slice(0, MAX_HISTORY_SIZE);
        });
    }, []);

    /**
     * Remove a video from history by URL.
     */
    const removeVideo = useCallback((url: string) => {
        setVideos((prev) => prev.filter((v) => v.url !== url));
    }, []);

    /**
     * Clear all video history.
     */
    const clearHistory = useCallback(() => {
        setVideos([]);
    }, []);

    return {
        videos,
        addVideo,
        removeVideo,
        clearHistory,
    };
}
