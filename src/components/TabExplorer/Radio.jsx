export function Radio() {
    return (
        <>
            <div className="app__container tab--radio active">
                <div className="app__container-content">
                    <div className="radio__container">
                        <div className="grid">
                            {/* Radio list */}
                            <div className="row container__section mt-30">
                                <div className="col l-12 m-12 c-12 mb-16">
                                    <div className="container__header">
                                        <a href="#" className="container__header-title">
                                            <h3>Radio Nổi bật&nbsp;</h3>
                                        </a>
                                        <h3 className="container__header-subtitle">Radio Nổi bật</h3>
                                        <div className="container__header-actions hide-on-tablet-mobile">
                                            <div className="container__move-btn move-btn--radio button--disabled">
                                                <i className="bi bi-chevron-left container__move-btn-icon"></i>
                                            </div>
                                            <div className="container__move-btn move-btn--radio">
                                                <i className="bi bi-chevron-right container__move-btn-icon"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col l-12 m-12 c-12">
                                    <div className="row no-wrap radio--container">
                                    </div>
                                </div>
                            </div>

                            {/* Playlist */}
                            <div className="row container__section special-playlist--section mt-30">
                            </div>
                            <div className="row container__section special-playlist--section mt-30">
                            </div>
                            <div className="row container__section special-playlist--section mt-30">
                            </div>
                            <div className="row container__section normal-playlist--section mt-30">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}