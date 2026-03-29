import { NavLink } from "react-router-dom"
import { ALBUM_STORAGE_KEY } from "./../../../../public/data/albums.js"
export function Album() {
    const albums = JSON.parse(localStorage.getItem(ALBUM_STORAGE_KEY) || []);
    return (
        <>
            <div className="container__section row mt-50">
                <div className="col l-12 m-12 c-12 mb-16">
                    <div className="container__header">
                        <NavLink to="album" className="container__header-title">
                            <h3>Album&nbsp;</h3>
                            <i className="bi bi-chevron-right container__header-icon" />
                        </NavLink>
                        <h3 className="container__header-subtitle">Album</h3>
                        <div className="container__header-actions hide-on-tablet-mobile">
                            <div className="container__move-btn move-btn--album button--disabled">
                                <i className="bi bi-chevron-left container__move-btn-icon" />
                            </div>
                            <div className="container__move-btn move-btn--album">
                                <i className="bi bi-chevron-right container__move-btn-icon" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col l-12 m-12 c-12">
                    <div className="row no-wrap album--container">
                        {
                            albums.map((album, albumIndex) => {
                                return (
                                    <div className={`col l-2-4 m-3 c-4 ${albumIndex === 1 && 'mb-30'}`} key={albumIndex}>
                                        <div className="row__item item--album">
                                            <div className="row__item-container flex--top-left">
                                                <div className="row__item-display br-5">
                                                    <div className="row__item-img img--square" style={{ "background": `url('${album.image}') no-repeat center center / cover` }}></div>
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
                                                    <h3 className="row__info-creator">{album.singer}</h3>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        }
                    </div>
                </div>
            </div >
        </>
    )
}