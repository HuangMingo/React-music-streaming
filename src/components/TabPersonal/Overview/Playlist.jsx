import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useMusicContext } from "../../../context/MusicContext";
import { useAuthContext } from "../../../context/AuthContext";
import { DeletePlaylistDialog } from "../DeletePlaylistDialog";
export function Playlist({ playlists = [], onPlaylistsChanged }) {
    const { setPlaylistIndex, setSelectedPlaylist, setCurrentTime, setCurrentSong, setIsPlaying } = useMusicContext();
    const { currentUser } = useAuthContext();
    const navigate = useNavigate();
    //Phân trang cho playlist
    const [currentPage, setCurrentPage] = useState(0);
    //so playlist hien thi tren mot trang
    const [itemsPerPage, setItemsPerPage] = useState(4);
    //useState mo form tao playlist moi
    const [isOpenForm, setOpenForm] = useState(false);
    //useState hien thi diaglog xoa playlist
    const [isDeleting, setIsDeleting] = useState(false);
    //set playlistId can xoa khi click vao icon xoa
    const [playlistIdToDelete, setPlaylistIdToDelete] = useState(null);
    function handleClickDeletePlaylist(playlistId) {
        setPlaylistIdToDelete(playlistId);
        setIsDeleting(true);

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

    function handleClickPlaylist(playlist, index) {
        scrollPersonalContainerToTop();
        const firstSong = playlist?.songs?.[0];
        const hasSongs = Boolean(firstSong);
        setSelectedPlaylist(playlist);
        if (hasSongs) {
            setCurrentSong(firstSong);
            setCurrentTime(0);
            setIsPlaying(true);
        }
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
                                                return (
                                                    <div
                                                        className={`col l-2-4 m-3 c-4 ${playlistIndex === 1 && 'mb-30'}`}
                                                        key={`${absoluteIndex}`}
                                                        onClick={() => handleClickPlaylist(playlist, absoluteIndex)}
                                                    >
                                                        <div className="row__item item--playlist">
                                                            <div className="row__item-container flex--top-left">
                                                                <div className="row__item-display br-5">
                                                                    <div className="row__item-img img--square" style={
                                                                        { "background": `url(${playlist.playlist_image}) no-repeat center center / cover` }
                                                                    }>
                                                                    </div>
                                                                    <div className="row__item-actions">
                                                                        {
                                                                            playlist.isdefault === true ? '' : (
                                                                                <div className="action-btn btn--heart" onClick={(e) => {
                                                                                    //Ngăn sự kiện click lan sang playlist item khi click vào icon xóa
                                                                                    e.stopPropagation();
                                                                                }}>
                                                                                    {
                                                                                        playlist.ismine != null && playlist.ismine === true ? (
                                                                                            <i className="btn--icon bi bi-x-lg" onClick={() => handleClickDeletePlaylist(playlist.id)}></i>
                                                                                        ) : (
                                                                                            <i className="btn--icon icon--heart bi bi-heart-fill primary"></i>
                                                                                        )
                                                                                    }
                                                                                </div>
                                                                            )
                                                                        }
                                                                        <div className="btn--play-playlist">
                                                                            <div className="control-btn btn-toggle-play">
                                                                                <i className="bi bi-play-fill"></i>
                                                                            </div>
                                                                        </div>
                                                                        {
                                                                            playlist.isdefault != null && playlist.isdefault === true ? '' : (
                                                                                <div className="action-btn">
                                                                                    <i className="btn--icon bi bi-three-dots"></i>
                                                                                </div>
                                                                            )
                                                                        }

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
                                    ))
                                }
                            </div>
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