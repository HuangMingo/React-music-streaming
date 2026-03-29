export function SongSection({playlist}) {
    return (
        <>
            <div className="grid container__tab tab-song active">
                <div className="row no-gutters">
                    <div className="col l-12 m-12 c-12">
                        <div className="container__header mb-10">
                            <a href="#" className="container__header-title">
                                <h3>Bài Hát&nbsp;</h3>
                            </a>
                            <h3 className="container__header-subtitle">Bài Hát</h3>
                            <div className="container__header-actions">
                                <div className="button is-small container__header-btn hide-on-mobile">
                                    <input
                                        type="file"
                                        name="upload song"
                                        id="song__upload-input"
                                        className="container__header-input"
                                    />
                                    <label htmlFor="song__upload-input">
                                        <i className="bi bi-upload container__header-icon" />
                                        Tải lên
                                    </label>
                                </div>
                                <button className="button is-small button-primary container__header-btn btn--play-all">
                                    <i className="bi bi-play-fill container__header-icon" />
                                    <span>Phát tất cả</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className=" col l-12 m-12 c-12">
                        <div className="container__playlist">
                            <div className="playlist__header mt-5">
                                <span className="playlist__header-title">Bài hát</span>
                                <span className="playlist__header-time">Thời gian</span>
                            </div>
                            <div className="playlist__list mb-30 overflow-visible">
                                <div className="playlist__list-song">
                                    <div className="playlist__song-info">
                                        <i className="bi bi-music-note-beamed playlist__song-icon mr-10" />
                                        <div
                                            className="playlist__song-thumb"
                                            style={{
                                                background:
                                                    'url("https://i.ytimg.com/vi/kTJczUoc26U/maxresdefault.jpg") no-repeat center center / cover'
                                            }}
                                        />
                                        <div className="playlist__song-body">
                                            <span className="playlist__song-title">
                                                Music Name
                                            </span>
                                            <p className="playlist__song-author">Singer</p>
                                        </div>
                                    </div>
                                    <span className="playlist__song-time">--/--</span>
                                    <div className="playlist__song-option">
                                        <div className="playlist__song-btn option-btn">
                                            <i className="btn--icon bi bi-mic-fill" />
                                        </div>
                                        <div className="playlist__song-btn option-btn">
                                            <i className="btn--icon bi bi-suit-heart" />
                                        </div>
                                        <div className="playlist__song-btn option-btn">
                                            <i className="btn--icon bi bi-three-dots" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}