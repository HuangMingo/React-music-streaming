import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import axios from "axios";
import { ArtistNameLink } from "../ArtistNameLink/ArtistNameLink.jsx";
import { LoadingState } from "../LoadingState/LoadingState.jsx";
import { useAuthContext } from "../../context/AuthContext.jsx";
import { useMusicContext } from "../../context/MusicContext.jsx";
import { API_URL } from "../../api.js";

function formatFollowers(followers) {
    const value = Number(followers) || 0;
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
}

function getArtistImage(artist) {
    return artist?.image || artist?.avatar || "/assets/img/avatars/avatar.jpg";
}

function getFollowersCount(artist) {
    // Backend có thể trả nhiều tên field khác nhau tùy query/service.
    // Gom về một hàm để phần render không phải lặp lại logic fallback.
    return artist?.followersCount ?? artist?.followers_count ?? artist?.follower_count ?? artist?.followers ?? 0;
}

export function Artist() {
    const { currentUser } = useAuthContext();
    const {
        artistFollowersCount,
        toggleFollowArtist,
        isArtistFollowed,
        syncArtistFollowStatus,
        syncArtistFollowersCount,
    } = useMusicContext();
    const [artists, setArtists] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    useEffect(() => {
        // Trang này chỉ có dữ liệu khi user đã đăng nhập.
        // Nếu logout hoặc chưa có currentUser thì xóa list cũ để tránh hiển thị nhầm dữ liệu user trước.
        if (!currentUser?.id) {
            setArtists([]);
            return;
        }

        // mounted dùng để tránh setState sau khi component unmount
        // hoặc user chuyển tab trong lúc request API vẫn đang chạy.
        let mounted = true;

        async function loadFollowedArtists() {
            setLoading(true);
            try {
                // Lấy danh sách nghệ sĩ mà user hiện tại đã follow từ backend.
                // API nhận userId qua query để service lọc theo bảng artist_follow.
                const response = await axios.get(`${API_URL}/api/artists/followed-artists`, {
                    params: { userId: currentUser.id },
                });
                const nextArtists = Array.isArray(response?.data) ? response.data : [];

                if (!mounted) return;

                setArtists(nextArtists);
                // Khi danh sách được load lại, đưa carousel về trang đầu để tránh currentPage
                // đang trỏ tới một trang không còn tồn tại sau khi dữ liệu thay đổi.
                setCurrentPage(0);
                // ArtistDetail, SearchResults và trang cá nhân cùng đọc follow state từ MusicContext.
                // Vì endpoint này trả toàn bộ artist đã follow, ta đồng bộ ngay vào context để
                // nút "Đang theo dõi" và follower count nhất quán giữa các màn.
                nextArtists.forEach((artist) => {
                    syncArtistFollowStatus(artist.id, true);
                    syncArtistFollowersCount(artist.id, getFollowersCount(artist));
                });
            } catch (error) {
                if (mounted) {
                    setArtists([]);
                }
                console.error("Load followed artists failed:", error);
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        loadFollowedArtists();

        return () => {
            mounted = false;
        };
    }, [currentUser?.id]);

    useEffect(() => {
        // Giữ carousel vừa với số cột đang hiển thị theo breakpoint hiện có của CSS.
        // Desktop: 5 item, tablet: 4 item, mobile: 2 item.
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

    const totalPages = Math.max(1, Math.ceil(artists.length / itemsPerPage));
    const pagedArtists = useMemo(() => {
        // Chia danh sách artist thành từng "page" để track có thể translateX theo 100%.
        // Cách này tái sử dụng layout carousel cũ thay vì đổi sang scroll ngang mới.
        const pages = [];

        for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
            pages.push(artists.slice(pageIndex * itemsPerPage, pageIndex * itemsPerPage + itemsPerPage));
        }

        return pages;
    }, [artists, itemsPerPage, totalPages]);

    useEffect(() => {
        // Nếu user unfollow làm số page giảm, đảm bảo currentPage không vượt quá page cuối.
        setCurrentPage((prevPage) => Math.min(prevPage, totalPages - 1));
    }, [totalPages]);

    function handlePrevPage() {
        setCurrentPage((prevPage) => Math.max(prevPage - 1, 0));
    }

    function handleNextPage() {
        setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages - 1));
    }

    async function handleToggleFollow(event, artistId) {
        event.stopPropagation();
        // toggleFollowArtist gọi API follow/unfollow và cập nhật MusicContext.
        // Không xóa card khỏi danh sách ngay sau khi unfollow để user có thể bấm nhầm
        // rồi follow lại ngay tại chỗ; danh sách sẽ được lấy lại đúng trạng thái khi reload/mount lại.
        await toggleFollowArtist(artistId);
    }

    const isFirstPage = currentPage === 0;
    const isLastPage = currentPage === totalPages - 1;

    return (
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
                {loading ? (
                    <LoadingState />
                ) : artists.length === 0 ? (
                    <div className="box--no-content">
                        <div className="no-content-image" style={{color: "black"}}>
                           <i class="icon main-icon ic-svg-artist-icon"></i>
                        </div>
                        <span className="no-content-text">Dõi theo người bạn thích</span>
                    </div>
                ) : (
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
                                            // Ưu tiên dữ liệu trong MusicContext vì count có thể vừa được cập nhật
                                            // sau khi user follow/unfollow ở màn khác.
                                            const isFollowing = isArtistFollowed(artist.id);
                                            const followersCount = artistFollowersCount[artist.id] ?? getFollowersCount(artist);

                                            return (
                                                <div className="col l-2-4 m-3 c-6" key={artist.id ?? absoluteIndex}>
                                                    <div className="row__item item--artist">
                                                        <div className="row__item-container flex--top-left">
                                                            <div className="row__item-display is-rounded">
                                                                <div
                                                                    className="row__item-img img--square is-rounded"
                                                                    style={{ background: `url(${getArtistImage(artist)}) no-repeat center center / cover` }}
                                                                ></div>
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
                                                                    <ArtistNameLink artist={artist} className="row__info-name is-ghost mt-15 lh-19 text-center">
                                                                        {artist.name}
                                                                        <i className="bi bi-star-fill row__info-icon">
                                                                            <div className="icon-overlay"></div>
                                                                        </i>
                                                                    </ArtistNameLink>
                                                                    <h3 className="row__info-creator text-center">{formatFollowers(followersCount)} người theo dõi</h3>
                                                                </div>
                                                            </div>
                                                            <div className="row__item-btn">
                                                                <button
                                                                    className={`button is-small ${isFollowing ? "button-primary artist__follow-btn" : "artist__follow-btn artist__follow-btn--ghost"}`}
                                                                    onClick={(event) => handleToggleFollow(event, artist.id)}
                                                                    type="button"
                                                                    aria-pressed={isFollowing}
                                                                >
                                                                    <i className={isFollowing ? "bi bi-check2" : ""}></i>
                                                                    <span>&nbsp;{isFollowing ? "Đang theo dõi" : "Theo dõi"}</span>
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
                )}
            </div>
        </div>
    );
}
