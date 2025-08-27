/**
 * Показывает уведомление.
 * @param {string} message
 * @param {'success'|'error'|'info'|'danger'} [type]
 */
function showNotification(message, type = 'success') {
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        document.body.appendChild(container);
    }
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type}`;
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '10000';
    notification.style.minWidth = '300px';
    notification.style.maxWidth = '500px';
    container.appendChild(notification);
    setTimeout(() => notification.remove(), 4000);
    return notification;
}

/**
 * Обновляет уведомление.
 * @param {HTMLElement} notification
 * @param {string} message
 * @param {'success'|'error'|'info'|'danger'} [type]
 */
function updateNotification(notification, message, type = 'success') {
    if (notification) {
        notification.textContent = message;
        notification.className = `alert alert-${type === 'error' ? 'danger' : type}`;
        setTimeout(() => notification.remove(), 3000);
    }
}
