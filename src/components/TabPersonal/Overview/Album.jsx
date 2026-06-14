import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArtistNameLink } from "../../ArtistNameLink/ArtistNameLink.jsx";
import { useAuthContext } from "../../../context/AuthContext.jsx";
import { useMusicContext } from "../../../context/MusicContext.jsx";
import { API_URL } from "../../../api.js";

function createSlug(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function getAlbumTitle(album) {
    return album?.title || album?.name || album?.album_name || "Album";
}

function getImage(album) {
    return album?.image || album?.playlist_image || "/assets/img/avatars/avatar.jpg";
}

function toPlayableAlbum(album) {
    return {
        ...album,
        playlist_name: getAlbumTitle(album),
        playlist_image: getImage(album),
        songs: Array.isArray(album?.songs) ? album.songs : [],
    };
}

export function Album() {
    const navigate = useNavigate();
    const { currentUser } = useAuthContext();
    const {
        favouriteAlbumIds,
        favouriteAlbumVersion,
        toggleFavouriteAlbum,
        setPersonalSelectedPlaylist,
        setCurrentSong,
        setCurrentTime,
        setIsPlaying,
    } = useMusicContext();
    const [albums, setAlbums] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    useEffect(() => {
        if (!currentUser?.id) {
            setAlbums([]);
            return;
        }

        let mounted = true;

        async function loadFavouriteAlbums() {
            try {
                const response = await axios.get(`${API_URL}/api/albums/favourite-albums`, {
                    params: { userId: currentUser.id },
                });

                if (!mounted) {
                    return;
                }

                setAlbums(Array.isArray(response?.data) ? response.data : []);
            } catch (error) {
                if (mounted) {
                    setAlbums([]);
                }
                console.error("Load overview favourite albums failed:", error);
            }
        }

        loadFavouriteAlbums();

        return () => {
            mounted = false;
        };
    }, [currentUser?.id, favouriteAlbumVersion]);

    useEffect(() => {
        function updateItemsPerPage() {
            const width = window.innerWidth;

            if (width < 740) {
                setItemsPerPage(3);
                return;
            }

            if (width < 1024) {
                setItemsPerPage(4);
                return;
            }

            setItemsPerPage(5);
        }

        updateItemsPerPage();
        window.addEventListener("resize", updateItemsPerPage);

        return () => window.removeEventListener("resize", updateItemsPerPage);
    }, []);

    const totalPages = Math.max(1, Math.ceil(albums.length / itemsPerPage));
    const pagedAlbums = useMemo(() => {
        const pages = [];

        for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
            pages.push(albums.slice(pageIndex * itemsPerPage, pageIndex * itemsPerPage + itemsPerPage));
        }

        return pages;
    }, [albums, itemsPerPage, totalPages]);

    useEffect(() => {
        setCurrentPage((prevPage) => Math.min(prevPage, totalPages - 1));
    }, [totalPages]);

    function scrollToPlayMusic(album) {
        const albumData = toPlayableAlbum(album);
        const slug = createSlug(albumData.playlist_name);
        if (!slug) return;

        setPersonalSelectedPlaylist(albumData);
        const personalContainer = document.querySelector(".app__container.tab--personal");
        if (personalContainer) {
            personalContainer.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }
    }

    function playAlbum(event, album) {
        event.stopPropagation();
        const albumData = toPlayableAlbum(album);
        const firstSong = albumData.songs?.[0];

        if (!firstSong) {
            scrollToPlayMusic(album);
            return;
        }

        setPersonalSelectedPlaylist(albumData);
        setCurrentSong(firstSong);
        setCurrentTime(0);
        setIsPlaying(true);
        scrollToPlayMusic(albumData);
    }

    function handlePrevPage() {
        setCurrentPage((prevPage) => Math.max(prevPage - 1, 0));
    }

    function handleNextPage() {
        setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages - 1));
    }

    const isFirstPage = currentPage === 0;
    const isLastPage = currentPage === totalPages - 1;

    if (albums.length === 0) {
        return (
            <div className="box--no-content">
                <span className="no-content-text">Yêu những gì bạn yêu</span>
            </div>

        );
    }

    return (
        <div className="container__section row mt-50">
            <div className="col l-12 m-12 c-12 mb-16">
                <div className="container__header">
                    <NavLink to="album" className="container__header-title">
                        <h3>Album&nbsp;</h3>
                        <i className="bi bi-chevron-right container__header-icon" />
                    </NavLink>
                    <h3 className="container__header-subtitle">Album</h3>
                    <div className="container__header-actions hide-on-tablet-mobile">
                        <div
                            className={`container__move-btn move-btn--album ${isFirstPage ? "button--disabled" : ""}`}
                            onClick={isFirstPage ? undefined : handlePrevPage}
                            role="button"
                            aria-label="Trang trước"
                            aria-disabled={isFirstPage}
                        >
                            <i className="bi bi-chevron-left container__move-btn-icon" />
                        </div>
                        <div
                            className={`container__move-btn move-btn--album ${isLastPage ? "button--disabled" : ""}`}
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
                <div className="row no-wrap album--container album__container">
                    <div className="album__viewport">
                        <div
                            className="album__track"
                            style={{ transform: `translateX(-${currentPage * 100}%)` }}
                        >
                            {pagedAlbums.map((pageAlbums, pageIndex) => (
                                <div className="album__page" key={`album-page-${pageIndex}`}>
                                    {pageAlbums.map((album, albumIndex) => {
                                        const title = getAlbumTitle(album);
                                        const isFavourite = favouriteAlbumIds.has(album.id);

                                        return (
                                            <div className={`col l-2-4 m-3 c-4 ${albumIndex === 1 && "mb-30"}`} key={album.id ?? `${title}-${albumIndex}`} onClick={() => scrollToPlayMusic(album)}>
                                                <div className="row__item item--album">
                                                    <div className="row__item-container flex--top-left">
                                                        <div className="row__item-display br-5">
                                                            <div
                                                                className="row__item-img img--square"
                                                                style={{ background: `url('${getImage(album)}') no-repeat center center / cover` }}
                                                            />
                                                            <div className="row__item-actions">
                                                                <div
                                                                    className="action-btn btn--heart"
                                                                    onClick={(event) => toggleFavouriteAlbum(event, album.id)}
                                                                    title={isFavourite ? "Bỏ thích album" : "Thêm vào album yêu thích"}
                                                                >
                                                                    <i className={`btn--icon icon--heart bi bi-heart${isFavourite ? "-fill" : ""} primary`}></i>
                                                                </div>
                                                                <div className="btn--play-playlist" onClick={(event) => playAlbum(event, album)}>
                                                                    <div className="control-btn btn-toggle-play">
                                                                        <i className="bi bi-play-fill icon-play"></i>
                                                                    </div>
                                                                </div>
                                                                <div className="action-btn" onClick={(event) => event.stopPropagation()}>
                                                                    <i className="btn--icon bi bi-three-dots"></i>
                                                                </div>
                                                            </div>
                                                            <div className="overlay"></div>
                                                        </div>
                                                        <div className="row__item-info">
                                                            <a href="#" className="row__info-name is-twoline" onClick={(event) => event.preventDefault()}>{title}</a>
                                                            {album.artist_name ? (
                                                                <ArtistNameLink artist={album.artist_name} className="row__info-creator" />
                                                            ) : (
                                                                <h3 className="row__info-creator">Đang cập nhật</h3>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
