/**
 * Notification System
 * 
 * Handles toast notifications for user feedback
 */

export const NotificationsMixin = {
    /**
     * Show a notification message
     * @param {string} message - Notification message text
     * @param {string} type - Notification type ('info', 'copy', 'paste', 'warning')
     * @param {number} duration - Display duration in milliseconds
     */
    showNotification(message, type = 'info', duration = 2000) {
        // Remove any existing notifications
        const existingNotification = this.container.querySelector('.sww-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `sww-notification sww-notification-${type}`;
        notification.textContent = message;
        
        // Add notification styles
        Object.assign(notification.style, {
            position: 'absolute',
            top: '20px',
            right: '20px',
            padding: '12px 16px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: '10000',
            pointerEvents: 'none',
            transform: 'translateY(-10px)',
            opacity: '0',
            transition: 'all 0.3s ease',
            maxWidth: '300px',
            wordWrap: 'break-word'
        });
        
        // Set colors based on type
        switch (type) {
            case 'copy':
                notification.style.backgroundColor = '#e3f2fd';
                notification.style.color = '#1976d2';
                notification.style.border = '1px solid #bbdefb';
                break;
            case 'paste':
                notification.style.backgroundColor = '#e8f5e8';
                notification.style.color = '#2e7d32';
                notification.style.border = '1px solid #c8e6c9';
                break;
            case 'warning':
                notification.style.backgroundColor = '#fff3e0';
                notification.style.color = '#f57c00';
                notification.style.border = '1px solid #ffcc02';
                break;
            default:
                notification.style.backgroundColor = '#f5f5f5';
                notification.style.color = '#333';
                notification.style.border = '1px solid #ddd';
        }
        
        // Add to container
        this.container.appendChild(notification);
        
        // Animate in
        requestAnimationFrame(() => {
            notification.style.transform = 'translateY(0)';
            notification.style.opacity = '1';
        });
        
        // Auto remove after duration
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.transform = 'translateY(-10px)';
                notification.style.opacity = '0';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, duration);
    }
};
