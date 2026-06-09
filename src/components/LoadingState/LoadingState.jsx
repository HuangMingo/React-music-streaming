import './LoadingState.css';

export function LoadingState({ message = 'Đang tải dữ liệu...' }) {
    return (
        <div className="loading-state" role="status" aria-live="polite">
            <div className="loading-state__spinner" aria-hidden="true" />
            <p className="loading-state__message">{message}</p>
        </div>
    );
}
