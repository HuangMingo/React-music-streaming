import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ArtistNameLink } from "../ArtistNameLink/ArtistNameLink.jsx";
import { LoadingState } from "../LoadingState/LoadingState.jsx";
import { useMusicContext } from "../../context/MusicContext.jsx";
import { API_URL } from "../../api.js";

function getAlbumName(album) {
    return album?.playlist_name || album?.title || album?.name || album?.album_name || "Album";
}

function getImage(album) {
    return album?.image || album?.playlist_image || "/assets/img/avatars/avatar.jpg";
}

function toPlayableAlbum(album) {
    return {
        ...album,
        playlist_name: getAlbumName(album),
        playlist_image: getImage(album),
        songs: Array.isArray(album?.songs) ? album.songs : [],
    };
}

export function BestAlbums() {
    const navigate = useNavigate();
    const {
        setExploreSelectedPlaylist,
        setCurrentSong,
        setCurrentTime,
        setIsPlaying,
        favouriteAlbumIds,
        toggleFavouriteAlbum,
    } = useMusicContext();
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let mounted = true;

        async function loadRandomAlbums() {
            setLoading(true);
            try {
                const response = await axios.get(`${API_URL}/api/albums/random-albums?limit=6`);

                if (!mounted) {
                    return;
                }

                setAlbums(Array.isArray(response?.data) ? response.data : []);
            } catch (error) {
                if (mounted) {
                    setAlbums([]);
                }
                console.error("Load random albums failed:", error);
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        loadRandomAlbums();

        return () => {
            mounted = false;
        };
    }, []);

    function navigateToAlbum(album) {
        const albumData = toPlayableAlbum(album);
        if (!albumData?.id) return;

        navigate(`/album/${albumData.id}`, {
            state: {
                playlistId: albumData.id,
                playlist: albumData,
            },
        });
    }

    async function loadAlbumDetails(album) {
        if (album?.songs?.length) {
            return toPlayableAlbum(album);
        }

        if (!album?.id) {
            return toPlayableAlbum(album);
        }

        const response = await axios.get(`${API_URL}/api/albums/${album.id}`);
        return toPlayableAlbum(response.data);
    }

    async function handlePlayAlbum(event, album) {
        event.stopPropagation();

        try {
            const albumData = await loadAlbumDetails(album);
            const firstSong = albumData?.songs?.[0];

            if (!firstSong) {
                navigateToAlbum(albumData);
                return;
            }

            setExploreSelectedPlaylist(albumData);
            setCurrentSong(firstSong);
            setCurrentTime(0);
            setIsPlaying(true);
            navigateToAlbum(albumData);
        } catch (error) {
            console.error("Play album failed:", error);
        }
    }

    return (
        <div className="row container__section mt-30">
            <div className="col l-12 m-12 c-12 mb-16">
                <div className="container__header">
                    <a href="#" className="container__header-title">
                            <h3 className="container__header-title">Album nổi bật</h3>
                    </a>
                        <h3 className="container__header-subtitle">Album nổi bật</h3>
                </div>
            </div>
            <div className="col l-12 m-12 c-12">
                <div className="row no-wrap new-playlist--container search-page__card-track">
                    {loading ? (
                        <LoadingState />
                    ) : albums.length === 0 ? (
                        <div className="box--no-content">
                            <span className="no-content-text">Chưa có album nổi bật</span>
                        </div>
                    ) : (
                        albums.map((album, index) => {
                            const albumName = getAlbumName(album);
                            const isFavouriteAlbum = favouriteAlbumIds.has(album.id);

                            return (
                                <div className="search-page__card-col" key={album.id ?? `${albumName}-${index}`}>
                                    <div className="row__item item--playlist search-page__card" onClick={() => navigateToAlbum(album)}>
                                        <div className="row__item-container flex--top-left">
                                            <div className="row__item-display br-5 search-page__card-display">
                                                <div className="row__item-img img--square" style={{ background: `url(${getImage(album)}) no-repeat center center / cover`, overflow: "hidden" }} />
                                                <div className="row__item-actions">
                                                    <div
                                                        className="action-btn btn--heart"
                                                        onClick={(event) => toggleFavouriteAlbum(event, album.id)}
                                                        title={isFavouriteAlbum ? "Bỏ thích album" : "Thêm vào album yêu thích"}
                                                    >
                                                        <i className={`btn--icon icon--heart bi bi-heart${isFavouriteAlbum ? "-fill" : ""} primary`} />
                                                    </div>
                                                    <div className="btn--play-playlist" onClick={(event) => handlePlayAlbum(event, album)}>
                                                        <div className="control-btn btn-toggle-play"><i className="bi bi-play-fill" /></div>
                                                        <span className="song-note note-1">♪</span>
                                                        <span className="song-note note-2">♫</span>
                                                        <span className="song-note note-3">♪</span>
                                                        <span className="song-note note-4">♫</span>
                                                    </div>
                                                    <div className="action-btn" onClick={(event) => event.stopPropagation()}>
                                                        <i className="btn--icon bi bi-three-dots"></i>
                                                    </div>
                                                </div>
                                                <div className="overlay" />
                                            </div>
                                            <div className="row__item-info search-page__card-info">
                                                <span className="row__info-name is-twoline">{albumName}</span>
                                                <h3 className="row__info-creator">
                                                    {album.artist_name ? <ArtistNameLink artist={album.artist_name} className="row__info-creator" /> : "Album"}
                                                </h3>
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
    );
}
