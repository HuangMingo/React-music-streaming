import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { ALBUM_STORAGE_KEY } from "./../../../../public/data/albums.js";

export function Album() {
    const albums = JSON.parse(localStorage.getItem(ALBUM_STORAGE_KEY) || "[]");
    const [currentPage, setCurrentPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(5);

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
                                            const absoluteIndex = pageIndex * itemsPerPage + albumIndex;

                                            return (
                                                <div className={`col l-2-4 m-3 c-4 ${albumIndex === 1 && 'mb-30'}`} key={absoluteIndex}>
                                                    <div className="row__item item--album">
                                                        <div className="row__item-container flex--top-left">
                                                            <div className="row__item-display br-5">
                                                                <div
                                                                    className="row__item-img img--square"
                                                                    style={{ background: `url('${album.image}') no-repeat center center / cover` }}
                                                                />
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
                                                                {
                                                                    album.singers?.map((singer, index) =>
                                                                    (
                                                                        <>
                                                                            <a href="#" className="row__info-creator" key={index}>
                                                                                {singer}
                                                                            </a>
                                                                            {index < album.singers.length - 1 && ', '}
                                                                        </>

                                                                    )

                                                                )
                                                                }

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
        </>
    );
}