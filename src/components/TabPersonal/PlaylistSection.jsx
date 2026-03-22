export function PlaylistSection() {
    return (
        <>
            <div className="grid container__tab tab-playlist active">
                <div className="container__section row">
                    <div className="col l-12 m-12 c-12 mb-16">
                        <div className="container__header">
                            <a href="#" className="container__header-title">
                                <h3>Playlist&nbsp;</h3>
                            </a>
                            <h3 className="container__header-subtitle">Playlist</h3>
                        </div>
                    </div>
                    <div className="col l-12 m-12 c-12">
                        <div className="row playlist--container"></div>
                    </div>
                </div>
            </div>
        </>
    )
}