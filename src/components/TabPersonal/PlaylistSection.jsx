import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import { useMusicContext } from "../../context/MusicContext";
import { DeletePlaylistDialog } from "./../../components/DeletePlaylistDialog/DeletePlaylistDialog.jsx";
import "./../../../public/assets/img/SongActiveAnimation/icon-playing.gif";

export function PlaylistSection() {
    const { playlists, onPlaylistsChanged } = useOutletContext();
    const { currentUser } = useAuthContext();
    const outletContext = useOutletContext();
    console.log("PlaylistSection outletContext:", outletContext);
    const {
        selectedPlaylist,
        setSelectedPlaylist,
        setCurrentSong,
        setCurrentTime,
        isPlaying,
        setIsPlaying } = useMusicContext();
    const navigate = useNavigate();
    const [isDeleting, setIsDeleting] = useState(false);
    const [playlistIdToDelete, setPlaylistIdToDelete] = useState(null);
    function handleClickDeletePlaylist(playlistId) {
        setPlaylistIdToDelete(playlistId);
        setIsDeleting(true);
    }

    function closeDeleteDialog() {
        setIsDeleting(false);
        setPlaylistIdToDelete(null);
    }

    function handleClickPlaylistPersonal(playlist, index) {
        const firstSong = playlist?.songs?.[0];
        const hasSongs = Boolean(firstSong);
        setSelectedPlaylist(playlist);
        if (hasSongs) {
            setCurrentSong(firstSong);
        }
        setCurrentTime(0);
        setIsPlaying(hasSongs);
        navigate("/personal");
    }

    return (
        <>
            <div className="grid container__tab tab-playlist active">
                <div className="container__section row">
                    <div className="col l-12 m-12 c-12 mb-16">
                        <div className="container__header">
                            <div className="container__header-title">
                                <h3>Playlist&nbsp;</h3>
                            </div>
                            <h3 className="container__header-subtitle">Playlist</h3>
                        </div>
                    </div>
                    <div className="col l-12 m-12 c-12">
                        <div className="row playlist--container">
                            {playlists.map((playlist, playlistIndex) => {
                                const isPlaylistActive = selectedPlaylist?.id === playlist.id;
                                const isPlaylistPlaying = isPlaylistActive && isPlaying;
                                return (
                                    <div
                                        className={`col l-2-4 m-3 c-4 ${playlistIndex === 1 ? "mb-30" : ""} `}
                                        key={`${playlist.id ?? playlistIndex}`}
                                        onClick={() => handleClickPlaylistPersonal(playlist, playlistIndex)}
                                    >
                                        <div className={`row__item item--playlist ${isPlaylistActive ? "active" : ""} ${isPlaylistPlaying ? "playing" : ""} `}>
                                            <div className="row__item-container flex--top-left">
                                                <div className="row__item-display br-5">
                                                    <div
                                                        className="row__item-img img--square"
                                                        style={{ background: `url(${playlist.playlist_image}) no-repeat center center / cover`, overflow: "hidden" }}
                                                    />

                                                    <div className="row__item-actions">
                                                        {playlist.isdefault === true ? "" : (
                                                            <div
                                                                className="action-btn btn--heart"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                }}
                                                            >
                                                                {playlist.ismine != null && playlist.ismine === true ? (
                                                                    <i className="btn--icon bi bi-x-lg" onClick={() => handleClickDeletePlaylist(playlist.id)} />
                                                                ) : (
                                                                    <i className="btn--icon icon--heart bi bi-heart-fill primary" />
                                                                )}
                                                            </div>
                                                        )}

                                                        <div className={`btn--play-playlist `}>
                                                            <div className="control-btn btn-toggle-play">
                                                                <i className="bi bi-play-fill" />
                                                            </div>
                                                            <span className="song-note note-1">♪</span>
                                                            <span className="song-note note-2">♫</span>
                                                            <span className="song-note note-3">♪</span>
                                                            <span className="song-note note-4">♫</span>
                                                            <div className="thumb--animate" >
                                                                <div className="thumb--animate-img" style={{ "background": "url('./../../../public/assets/img/SongActiveAnimation/icon-playing.gif') no-repeat 50% / contain" }}>

                                                                </div>
                                                            </div>
                                                        </div>

                                                        {playlist.isdefault != null && playlist.isdefault === true ? "" : (
                                                            <div className="action-btn">
                                                                <i className="btn--icon bi bi-three-dots" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="overlay"></div>
                                                </div>
                                                <div className="row__item-info">
                                                    <a href="#" className="row__info-name is-twoline">{playlist.playlist_name}</a>
                                                    <h3 className="row__info-creator">{playlist.username}</h3>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div >
            {
                isDeleting && (
                    <DeletePlaylistDialog
                        playlistId={playlistIdToDelete}
                        onClose={closeDeleteDialog}
                        currentUser={currentUser}
                        onDeleted={onPlaylistsChanged}
                    />
                )
            }
        </>
    )
}