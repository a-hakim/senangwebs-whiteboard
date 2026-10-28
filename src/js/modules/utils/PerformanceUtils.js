/**
 * Performance utility classes for handling large number of elements
 */
export class PerformanceUtils {
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    static debounce(func, delay) {
        let timeoutId;
        const debounced = function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
        debounced.cancel = () => clearTimeout(timeoutId);
        return debounced;
    }
    
    static requestAnimationFrame(func) {
        return window.requestAnimationFrame(func);
    }
}
