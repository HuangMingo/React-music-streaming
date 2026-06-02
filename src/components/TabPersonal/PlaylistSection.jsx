import { useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import { useMusicContext } from "../../context/MusicContext";
import { DeletePlaylistDialog } from "./../../components/DeletePlaylistDialog/DeletePlaylistDialog.jsx";
import { CreatePlaylist } from "./../Sidebar/CreatePlaylist/CreatePlaylist.jsx";
import { EditPlaylistMenu } from "./EditPlaylistMenu.jsx";
import axios from "axios";
import { API_URL } from '../../api.js';
export function PlaylistSection() {
    const { playlists, onPlaylistsChanged } = useOutletContext();
    const { currentUser } = useAuthContext();
    const outletContext = useOutletContext();
    // console.log("PlaylistSection outletContext:", outletContext);
    const {
        selectedPlaylist,
        setSelectedPlaylist,
        currentSong,
        setCurrentSong,
        setCurrentTime,
        isPlaying,
        setIsPlaying,
        favouritePlaylistIds,
        toggleFavouritePlaylist } = useMusicContext();
    const navigate = useNavigate();
    const [isDeleting, setIsDeleting] = useState(false);
    const [playlistIdToDelete, setPlaylistIdToDelete] = useState(null);
    const [isOpenForm, setOpenForm] = useState(false);
    const [playlistToEdit, setPlaylistToEdit] = useState(null);
    const [openPlaylistMenuId, setOpenPlaylistMenuId] = useState(null);
    const [playlistMenuTrigger, setPlaylistMenuTrigger] = useState(null);
    const playlistMenuRef = useRef(null);
    function handleClickDeletePlaylist(playlistId) {
        setPlaylistIdToDelete(playlistId);
        setIsDeleting(true);
    }

    function closeDeleteDialog() {
        setIsDeleting(false);
        setPlaylistIdToDelete(null);
    }
    function isPlaylistMine(playlist) {
        return Number(playlist?.creator_id) === Number(currentUser?.id);
    }
    function handleClickEditPlaylist(playlist) {
        if (isPlaylistMine(playlist) && playlist.isdefault !== true) {
            setOpenPlaylistMenuId(null);
            setPlaylistMenuTrigger(null);
            setPlaylistToEdit(playlist);
            setOpenForm(true);
        }
    }
    function handleTogglePlaylistMenu(event, playlist) {
        event.stopPropagation();
        if (isPlaylistMine(playlist) && playlist.isdefault !== true) {
            const triggerElement = event.currentTarget;
            setOpenPlaylistMenuId((currentId) => {
                if (currentId === playlist.id) {
                    setPlaylistMenuTrigger(null);
                    return null;
                }

                setPlaylistMenuTrigger(triggerElement);
                return playlist.id;
            });
        }
    }
    function closePlaylistMenu() {
        setOpenPlaylistMenuId(null);
        setPlaylistMenuTrigger(null);
    }
    async function handlePlaylistUpdated(updatedPlaylist) {
        if (onPlaylistsChanged) {
            await onPlaylistsChanged();
        }
        if (updatedPlaylist) {
            setSelectedPlaylist((prevPlaylist) => {
                if (!prevPlaylist || prevPlaylist.id !== updatedPlaylist.id) {
                    return prevPlaylist;
                }

                return {
                    ...prevPlaylist,
                    playlist_name: updatedPlaylist.playlist_name,
                    ispublic: updatedPlaylist.ispublic
                };
            });
        }
    }
    function closeEditForm() {
        setOpenForm(false);
        setPlaylistToEdit(null);
    }

    useEffect(() => {
        function handleClickOutside(event) {
            const isClickInsideMenu = playlistMenuRef.current?.contains(event.target);
            const isClickInsideTrigger = playlistMenuTrigger?.contains(event.target);

            if (!isClickInsideMenu && !isClickInsideTrigger) {
                setOpenPlaylistMenuId(null);
                setPlaylistMenuTrigger(null);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [playlistMenuTrigger]);

    async function loadPlaylistPersonal(playlist) {
        try {
            const response = await axios.get(
                `${API_URL}/api/playlists/playlist-details`,
                {
                    params: {
                        playlistId: playlist.id
                    }
                }
            );

            const playlistData = {
                ...response.data,
                creator_id: response.data?.creator_id ?? playlist.creator_id
            };

            setSelectedPlaylist(playlistData);
            navigate("/personal");
            return playlistData;
        } catch (error) {
            console.error("Load playlist failed:", error);
            return null;
        }
    }

    async function handleClickPlaylistPersonal(playlist) {
        await loadPlaylistPersonal(playlist);
    }

    async function handlePlayPlaylistPersonal(event, playlist) {
        event.stopPropagation();

        const playlistData = await loadPlaylistPersonal(playlist);
        if (!playlistData) {
            return;
        }

        const firstSong = playlistData?.songs?.[0];
        const hasSongs = Boolean(firstSong);

        if (hasSongs) {
            setCurrentSong(firstSong);
            setCurrentTime(0);
            setIsPlaying(true);
        }
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
                                const isPlaylistPlaying = isPlaylistActive && isPlaying && playlist?.songs?.some(song => song.id === currentSong.id);
                                const isMine = isPlaylistMine(playlist);
                                return (
                                    <div
                                        className={`col l-2-4 m-3 c-4 ${playlistIndex === 1 ? "mb-30" : ""} `}
                                        key={`${playlist.id ?? playlistIndex}`}
                                        onClick={() => handleClickPlaylistPersonal(playlist)}
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
                                                                    if (isMine) {
                                                                        e.stopPropagation();
                                                                        return;
                                                                    }
                                                                    toggleFavouritePlaylist(e, playlist.id);
                                                                }}
                                                                title={!isMine ? (favouritePlaylistIds.has(playlist.id) ? "Bỏ thích playlist" : "Thêm vào playlist yêu thích") : undefined}
                                                            >
                                                                {isMine ? (
                                                                    <i className="btn--icon bi bi-x-lg" onClick={() => handleClickDeletePlaylist(playlist.id)} />
                                                                ) : (
                                                                    <i className={`btn--icon icon--heart bi bi-heart${favouritePlaylistIds.has(playlist.id) ? "-fill" : ""} primary`} />
                                                                )}
                                                            </div>
                                                        )}

                                                        <div className={`btn--play-playlist `} onClick={(event) => handlePlayPlaylistPersonal(event, playlist)}>
                                                            <div className="control-btn btn-toggle-play">
                                                                <i className="bi bi-play-fill" />
                                                            </div>
                                                            <span className="song-note note-1">♪</span>
                                                            <span className="song-note note-2">♫</span>
                                                            <span className="song-note note-3">♪</span>
                                                            <span className="song-note note-4">♫</span>
                                                            <div className="thumb--animate" >
                                                                <div className="thumb--animate-img" style={{ "background": "url('/assets/img/SongActiveAnimation/icon-playing.gif') no-repeat 50% / contain" }}>

                                                                </div>
                                                            </div>
                                                        </div>

                                                        {playlist.isdefault != null && playlist.isdefault === true ? "" : (
                                                            <div
                                                                className="action-btn"
                                                                onClick={(e) => handleTogglePlaylistMenu(e, playlist)}
                                                            >
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
            <EditPlaylistMenu
                openPlaylistMenuId={openPlaylistMenuId}
                playlistMenuTrigger={playlistMenuTrigger}
                playlistMenuRef={playlistMenuRef}
                playlists={playlists}
                onEditPlaylist={handleClickEditPlaylist}
                onCloseMenu={closePlaylistMenu}
            />
            {
                isOpenForm && playlistToEdit && (
                    <CreatePlaylist
                        onClose={closeEditForm}
                        onSuccess={handlePlaylistUpdated}
                        editingPlaylist={playlistToEdit}
                    />
                )
            }
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
