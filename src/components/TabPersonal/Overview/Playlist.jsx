export function Playlist() {
    return (

        <>
            <div className="container__section row">
                <div className="col l-12 m-12 c-12 mb-16">
                    <div className="container__header">
                        <a href="#" className="container__header-title">
                            <h3>Playlist&nbsp;</h3>
                            <i className="bi bi-chevron-right container__header-icon" />
                        </a>
                        <h3 className="container__header-subtitle">Playlist</h3>
                        <div className="container__header-actions hide-on-tablet-mobile">
                            <div className="container__move-btn move-btn--playlist button--disabled">
                                <i className="bi bi-chevron-left container__move-btn-icon" />
                            </div>
                            <div className="container__move-btn move-btn--playlist">
                                <i className="bi bi-chevron-right container__move-btn-icon" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col l-12 m-12 c-12">
                    <div className="row no-wrap playlist--container"></div>
                </div>
            </div>
        </>
    )
}