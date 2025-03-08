
import { useState, useEffect } from 'react';

/**
 * A custom hook for debouncing a value
 * @param {any} value - The value to be debounced
 * @param {number} delay - The delay in milliseconds
 * @returns {any} - The debounced value
 */
function useDebounce(value, delay = 300) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        // Set a timeout to update the debounced value after the specified delay
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Clean up the timeout if the value changes before the delay has passed
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]); // Re-run the effect if value or delay changes

    return debouncedValue;
}

export default useDebounce;