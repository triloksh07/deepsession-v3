// ==========================================
// 1. TIME OF DAY FORMATTERS (e.g., "10:30 AM")
// ==========================================

/**
 * Converts a timestamp, Date, or ISO string to a localized time.
 * @example formatTimeOfDay(1697112000000) -> "10:30 AM"
 */
export const formatTimeOfDay = (
    input: number | string | Date,
    locale = 'en-US',
    options: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true }
): string => {
    if (!input) return '';
    try {
        const date = new Date(input);
        if (isNaN(date.getTime())) return 'Invalid Time';
        return date.toLocaleTimeString(locale, options);
    } catch (error) {
        console.error('Error formatting time of day:', error);
        return 'Invalid Time';
    }
};


// ==========================================
// 2. DATE FORMATTERS (e.g., "Today", "Oct 12")
// ==========================================

/**
 * Converts a date string/timestamp into "Today", "Yesterday", or "Oct 12" / "October 12, 2023"
 * @example formatRelativeDate("2023-10-12", 'short') -> "Oct 12"
 */
export const formatRelativeDate = (
    input: string | number | Date,
    format: 'short' | 'long' = 'short'
): string => {
    if (!input) return '';
    const date = new Date(input);
    if (isNaN(date.getTime())) return 'Invalid Date';

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    const options: Intl.DateTimeFormatOptions = format === 'short' 
        ? { month: 'short', day: 'numeric' } 
        : { year: 'numeric', month: 'long', day: 'numeric' };

    return date.toLocaleDateString('en-US', options);
};

// ==========================================
// 3. DURATION FORMATTERS (e.g., "1h 15m", "01:15:00")
// ==========================================

/**
 * Converts milliseconds into a compact human-readable duration.
 * @example formatDurationCompact(4500000) -> "1h 15m"
 */
export const formatDurationCompact = (milliseconds: number): string => {
    if (!milliseconds || milliseconds < 0) return '0m';
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
};

/**
 * Converts milliseconds into a strict timer format.
 * @example formatDurationTimer(4500000) -> "01:15:00"
 */
export const formatDurationTimer = (milliseconds: number): string => {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const paddedMins = String(minutes).padStart(2, '0');
    const paddedSecs = String(seconds).padStart(2, '0');

    if (hours > 0) {
        return `${String(hours).padStart(2, '0')}:${paddedMins}:${paddedSecs}`;
    }
    return `${paddedMins}:${paddedSecs}`;
};