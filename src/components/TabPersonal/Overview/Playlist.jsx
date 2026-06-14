import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useMusicContext } from "../../../context/MusicContext";
import { useAuthContext } from "../../../context/AuthContext";
import { DeletePlaylistDialog } from "./../../DeletePlaylistDialog/DeletePlaylistDialog.jsx";
import { CreatePlaylist } from "../../Sidebar/CreatePlaylist/CreatePlaylist.jsx";
import { EditPlaylistMenu } from "../EditPlaylistMenu.jsx";
import axios from "axios";
import { API_URL } from '../../../api.js';
export function Playlist({ playlists = [], onPlaylistsChanged }) {
    const {
        personalSelectedPlaylist,
        setPersonalSelectedPlaylist,
        setCurrentTime,
        setCurrentSong,
        setIsPlaying,
        isPlaying,
        currentSong,
        favouritePlaylistIds,
        toggleFavouritePlaylist,
    } = useMusicContext();
    // console.log(personalSelectedPlaylist);
    async function loadPlaylistPersonal(playlist) {
        scrollPersonalContainerToTop();

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

            setPersonalSelectedPlaylist(playlistData);
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

    const { currentUser } = useAuthContext();
    const navigate = useNavigate();
    //Phân trang cho playlist
    const [currentPage, setCurrentPage] = useState(0);
    //so playlist hien thi tren mot trang
    const [itemsPerPage, setItemsPerPage] = useState(4);
    //useState mo form tao playlist moi
    const [isOpenForm, setOpenForm] = useState(false);
    const [playlistToEdit, setPlaylistToEdit] = useState(null);
    const [openPlaylistMenuId, setOpenPlaylistMenuId] = useState(null);
    const [playlistMenuTrigger, setPlaylistMenuTrigger] = useState(null);
    const playlistMenuRef = useRef(null);
    //useState hien thi diaglog xoa playlist
    const [isDeleting, setIsDeleting] = useState(false);
    //set playlistId can xoa khi click vao icon xoa
    const [playlistIdToDelete, setPlaylistIdToDelete] = useState(null);
    function handleClickDeletePlaylist(playlistId) {
        setPlaylistIdToDelete(playlistId);
        setIsDeleting(true);

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
            setPersonalSelectedPlaylist((prevPlaylist) => {
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
    //Đóng dialog xóa playlist
    function closeDeleteDialog() {
        setIsDeleting(false);
        setPlaylistIdToDelete(null);
    }

    useEffect(() => {
        function updateItemsPerPage() {
            const width = window.innerWidth;

            if (width < 740) {
                setItemsPerPage(2);
                return;
            }
            if (width < 1024) {
                setItemsPerPage(3);
                return;
            }
            setItemsPerPage(4);
        }

        updateItemsPerPage();
        window.addEventListener("resize", updateItemsPerPage);

        return () => window.removeEventListener("resize", updateItemsPerPage);
    }, []);

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

    const totalPages = Math.max(1, Math.ceil(playlists.length / itemsPerPage));
    //pagedPlaylists là mảng 2 chiều, mỗi phần tử là một trang chứa các playlist tương ứng với itemsPerPage
    const pagedPlaylists = useMemo(() => {
        const pages = [];

        for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
            pages.push(playlists.slice(pageIndex * itemsPerPage, pageIndex * itemsPerPage + itemsPerPage));
        }

        return pages;
    }, [itemsPerPage, playlists, totalPages]);

    useEffect(() => {
        setCurrentPage((prevPage) => Math.min(prevPage, totalPages - 1));
    }, [totalPages]);

    function scrollPersonalContainerToTop() {
        const personalContainer = document.querySelector(".app__container.tab--personal");
        if (personalContainer) {
            personalContainer.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
    }


    function handlePrevPage() {
        setCurrentPage((prevPage) => Math.max(prevPage - 1, 0));
    }

    function handleNextPage() {
        setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages - 1));
    }

    const isFirstPage = currentPage === 0;
    const isLastPage = currentPage === totalPages - 1;

    return (
        <>
            <div className="container__section row">
                <div className="col l-12 m-12 c-12 mb-16">
                    <div className="container__header">
                        <NavLink className="container__header-title" to="playlist">
                            <h3>Playlist&nbsp;</h3>
                            <i className="bi bi-chevron-right container__header-icon" />
                        </NavLink>
                        <h3 className="container__header-subtitle">Playlist</h3>
                        <div className="container__header-actions hide-on-tablet-mobile">
                            <div
                                className={`container__move-btn move-btn--playlist ${isFirstPage ? "button--disabled" : ""}`}
                                onClick={isFirstPage ? undefined : handlePrevPage}
                                role="button"
                                aria-label="Trang trước"
                                aria-disabled={isFirstPage}
                            >
                                <i className="bi bi-chevron-left container__move-btn-icon" />
                            </div>
                            <div
                                className={`container__move-btn move-btn--playlist ${isLastPage ? "button--disabled" : ""}`}
                                onClick={isLastPage ? undefined : handleNextPage}
                                role="button"
                                aria-label="Trang sau"
                                aria-disabled={isLastPage}
                            >
                                <i className="bi bi-chevron-right container__move-btn-icon" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col l-12 m-12 c-12">
                    <div className="row no-wrap playlist--container playlist__container">
                        <div className="playlist__viewport">
                            <div
                                className="playlist__track"
                                style={{ transform: `translateX(-${currentPage * 100}%)` }}
                            >

                                {

                                    pagedPlaylists.map((pagePlaylists, pageIndex) => (
                                        <div className="playlist__page" key={`playlist-page-${pageIndex}`}>
                                            {pagePlaylists.map((playlist, playlistIndex) => {
                                                const absoluteIndex = pageIndex * itemsPerPage + playlistIndex;
                                                const isPlaylistActive = personalSelectedPlaylist?.id === playlist.id;
                                                const isPlaylistPlaying = isPlaylistActive && isPlaying && playlist?.songs?.some(song => song.id === currentSong.id);
                                                const isMine = isPlaylistMine(playlist);
                                                return (

                                                    <div
                                                        className={`col l-2-4 m-3 c-4 ${playlistIndex === 1 && 'mb-30'}`}
                                                        key={`${absoluteIndex}`}
                                                        onClick={() => handleClickPlaylistPersonal(playlist)}
                                                    >
                                                        <div className={`row__item item--playlist ${isPlaylistActive ? "active" : ""} ${isPlaylistPlaying ? "playing" : ""}`}>
                                                            <div className="row__item-container flex--top-left">
                                                                <div className="row__item-display br-5">
                                                                    <div className="row__item-img img--square" style={
                                                                        { "background": `url(${playlist.playlist_image}) no-repeat center center / cover` }
                                                                    }>
                                                                    </div>
                                                                    <div className="row__item-actions">
                                                                        {
                                                                            playlist.isdefault === true ? '' : (
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
                                                                                    {
                                                                                        isMine ? (
                                                                                            <i className="btn--icon bi bi-x-lg" onClick={() => handleClickDeletePlaylist(playlist.id)}></i>
                                                                                        ) : (
                                                                                            <i className={`btn--icon icon--heart bi bi-heart${favouritePlaylistIds.has(playlist.id) ? "-fill" : ""} primary`}></i>
                                                                                        )
                                                                                    }
                                                                                </div>
                                                                            )
                                                                        }
                                                                        <div className={`btn--play-playlist `} onClick={(e) => handlePlayPlaylistPersonal(e, playlist)}>
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

                                                                        {
                                                                            playlist.isdefault != null && playlist.isdefault === true ? '' : (
                                                                                <div
                                                                                    className="action-btn"
                                                                                    onClick={(e) => handleTogglePlaylistMenu(e, playlist)}
                                                                                >
                                                                                    <i className="btn--icon bi bi-three-dots"></i>
                                                                                </div>
                                                                            )
                                                                        }

                                                                    </div>
                                                                    <div className="overlay"></div>
                                                                </div>
                                                                <div className="row__item-info" onClick={(e) => { e.stopPropagation();  }} >
                                                                    <a href="#" className="row__info-name is-twoline">{playlist.playlist_name}</a>
                                                                    <h3 className="row__info-creator" onClick= {(e) => {e.stopPropagation()}}>{playlist.username}</h3>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))
                                }
                            </div>
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
