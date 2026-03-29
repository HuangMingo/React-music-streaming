import { useOutletContext, useNavigate } from "react-router-dom"
import { useMusicContext } from "../../context/MusicContext";

export function PlaylistSection() {
    const {playlists} = useOutletContext();
    const { setPlaylistIndex, setSelectedPlaylist } = useMusicContext();
    const navigate = useNavigate();
    function handleClickPlaylist(playlist, index) {
        setSelectedPlaylist(playlist);
        setPlaylistIndex(index);
        navigate("/personal/overview");
    }
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
                        <div className="row playlist--container">
                            <div className="col l-2-4 m-3 c-4 mb-30">
                                <div className="row__item  playlist--create item--playlist">
                                    <div className="row__item-container flex--center item-create--properties">
                                        <i className="bi bi-plus-lg album__create-icon"></i>
                                        <span className="album__create-annotate text-center">Tạo playlist mới</span>
                                    </div>
                                </div>
                            </div>
                            {
                                playlists.map((playlist, playlistIndex) => {
                                    return (
                                        <div className={`col l-2-4 m-3 c-4 ${playlistIndex === 1 ? 'mb-30' : ''}`} onClick={() => handleClickPlaylist(playlist, playlistIndex)} key={playlist.name}>
                                            <div className="row__item item--playlist">
                                                <div className="row__item-container flex--top-left">
                                                    <div className="row__item-display br-5">
                                                        <div className="row__item-img img--square" style={{ background: `url(${playlist.image}) no-repeat center center / cover` }}></div>
                                                        <div className="row__item-actions">
                                                            <div className="action-btn btn--heart">
                                                                <i className="btn--icon icon--heart bi bi-heart-fill primary"></i>
                                                            </div>
                                                            <div className="btn--play-playlist">
                                                                <div className="control-btn btn-toggle-play">
                                                                    <i className="bi bi-play-fill"></i>
                                                                </div>
                                                            </div>
                                                            <div className="action-btn">
                                                                <i className="btn--icon bi bi-three-dots"></i>
                                                            </div>
                                                        </div>
                                                        <div className="overlay"></div>
                                                    </div>
                                                    <div className="row__item-info">
                                                        <a href="#" className="row__info-name is-twoline">{playlist.name}</a>
                                                        <h3 className="row__info-creator">{playlist.user_name}</h3>
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
            </div >
        </>
    )
}