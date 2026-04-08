import { ALBUM_STORAGE_KEY } from "../../../public/data/albums.js";

export function AlbumSection() {
    const albums = JSON.parse(localStorage.getItem(ALBUM_STORAGE_KEY) || "[]");

    return (
        <>
            <div className="grid container__tab tab-album active">
                <div className="container__section row">
                    <div className="col l-12 m-12 c-12 mb-16">
                        <div className="container__header">
                            <a href="#" className="container__header-title">
                                <h3>Album&nbsp;</h3>
                            </a>
                        </div>
                    </div>
                    <div className="col l-12 m-12 c-12">
                        <div className="row album--container">
                            {albums.length === 0 ? (
                                <div className="box--no-content">
                                    <div className="no-content-image" />
                                    <span className="no-content-text">Chua co album nao.</span>
                                </div>
                            ) : (
                                albums.map((album, index) => (
                                    <div className="col l-2-4 m-3 c-6 mb-30" key={`${album.title}-${index}`}>
                                        <div className="row__item item--album">
                                            <div className="row__item-container flex--top-left">
                                                <div className="row__item-display br-5">
                                                    <div
                                                        className="row__item-img img--square"
                                                        style={{ background: `url('${album.image}') no-repeat center center / cover` }}
                                                    ></div>
                                                    <div className="row__item-actions">
                                                        <div className="action-btn btn--heart">
                                                            <i className="btn--icon icon--heart bi bi-heart-fill primary"></i>
                                                        </div>
                                                        <div className="btn--play-playlist">
                                                            <div className="control-btn btn-toggle-play">
                                                                <i className="bi bi-play-fill icon-play"></i>
                                                            </div>
                                                        </div>
                                                        <div className="action-btn">
                                                            <i className="btn--icon bi bi-three-dots"></i>
                                                        </div>
                                                    </div>
                                                    <div className="overlay"></div>
                                                </div>
                                                <div className="row__item-info">
                                                    <a href="#" className="row__info-name is-twoline">{album.title}</a>
                                                    <p className="row__info-creator">{album.singers?.join(", ") || "Dang cap nhat"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}