export function FavoriteArtist() {
    return (
        <>
            <div className="row container__section mt-30">
                <div className="col l-12 m-12 c-12 mb-16">
                    <div className="container__header">
                        <a href="#" className="container__header-title">
                            <h3>Nghệ Sĩ Yêu Thích</h3>
                        </a>
                        <h3 className="container__header-subtitle">
                            Nghệ Sĩ Yêu Thích
                        </h3>
                        <div className="container__header-actions fav-artist--move hide-on-tablet-mobile">
                            <div className="container__move-btn move-btn--fav-artist btn--prev button--disabled">
                                <i className="bi bi-chevron-left container__move-btn-icon" />
                            </div>
                            <div className="container__move-btn move-btn--fav-artist btn--next">
                                <i className="bi bi-chevron-right container__move-btn-icon" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col l-12 m-12 c-12">
                    <div className="row no-wrap fav-artist--container"></div>
                </div>
            </div>
        </>
    )
}
