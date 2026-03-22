export function PlayMusic() {
    return (
        <>
            <div className="container__control row">
                <div className="col l-12 m-12 c-12 mb-10">
                    <div className="container__header">
                        <a href="#" className="container__header-title">
                            <h3>Bài Hát&nbsp;</h3>
                            <i className="bi bi-chevron-right container__header-icon" />
                        </a>
                        <h3 className="container__header-subtitle">Bài Hát</h3>
                        <div className="container__header-actions">
                            <div className="button is-small container__header-btn hide-on-mobile">
                                <input
                                    type="file"
                                    name="upload song"
                                    id="home__upload-input"
                                    className="container__header-input"
                                    accept=".mp3"
                                />
                                <label htmlFor="home__upload-input">
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
                <div className="col l-12 m-12 c-12">
                    <div className="container__playmusic">
                        <div className="container__slide hide-on-mobile">
                            <div className="container__slide-show">
                                <div className="container__slide-item first">
                                    <div
                                        style={{
                                            background:
                                                'url("./../../assets/img/slides/slide1.jpg") no-repeat center center / cover'
                                        }}
                                        className="container__slide-img"
                                    />
                                </div>
                                <div className="container__slide-item second">
                                    <div
                                        style={{
                                            background:
                                                'url("./../../assets/img/slides/slide2.jpg") no-repeat center center / cover'
                                        }}
                                        className="container__slide-img"
                                    />
                                </div>
                                <div className="container__slide-item third">
                                    <div
                                        style={{
                                            background:
                                                'url("./../../assets/img/slides/slide3.jpg") no-repeat center center / cover'
                                        }}
                                        className="container__slide-img"
                                    />
                                </div>
                                <div className="container__slide-item fourth">
                                    <div
                                        style={{
                                            background:
                                                'url("./../../assets/img/slides/slide4.jpg") no-repeat center center / cover'
                                        }}
                                        className="container__slide-img"
                                    />
                                </div>
                                <div className="container__slide-item fourth">
                                    <div
                                        style={{
                                            background:
                                                'url("./../../assets/img/slides/slide5.jpg") no-repeat center center / cover'
                                        }}
                                        className="container__slide-img"
                                    />
                                </div>
                                <div className="container__slide-item fourth">
                                    <div
                                        style={{
                                            background:
                                                'url("./../../assets/img/slides/slide6.jpg") no-repeat center center / cover'
                                        }}
                                        className="container__slide-img"
                                    />
                                </div>
                                <div className="container__slide-item fourth">
                                    <div
                                        style={{
                                            background:
                                                'url("./../../assets/img/slides/slide7.jpg") no-repeat center center / cover'
                                        }}
                                        className="container__slide-img"
                                    />
                                </div>
                                <div className="container__slide-item fourth">
                                    <div
                                        style={{
                                            background:
                                                'url("./../../assets/img/slides/slide8.jpg") no-repeat center center / cover'
                                        }}
                                        className="container__slide-img"
                                    />
                                </div>
                                <div className="container__slide-item fourth">
                                    <div
                                        style={{
                                            background:
                                                'url("./../../assets/img/slides/slide9.jpg") no-repeat center center / cover'
                                        }}
                                        className="container__slide-img"
                                    />
                                </div>
                                <div className="container__slide-item fourth">
                                    <div
                                        style={{
                                            background:
                                                'url("./../../assets/img/slides/slide10.jpg") no-repeat center center / cover'
                                        }}
                                        className="container__slide-img"
                                    />
                                </div>
                                <div className="container__slide-item fourth">
                                    <div
                                        style={{
                                            background:
                                                'url("./../../assets/img/slides/slide11.jpg") no-repeat center center / cover'
                                        }}
                                        className="container__slide-img"
                                    />
                                </div>
                                <div className="container__slide-item fourth">
                                    <div
                                        style={{
                                            background:
                                                'url("./../../assets/img/slides/slide12.jpg") no-repeat center center / cover'
                                        }}
                                        className="container__slide-img"
                                    />
                                </div>
                                <div className="container__slide-item fourth">
                                    <div
                                        style={{
                                            background:
                                                'url("./../../assets/img/slides/slide13.jpg") no-repeat center center / cover'
                                        }}
                                        className="container__slide-img"
                                    />
                                </div>
                                <div className="container__slide-item fourth">
                                    <div
                                        style={{
                                            background:
                                                'url("./../../assets/img/slides/slide14.jpg") no-repeat center center / cover'
                                        }}
                                        className="container__slide-img"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="container__playlist">
                            <div className="playlist__list"></div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}