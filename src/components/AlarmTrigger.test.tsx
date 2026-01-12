import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AlarmTrigger from './AlarmTrigger';
import { Alarm, DayOfWeek } from '../types';

const mockAlarm: Alarm = {
    id: 'test-alarm-1',
    time: '07:30',
    days: [DayOfWeek.Monday],
    enabled: true,
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    label: 'Wake Up Song',
};

describe('AlarmTrigger', () => {
    const onDismiss = vi.fn();
    let mockPlayerInstance: any;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers({ shouldAdvanceTime: true });

        mockPlayerInstance = {
            playVideo: vi.fn(),
            setVolume: vi.fn(),
            destroy: vi.fn(),
        };

        (window as any).YT = {
            Player: vi.fn().mockImplementation((container, opts) => {
                if (opts.events?.onReady) {
                    Promise.resolve().then(() => {
                        opts.events.onReady({ target: mockPlayerInstance });
                    });
                }
                return mockPlayerInstance;
            }),
        };
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('rendering', () => {
        it('renders WAKE UP! heading', () => {
            render(<AlarmTrigger alarm={mockAlarm} onDismiss={onDismiss} />);
            expect(screen.getByText('WAKE UP!')).toBeInTheDocument();
        });

        it('renders alarm label', () => {
            render(<AlarmTrigger alarm={mockAlarm} onDismiss={onDismiss} />);
            expect(screen.getByText('Wake Up Song')).toBeInTheDocument();
        });

        it('renders volume slider', () => {
            render(<AlarmTrigger alarm={mockAlarm} onDismiss={onDismiss} />);
            const slider = screen.getByRole('slider');
            expect(slider).toBeInTheDocument();
            expect(slider).toHaveAttribute('min', '0');
            expect(slider).toHaveAttribute('max', '1');
        });

        it('renders NO SNOOZE warning', () => {
            render(<AlarmTrigger alarm={mockAlarm} onDismiss={onDismiss} />);
            expect(screen.getByText('NO SNOOZE AVAILABLE')).toBeInTheDocument();
        });

        it('shows 100% volume initially', () => {
            render(<AlarmTrigger alarm={mockAlarm} onDismiss={onDismiss} />);
            expect(screen.getByText('100%')).toBeInTheDocument();
        });
    });

    describe('dismiss button', () => {
        it('shows locked state initially', () => {
            render(<AlarmTrigger alarm={mockAlarm} onDismiss={onDismiss} />);
            expect(screen.getByText('Locked')).toBeInTheDocument();
            expect(screen.queryByText('Dismiss')).not.toBeInTheDocument();
        });

        it('shows dismiss button after delay', async () => {
            render(<AlarmTrigger alarm={mockAlarm} onDismiss={onDismiss} />);

            act(() => {
                vi.advanceTimersByTime(2500);
            });

            await waitFor(() => {
                expect(screen.getByText('Dismiss')).toBeInTheDocument();
            });
        });

        it('calls onDismiss when dismiss button is clicked', async () => {
            render(<AlarmTrigger alarm={mockAlarm} onDismiss={onDismiss} />);

            act(() => {
                vi.advanceTimersByTime(2500);
            });

            await waitFor(() => {
                expect(screen.getByText('Dismiss')).toBeInTheDocument();
            });

            const dismissBtn = screen.getByText('Dismiss').closest('button');
            if (dismissBtn) {
                await userEvent.click(dismissBtn);
                expect(onDismiss).toHaveBeenCalled();
            }
        });
    });

    describe('YouTube player initialization', () => {
        it('creates YouTube player when API is already loaded', () => {
            render(<AlarmTrigger alarm={mockAlarm} onDismiss={onDismiss} />);
            expect((window as any).YT.Player).toHaveBeenCalled();
        });

        it('loads API script if not present', async () => {
            // Remove mock API
            const originalYT = (window as any).YT;
            delete (window as any).YT;

            render(<AlarmTrigger alarm={mockAlarm} onDismiss={onDismiss} />);

            // Check if script tag was added
            const scripts = document.head.getElementsByTagName('script'); // AlarmTrigger appends to head or before first script?
            // Code uses: firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
            // In JSDOM, we can check document.getElementsByTagName('script')
            const scriptTags = document.getElementsByTagName('script');
            const ytScript = Array.from(scriptTags).find(s => s.src === 'https://www.youtube.com/iframe_api');
            expect(ytScript).toBeDefined();

            // Simulate API ready
            (window as any).YT = originalYT;
            act(() => {
                if ((window as any).onYouTubeIframeAPIReady) {
                    (window as any).onYouTubeIframeAPIReady();
                }
            });

            expect((window as any).YT.Player).toHaveBeenCalled();
        });

        it('injects API script before existing script', () => {
            // Remove mock API
            const originalYT = (window as any).YT;
            delete (window as any).YT;

            // Add dummy script
            const dummyScript = document.createElement('script');
            document.body.appendChild(dummyScript);

            render(<AlarmTrigger alarm={mockAlarm} onDismiss={onDismiss} />);

            const scriptTags = document.getElementsByTagName('script');
            const ytScript = Array.from(scriptTags).find(s => s.src === 'https://www.youtube.com/iframe_api');
            expect(ytScript).toBeDefined();

            // Cleanup
            document.body.removeChild(dummyScript);
            (window as any).YT = originalYT;
        });

        it('handles YouTube player errors', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            render(<AlarmTrigger alarm={mockAlarm} onDismiss={() => { }} />);

            // Access the player configuration passed to the constructor
            const playerConfig = (window as any).YT.Player.mock.calls[0][1];

            // Simulate error
            playerConfig.events.onError({ data: 101 });

            expect(consoleSpy).toHaveBeenCalledWith('YouTube player error:', 101);
            consoleSpy.mockRestore();
        });

        it('extracts correct video ID from standard URL', () => {
            render(<AlarmTrigger alarm={mockAlarm} onDismiss={onDismiss} />);

            expect((window as any).YT.Player).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    videoId: 'dQw4w9WgXcQ',
                })
            );
        });

        it('extracts video ID from youtu.be URL', () => {
            const shortUrlAlarm = { ...mockAlarm, videoUrl: 'https://youtu.be/abc12345678' };
            render(<AlarmTrigger alarm={shortUrlAlarm} onDismiss={onDismiss} />);

            expect((window as any).YT.Player).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    videoId: 'abc12345678',
                })
            );
        });

        it('uses default video ID for invalid URL', () => {
            const invalidUrlAlarm = { ...mockAlarm, videoUrl: 'not-a-url' };
            render(<AlarmTrigger alarm={invalidUrlAlarm} onDismiss={onDismiss} />);

            expect((window as any).YT.Player).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    videoId: '7GlsxNI4LVI',
                })
            );
        });

        it('uses default video ID for empty URL', () => {
            const emptyUrlAlarm = { ...mockAlarm, videoUrl: '' };
            render(<AlarmTrigger alarm={emptyUrlAlarm} onDismiss={onDismiss} />);

            expect((window as any).YT.Player).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    videoId: '7GlsxNI4LVI',
                })
            );
        });

        it('configures player with autoplay', () => {
            render(<AlarmTrigger alarm={mockAlarm} onDismiss={onDismiss} />);

            expect((window as any).YT.Player).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    playerVars: expect.objectContaining({
                        autoplay: 1,
                        loop: 1,
                    }),
                })
            );
        });
    });
});

describe('getYouTubeVideoId extraction', () => {
    const onDismiss = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (window as any).YT = {
            Player: vi.fn().mockImplementation(() => ({
                playVideo: vi.fn(),
                setVolume: vi.fn(),
                destroy: vi.fn(),
            })),
        };
    });

    const testCases = [
        { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
        { url: 'https://youtu.be/dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
        { url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
        { url: 'https://youtube.com/v/dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
    ];

    testCases.forEach(({ url, expected }) => {
        it(`extracts "${expected}" from "${url}"`, () => {
            const alarm = { ...mockAlarm, videoUrl: url };
            render(<AlarmTrigger alarm={alarm} onDismiss={onDismiss} />);

            expect((window as any).YT.Player).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    videoId: expected,
                })
            );
        });
    });
});
