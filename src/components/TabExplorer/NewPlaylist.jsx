export function NewPlaylist() {
    return (
        <div className="row container__section mt-30">
            <div className="col l-12 m-12 c-12 mb-16">
                <div className="container__header">
                    <a href="#" className="container__header-title">
                        <h3>Mới Phát Hành</h3>
                    </a>
                    <h3 className="container__header-subtitle">Mới Phát Hành</h3>
                    <div className="container__header-actions new-playlist--move hide-on-tablet-mobile">
                        <div className="container__move-btn move-btn--new-playlist btn--prev button--disabled">
                            <i className="bi bi-chevron-left container__move-btn-icon" />
                        </div>
                        <div className="container__move-btn move-btn--new-playlist btn--next">
                            <i className="bi bi-chevron-right container__move-btn-icon" />
                        </div>
                    </div>
                </div>
            </div>
            <div className="col l-12 m-12 c-12">
                <div className="row no-wrap new-playlist--container"></div>
            </div>
        </div>
    );
}