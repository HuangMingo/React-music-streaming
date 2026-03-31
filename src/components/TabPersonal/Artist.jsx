import { NavLink } from "react-router-dom"
import { ARTIST_STORAGE_KEY } from "./../../../public/data/artists.js";
function doi(followers) {
    if (followers >= 1000000) {
        return (followers / 1000000).toFixed(1) + 'M';
    }
    if (followers >= 1000) {
        return (followers / 1000).toFixed(1) + 'K';
    }
    return followers.toString();
}
export function Artist() {

    const artists = JSON.parse(localStorage.getItem(ARTIST_STORAGE_KEY));
    return (
        <>
            <div className="container__section row mt-30">
                <div className="col l-12 m-12 c-12 mb-16">
                    <div className="container__header">
                        <NavLink className="container__header-title" to="artist">
                            <h3>Nghệ Sĩ&nbsp;</h3>
                            <i className="bi bi-chevron-right container__header-icon" />
                        </NavLink>
                        <h3 className="container__header-subtitle">Nghệ Sĩ</h3>
                        <div className="container__header-actions hide-on-tablet-mobile">
                            <div className="container__move-btn move-btn--artist button--disabled">
                                <i className="bi bi-chevron-left container__move-btn-icon" />
                            </div>
                            <div className="container__move-btn move-btn--artist">
                                <i className="bi bi-chevron-right container__move-btn-icon" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col l-12 m-12 c-12">
                    <div className="row no-wrap artist--container">
                        {
                            artists.map((artist, artistIndex) => {
                                return (
                                    <div className={`col l-2-4 m-3 c-6`} key={artistIndex}>
                                        <div className="row__item item--artist">
                                            <div className="row__item-container flex--top-left">
                                                <div className="row__item-display is-rounded">
                                                    <div className="row__item-img img--square is-rounded" style={{ "background": `url(${artist.image}) no-repeat center center / contain` }}> </div>
                                                    <div className="row__item-actions">
                                                        <div className="btn--play-playlist">
                                                            <div className="control-btn btn-toggle-play">
                                                                <i className="bi bi-play-fill icon-play"></i>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="overlay"></div>
                                                </div>
                                                <div className="row__item-info media artist--info">
                                                    <div className="media__left">
                                                        <a href="#" className="row__info-name is-ghost mt-15 lh-19 text-center">
                                                            {artist.name}
                                                            <i className="bi bi-star-fill row__info-icon">
                                                                <div className="icon-overlay"></div>
                                                            </i>
                                                        </a>
                                                        <h3 className="row__info-creator text-center">{doi(artist.followers)} quan tâm</h3>
                                                    </div>
                                                </div>
                                                <div className="row__item-btn">
                                                    <button className="button is-small button-primary">
                                                        <i className="bi bi-check2"></i>
                                                        <span>&nbsp;Đã quan tâm</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div >
                                )
                            })
                        }

                    </div>
                </div>
            </div >
        </>
    )
}