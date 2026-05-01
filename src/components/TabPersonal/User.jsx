import { useAuthContext } from '../../context/AuthContext';

export function User() {
    const { currentUser, isAuthenticated } = useAuthContext();

    const displayName = isAuthenticated ? currentUser?.username : 'Khach';
    const avatar = currentUser?.avatar || '../../assets/img/avatars/avatar.jpg';

    return (
        <>
            <div className="app__header">
                <div
                    className="app__header-bg"
                    style={{
                        background: `url("${avatar}") no-repeat center center / cover`
                    }}
                />
                <div className="app__header-overlay" />
                <div className="app__header-container">
                    <div className="app__header-user">
                        <div className="app__user-avatar">
                            <img
                                src={avatar}
                                alt=""
                                className="app__user-img"
                            />
                        </div>
                        <span className="app__user-name">{displayName}</span>
                    </div>
                    <div className="app__header-actions">
                        {/* <a
                            href="#"
                            className="vip-btn is-small button button-gold hide-on-mobile"
                        >
                            Mua vip ngay
                        </a>
                        <a
                            href="#"
                            className="vip-code-btn is-small button hide-on-tablet-mobile"
                        >
                            Nhập code vip
                        </a> */}
                    </div>
                </div>
            </div>
        </>
    )
}