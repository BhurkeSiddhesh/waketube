import React, { useState, useEffect } from 'react';
import { X, Search, ExternalLink, Youtube, Loader2, Play, CheckCircle2, AlertCircle } from 'lucide-react';
import { searchYouTubeVideos } from '../services/geminiService';

interface YouTubeSearchModalProps {
    onClose: () => void;
    onSelect: (url: string, title: string) => void;
    initialQuery?: string;
}

interface VideoResult {
    url: string;
    title: string;
}

const YouTubeSearchModal: React.FC<YouTubeSearchModalProps> = ({ onClose, onSelect, initialQuery = '' }) => {
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [results, setResults] = useState<VideoResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsLoading(true);
        setHasSearched(true);
        setError(null);

        try {
            const searchResults = await searchYouTubeVideos(searchQuery);
            if (searchResults.length === 0) {
                setError("No videos found. Please try a different search term or check your API key.");
            }
            setResults(searchResults);
        } catch (err) {
            setError("Failed to fetch videos. Please check your connection or API key.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const getThumbnailUrl = (url: string) => {
        const videoIdMatch = url.match(/(?:\?v=|\/embed\/|\/watch\?v=|\/v\/|youtu\.be\/|watch\?.*v=)([^#\&\?]*).*/);
        const videoId = videoIdMatch && videoIdMatch[1];
        return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="glass-strong w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-borderDim">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-danger flex items-center justify-center">
                            <Youtube size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-body">Find Your Wake-Up Song</h2>
                            <p className="text-xs text-gray-500">Fast, in-app search powered by Gemini</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-body hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b border-borderDim">
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder="Search for music, artists, or sounds..."
                                className="w-full glass text-body text-sm p-3.5 pl-11 rounded-xl border border-borderDim focus:border-primary focus:outline-none placeholder:text-gray-400"
                                autoFocus
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            disabled={isLoading || !searchQuery.trim()}
                            className="px-6 py-3.5 bg-primary hover:bg-primary-light text-white font-medium rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-md shadow-primary/20 flex items-center gap-2"
                        >
                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                            Search
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {!hasSearched ? (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                            <div className="w-20 h-20 rounded-3xl bg-danger/10 flex items-center justify-center mb-6">
                                <Youtube size={40} className="text-danger" />
                            </div>
                            <h3 className="text-xl font-bold text-body mb-2">Ready to Search</h3>
                            <p className="text-gray-500 max-w-sm mb-8">
                                Enter a song name or artist above to find the perfect alarm sound.
                            </p>
                            <div className="flex flex-wrap justify-center gap-2 max-w-md">
                                {['Lofi Beats', 'Ocean Waves', 'Morning Jazz', 'Nature Sounds'].map(suggestion => (
                                    <button
                                        key={suggestion}
                                        onClick={() => { setSearchQuery(suggestion); handleSearch(); }}
                                        className="text-xs px-4 py-2 rounded-full glass border border-borderDim hover:border-primary/40 hover:text-primary transition-all"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                            <div className="relative mb-6">
                                <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                                <Youtube size={24} className="absolute inset-0 m-auto text-primary animate-pulse" />
                            </div>
                            <h3 className="text-lg font-semibold text-body mb-2">Gemini is Searching...</h3>
                            <p className="text-gray-500 max-w-xs animate-pulse">
                                Finding the best YouTube videos for your morning.
                            </p>
                        </div>
                    ) : error ? (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-5 text-orange-500">
                                <AlertCircle size={32} />
                            </div>
                            <h3 className="text-lg font-semibold text-body mb-2">Search Issue</h3>
                            <p className="text-gray-500 max-w-sm mb-6">{error}</p>
                            <button
                                onClick={handleSearch}
                                className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-body font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {results.map((video, idx) => (
                                <div
                                    key={idx}
                                    className="group glass rounded-2xl overflow-hidden border border-borderDim hover:border-primary/50 transition-all flex flex-col shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
                                >
                                    <div className="aspect-video relative overflow-hidden bg-gray-100 dark:bg-gray-900">
                                        {getThumbnailUrl(video.url) ? (
                                            <img
                                                src={getThumbnailUrl(video.url)!}
                                                alt={video.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Youtube size={32} className="text-gray-300" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <a
                                                href={video.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-colors"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Play size={24} fill="currentColor" />
                                            </a>
                                        </div>
                                    </div>
                                    <div className="p-4 flex-1 flex flex-col">
                                        <h4 className="font-semibold text-sm text-body line-clamp-2 mb-4 group-hover:text-primary transition-colors">
                                            {video.title}
                                        </h4>
                                        <div className="mt-auto flex items-center justify-between gap-3">
                                            <a
                                                href={video.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[10px] text-gray-400 hover:text-primary flex items-center gap-1 transition-colors"
                                            >
                                                <ExternalLink size={10} />
                                                View on YT
                                            </a>
                                            <button
                                                onClick={() => onSelect(video.url, video.title)}
                                                className="px-4 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5"
                                            >
                                                <CheckCircle2 size={14} />
                                                Select
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Fallback */}
                {hasSearched && !isLoading && (
                    <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-900/50 border-t border-borderDim flex items-center justify-between">
                        <p className="text-xs text-gray-500">Not finding what you want?</p>
                        <a
                            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                        >
                            Open search on YouTube <ExternalLink size={12} />
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default YouTubeSearchModal;
