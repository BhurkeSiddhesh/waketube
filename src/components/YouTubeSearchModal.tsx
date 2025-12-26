import React, { useState, useRef } from 'react';
import { X, Search, ExternalLink, Youtube } from 'lucide-react';

interface YouTubeSearchModalProps {
    onClose: () => void;
    onSelect: (url: string, title: string) => void;
    initialQuery?: string;
}

const YouTubeSearchModal: React.FC<YouTubeSearchModalProps> = ({ onClose, onSelect, initialQuery = '' }) => {
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [hasSearched, setHasSearched] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const getYouTubeSearchUrl = (query: string) => {
        const encodedQuery = encodeURIComponent(query);
        return `https://www.youtube.com/results?search_query=${encodedQuery}`;
    };

    const handleSearch = () => {
        if (!searchQuery.trim()) return;
        setHasSearched(true);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
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
                            <p className="text-xs text-gray-500">Search YouTube and select a video</p>
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
                            disabled={!searchQuery.trim()}
                            className="px-6 py-3.5 bg-primary hover:bg-primary-light text-white font-medium rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-md shadow-primary/20"
                        >
                            Search
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex">
                    {!hasSearched ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-danger/10 flex items-center justify-center mb-5">
                                <Youtube size={32} className="text-danger" />
                            </div>
                            <h3 className="text-lg font-semibold text-body mb-2">Search YouTube</h3>
                            <p className="text-gray-500 max-w-sm mb-6">
                                Find the perfect song or sound to wake up to
                            </p>
                            <div className="text-left text-sm text-gray-500 space-y-2">
                                <p>1. Search for a video above</p>
                                <p>2. Click on a video in the results</p>
                                <p>3. Copy the URL and paste below</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col">
                            <iframe
                                ref={iframeRef}
                                src={getYouTubeSearchUrl(searchQuery)}
                                className="flex-1 w-full border-0"
                                title="YouTube Search"
                                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                            />

                            {/* Manual URL input */}
                            <div className="p-4 border-t border-borderDim">
                                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                    <ExternalLink size={12} />
                                    Found your video? Paste the URL here:
                                </p>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        placeholder="https://www.youtube.com/watch?v=..."
                                        className="flex-1 glass text-body text-sm p-3 rounded-xl border border-borderDim focus:border-primary focus:outline-none placeholder:text-gray-400"
                                        id="youtube-url-input"
                                    />
                                    <button
                                        onClick={() => {
                                            const input = document.getElementById('youtube-url-input') as HTMLInputElement;
                                            if (input?.value) {
                                                const title = searchQuery || 'YouTube Video';
                                                onSelect(input.value, title);
                                            }
                                        }}
                                        className="px-5 py-3 bg-secondary hover:bg-green-600 text-white font-medium rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md shadow-secondary/20"
                                    >
                                        Use This Video
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default YouTubeSearchModal;
