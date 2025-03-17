// lib/utils/index.ts

/**
 * Validates a string to ensure it's in UUID format.
 * Format: 8-4-4-4-12 hexadecimal digits
 */
export function isValidUUID(uuid: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
  }
  
  /**
   * Formats a date for display
   */
  export function formatDate(date: Date | string): string {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  /**
   * Truncates text to a specified length with ellipsis
   */
  export function truncateText(text: string, maxLength: number = 100): string {
    if (!text || text.length <= maxLength) return text || '';
    return text.substring(0, maxLength) + '...';
  }
  
  /**
   * Calculates time elapsed since a given date
   */
  export function timeAgo(date: Date | string): string {
    const now = new Date();
    const past = typeof date === 'string' ? new Date(date) : date;
    
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;
    
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
    
    const years = Math.floor(months / 12);
    return `${years} year${years !== 1 ? 's' : ''} ago`;
  }
  
  /**
   * Safely attempts to parse JSON, returning null if parsing fails
   */
  export function safeJsonParse<T>(jsonString: string): T | null {
    try {
      return JSON.parse(jsonString) as T;
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return null;
    }
  }
  
  /**
   * Format a number with commas
   */
  export function formatNumber(num: number): string {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  
  /**
   * Validates an email address
   */
  export function isValidEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }
  
  /**
   * Creates a debounced function that delays invoking the provided function
   */
  export function debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;
    
    return function(...args: Parameters<T>): void {
      const later = () => {
        timeout = null;
        func(...args);
      };
      
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(later, wait);
    };
  }