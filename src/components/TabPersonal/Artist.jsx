import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom"
import { ARTIST_STORAGE_KEY } from "./../../../public/data/artists.js";
const ARTIST_FOLLOW_STORAGE_KEY = "ARTIST_FOLLOW_STORAGE_KEY";

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

    const artists = JSON.parse(localStorage.getItem(ARTIST_STORAGE_KEY) || "[]");
    const [currentPage, setCurrentPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [followedArtistIds, setFollowedArtistIds] = useState(() => {
        try {
            const savedFollowedArtistIds = JSON.parse(localStorage.getItem(ARTIST_FOLLOW_STORAGE_KEY) || "null");
            if (Array.isArray(savedFollowedArtistIds)) {
                return savedFollowedArtistIds;
            }
        } catch (error) {
            console.error(error);
        }

        return artists.map((artist) => artist.id);
    });

    useEffect(() => {
        function updateItemsPerPage() {
            const width = window.innerWidth;

            if (width < 740) {
                setItemsPerPage(2);
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

    useEffect(() => {
        localStorage.setItem(ARTIST_FOLLOW_STORAGE_KEY, JSON.stringify(followedArtistIds));
    }, [followedArtistIds]);

    const totalPages = Math.max(1, Math.ceil(artists.length / itemsPerPage));
    const pagedArtists = useMemo(() => {
        const pages = [];

        for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
            pages.push(artists.slice(pageIndex * itemsPerPage, pageIndex * itemsPerPage + itemsPerPage));
        }

        return pages;
    }, [artists, itemsPerPage, totalPages]);

    useEffect(() => {
        setCurrentPage((prevPage) => Math.min(prevPage, totalPages - 1));
    }, [totalPages]);

    function handlePrevPage() {
        setCurrentPage((prevPage) => Math.max(prevPage - 1, 0));
    }

    function handleNextPage() {
        setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages - 1));
    }

    function handleToggleFollow(artistId) {
        setFollowedArtistIds((currentIds) => {
            if (currentIds.includes(artistId)) {
                return currentIds.filter((id) => id !== artistId);
            }

            return [...currentIds, artistId];
        });
    }

    const isFirstPage = currentPage === 0;
    const isLastPage = currentPage === totalPages - 1;

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
                            <div
                                className={`container__move-btn move-btn--artist ${isFirstPage ? "button--disabled" : ""}`}
                                onClick={isFirstPage ? undefined : handlePrevPage}
                                role="button"
                                aria-label="Trang trước"
                                aria-disabled={isFirstPage}
                            >
                                <i className="bi bi-chevron-left container__move-btn-icon" />
                            </div>
                            <div
                                className={`container__move-btn move-btn--artist ${isLastPage ? "button--disabled" : ""}`}
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
                    <div className="row no-wrap artist--container artist__container">
                        <div className="artist__viewport">
                            <div
                                className="artist__track"
                                style={{ transform: `translateX(-${currentPage * 100}%)` }}
                            >
                                {pagedArtists.map((pageArtists, pageIndex) => (
                                    <div className="artist__page" key={`artist-page-${pageIndex}`}>
                                        {pageArtists.map((artist, artistIndex) => {
                                            const absoluteIndex = pageIndex * itemsPerPage + artistIndex;
                                            const isFollowing = followedArtistIds.includes(artist.id);

                                            return (
                                                <div className="col l-2-4 m-3 c-6" key={absoluteIndex}>
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
                                                                <button
                                                                    className={`button is-small ${isFollowing ? "button-primary artist__follow-btn" : "artist__follow-btn artist__follow-btn--ghost"}`}
                                                                    onClick={() => handleToggleFollow(artist.id)}
                                                                    type="button"
                                                                    aria-pressed={isFollowing}
                                                                >
                                                                    <i className={isFollowing ? "bi bi-check2" : ""}></i>
                                                                    <span>&nbsp;{isFollowing ? "Đã quan tâm" : "Quan tâm"}</span>
                                                                </button>
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
            </div >
        </>
    )
}