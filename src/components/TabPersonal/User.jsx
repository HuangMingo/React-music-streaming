export function User() {
    return (
        <>
            <div className="app__header">
                <div
                    className="app__header-bg"
                    style={{
                        background:
                            'url("../../assets/img/avatars/avatar.jpg") no-repeat center center / cover'
                    }}
                />
                <div className="app__header-overlay" />
                <div className="app__header-container">
                    <div className="app__header-user">
                        <div className="app__user-avatar">
                            <img
                                src="../../assets/img/avatars/avatar.jpg"
                                alt=""
                                className="app__user-img"
                            />
                        </div>
                        <span className="app__user-name">Trần Huyền My</span>
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