import React from 'react';
import { createRoot } from 'react-dom/client';

let currentToast = null;
let currentTimerId = null;
let toastRoot = null;
let toastIdSeed = 0;

const icons = {
    notification: 'bi bi-bell-fill',
    success: 'bi bi-check-circle-fill',
    info: 'bi bi-info-circle-fill',
    warning: 'bi bi-exclamation-circle-fill',
    error: 'bi bi-exclamation-circle-fill',
};

function getToastHost() {
    return document.getElementById('toast');
}

function ensureToastRoot() {
    const host = getToastHost();
    if (!host) {
        return null;
    }

    if (!toastRoot) {
        toastRoot = createRoot(host);
    }

    return toastRoot;
}

function renderToasts() {
    const root = ensureToastRoot();
    if (!root) {
        return;
    }

    root.render(
        React.createElement(
            React.Fragment,
            null,
            currentToast
                ? React.createElement(ToastItem, {
                    key: currentToast.id,
                    item: currentToast,
                    onClose: removeToast,
                })
                : null
        )
    );
}

function removeToast(id) {
    if (!currentToast || currentToast.id !== id) {
        return;
    }

    currentToast = null;
    if (currentTimerId) {
        clearTimeout(currentTimerId);
        currentTimerId = null;
    }
    renderToasts();
}

function ToastItem({ item, onClose }) {
    const { id, title, message, type, duration } = item;
    const delay = (duration / 1000).toFixed(2);
    const icon = icons[type] || icons.info;

    return React.createElement(
        'div',
        {
            className: `toast toast--${type}`,
            style: {
                animation: `slideInleft ease 0.3s, fadeOut 1.5s ${delay}s forwards`,
            },
        },
        React.createElement(
            'div',
            { className: 'toast__icon' },
            React.createElement('i', { className: icon })
        ),
        React.createElement(
            'div',
            { className: 'toast__body' },
            React.createElement('h3', { className: 'toast__title' }, String(title ?? '')),
            React.createElement('p', { className: 'toast__msg' }, String(message ?? ''))
        ),
        React.createElement(
            'button',
            {
                type: 'button',
                className: 'toast__close',
                onClick: () => onClose(id),
                'aria-label': 'Đóng thông báo',
            },
            React.createElement('i', { className: 'bi bi-x-lg' })
        )
    );
}

// Toast function
export function toast({
    title = ' ',
    message = ' ',
    type = 'info',
    duration = 3000,
}) {
    const safeType = icons[type] ? type : 'info';
    if (currentTimerId) {
        clearTimeout(currentTimerId);
        currentTimerId = null;
    }

    currentToast = {
        id: ++toastIdSeed,
        title,
        message,
        type: safeType,
        duration,
    };

    renderToasts();

    currentTimerId = setTimeout(() => {
        removeToast(currentToast?.id);
    }, duration + 1500);
}

export function showNotificationToast(message) {
    toast({
        title: 'Thông báo',
        message: message,
        type: 'notification',
        duration: 3000,
    });
}
