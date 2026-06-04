import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ArtistNameLink } from "../ArtistNameLink/ArtistNameLink.jsx";
import { useAuthContext } from "../../context/AuthContext.jsx";
import { useMusicContext } from "../../context/MusicContext.jsx";
import { API_URL } from "../../api.js";

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

export function AlbumSection() {
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
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!currentUser?.id) {
            setAlbums([]);
            return;
        }

        let mounted = true;

        async function loadFavouriteAlbums() {
            setLoading(true);
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
                console.error("Load favourite albums failed:", error);
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        loadFavouriteAlbums();

        return () => {
            mounted = false;
        };
    }, [currentUser?.id, favouriteAlbumVersion]);

    function navigateToAlbum(album) {
        const albumData = toPlayableAlbum(album);
        const slug = createSlug(albumData.playlist_name);
        if (!slug) return;

        setPersonalSelectedPlaylist(albumData);
        navigate(`/playlist/${slug}`, {
            state: {
                playlistId: albumData.id,
                playlist: albumData,
            },
        });
    }

    function playAlbum(event, album) {
        event.stopPropagation();
        const albumData = toPlayableAlbum(album);
        const firstSong = albumData.songs?.[0];

        if (!firstSong) {
            navigateToAlbum(album);
            return;
        }

        setPersonalSelectedPlaylist(albumData);
        setCurrentSong(firstSong);
        setCurrentTime(0);
        setIsPlaying(true);
        navigateToAlbum(albumData);
    }

    return (
        <div className="grid container__tab tab-album active">
            <div className="container__section row">
                <div className="col l-12 m-12 c-12 mb-16">
                    <div className="container__header">
                        <a href="#" className="container__header-title" onClick={(event) => event.preventDefault()}>
                            <h3>Album&nbsp;</h3>
                        </a>
                    </div>
                </div>
                <div className="col l-12 m-12 c-12">
                    <div className="row album--container">
                        {loading ? (
                            <div className="loader">Đang tải...</div>
                        ) : albums.length === 0 ? (
                            <div className="box--no-content">
                                <div className="no-content-image">
                                    <i className="bi bi-music-note-beamed" style={{ color: "black" }}></i>
                                </div>
                                <span className="no-content-text">Bạn chưa có album yêu thích nào.</span>
                            </div>
                        ) : (
                            albums.map((album, index) => {
                                const title = getAlbumTitle(album);
                                const isFavourite = favouriteAlbumIds.has(album.id);

                                return (
                                    <div className="col l-2-4 m-3 c-6 mb-30" key={album.id ?? `${title}-${index}`} onClick={() => navigateToAlbum(album)}>
                                        <div className="row__item item--album">
                                            <div className="row__item-container flex--top-left">
                                                <div className="row__item-display br-5">
                                                    <div
                                                        className="row__item-img img--square"
                                                        style={{ background: `url('${getImage(album)}') no-repeat center center / cover` }}
                                                    ></div>
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
                                                    <p className="row__info-creator">
                                                        {album.artist_name ? (
                                                            <ArtistNameLink artist={album.artist_name} className="row__info-creator" />
                                                        ) : (
                                                            "Đang cập nhật"
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
