import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { LoadingState } from "../LoadingState/LoadingState.jsx";
import { useAuthContext } from "../../context/AuthContext.jsx";
import { useMusicContext } from "../../context/MusicContext.jsx";
import { API_URL } from "../../api.js";

function getImage(playlist) {
    return playlist?.image || playlist?.playlist_image || "/assets/img/avatars/avatar.jpg";
}

export function PlaylistOfDay() {
    const navigate = useNavigate();
    const { currentUser } = useAuthContext();
    const {
        setExploreSelectedPlaylist,
        setCurrentSong,
        setCurrentTime,
        setIsPlaying,
        favouritePlaylistIds,
        toggleFavouritePlaylist,
    } = useMusicContext();
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let mounted = true;

        async function loadRandomPlaylists() {
            setLoading(true);
            try {
                const response = await axios.get(`${API_URL}/api/playlists/random-playlists?limit=6`);

                if (!mounted) {
                    return;
                }

                setPlaylists(Array.isArray(response?.data) ? response.data : []);
            } catch (error) {
                if (mounted) {
                    setPlaylists([]);
                }
                console.error("Load random playlists failed:", error);
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        loadRandomPlaylists();

        return () => {
            mounted = false;
        };
    }, []);

    function navigateToPlaylist(playlist) {
        if (!playlist?.id) return;

        navigate(`/playlist/${playlist.id}`, {
            state: {
                playlistId: playlist.id,
                playlist,
            },
        });
    }

    async function loadPlaylistDetails(playlist) {
        if (playlist?.songs?.length) {
            return playlist;
        }

        if (!playlist?.id) {
            return playlist;
        }

        const response = await axios.get(`${API_URL}/api/playlists/playlist-details`, {
            params: {
                playlistId: playlist.id,
            },
        });

        return response.data;
    }

    async function handlePlayPlaylist(event, playlist) {
        event.stopPropagation();

        try {
            const playlistData = await loadPlaylistDetails(playlist);
            const firstSong = playlistData?.songs?.[0];

            if (!firstSong) {
                navigateToPlaylist(playlist);
                return;
            }

            setExploreSelectedPlaylist(playlistData);
            setCurrentSong(firstSong);
            setCurrentTime(0);
            setIsPlaying(true);
            navigate(`/playlist/${playlistData?.id ?? playlist?.id}`, {
                state: {
                    playlistId: playlistData?.id ?? playlist?.id,
                    playlist: playlistData,
                },
            });
        } catch (error) {
            console.error("Play playlist failed:", error);
        }
    }

    return (
        <>
            <div className="row container__section mt-30">
                <div className="col l-12 m-12 c-12 mb-16">
                    <div className="container__header">
                        <a href="#" className="container__header-title">
                            <h3>Dành cho bạn</h3>
                        </a>
                        <h3 className="container__header-subtitle">
                            Dành cho bạn
                        </h3>
                    </div>
                </div>
                <div className="col l-12 m-12 c-12">
                    <div className="row no-wrap fav-artist--container search-page__card-track">
                        {loading ? (
                            <LoadingState />
                        ) : playlists.length === 0 ? (
                            <div className="box--no-content">
                                <span className="no-content-text">Chưa có playlist dành cho bạn</span>
                            </div>
                        ) : (
                            playlists.map((playlist, index) => {
                                const playlistName = playlist?.playlist_name || playlist?.name || "Playlist";
                                const isMine = Number(playlist.creator_id) === Number(currentUser?.id);
                                const isFavouritePlaylist = favouritePlaylistIds.has(playlist.id);

                                return (
                                    <div className="search-page__card-col" key={playlist.id ?? `${playlistName}-${index}`}>
                                        <div className="row__item item--playlist search-page__card" onClick={() => navigateToPlaylist(playlist)}>
                                            <div className="row__item-container flex--top-left">
                                                <div className="row__item-display br-5 search-page__card-display">
                                                    <div className="row__item-img img--square" style={{ background: `url(${getImage(playlist)}) no-repeat center center / cover`, overflow: "hidden" }} />
                                                    <div className="row__item-actions">
                                                        <div
                                                            className="action-btn btn--heart"
                                                            onClick={(event) => {
                                                               
                                                                toggleFavouritePlaylist(event, playlist.id);
                                                            }}
                                                            title={!isMine ? (isFavouritePlaylist ? "Bỏ thích playlist" : "Thêm vào playlist yêu thích") : undefined}
                                                        >
                                                            <i className={`btn--icon icon--heart bi bi-heart${isFavouritePlaylist ? "-fill" : ""} primary`} />
                                                        </div>
                                                        <div className="btn--play-playlist" onClick={(event) => handlePlayPlaylist(event, playlist)}>
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
                                                    <span className="row__info-name is-twoline">{playlistName}</span>
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
        </>
    )
}
