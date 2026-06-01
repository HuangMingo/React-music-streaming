import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { useMusicContext } from "../../../context/MusicContext.jsx";
import { useAuthContext } from "../../../context/AuthContext.jsx";
import { AddSongToPlaylist } from "../../AddSongToPlaylist/AddSongToPlaylist.jsx";
import { ArtistNameLink } from "../../ArtistNameLink/ArtistNameLink.jsx";
import axios from "axios";
import { API_URL } from '../../../api.js';
export function PlayMusic({ playlist, canRemoveFromCurrentPlaylist, hideHeaderTitle = false }) {
    const { currentSong,
        setCurrentSong,
        setCurrentTime,
        isPlaying,
        setIsPlaying,
        toggleFavouriteSong,
        favouriteSongIds,
        favouritePlaylistIds,
        toggleFavouritePlaylist,
        setFavouriteSongIds,
        handleClickSong,
        playlistMenuRef,
        handleSelectTargetPlaylist,
        selectedPlaylist,
        selectedPlaylistBySong,
        setSelectedPlaylist,
    } = useMusicContext();
    const [openSongMenuId, setOpenSongMenuId] = useState(null);
    //Mở menu khi click vào 3 chấm của bài hát
    function handleToggleSongMenu(event, songId) {
        event.stopPropagation();

        setOpenSongMenuId((prevSongId) =>
            prevSongId === songId ? null : songId
        );
    }
    const { currentUser } = useAuthContext();
    const [slideIndex, setSlideIndex] = useState(0);
    const [userPlaylists, setUserPlaylists] = useState([]);
    const [isAddingSong, setIsAddingSong] = useState(false);

    const visibleSongs = useMemo(() => (playlist?.songs ?? []), [playlist]);
    const slideshowActive = useMemo(() => visibleSongs.length >= 2, [visibleSongs.length]);
    const playlistName = playlist?.playlist_name || playlist?.name || "";

    const formatSongDuration = (song) => {
        const durationInSeconds = Number(song?.duration_seconds ?? song?.duration ?? 0);
        const safeDuration = Number.isFinite(durationInSeconds) ? Math.max(0, durationInSeconds) : 0;
        const mins = Math.floor(safeDuration / 60).toString().padStart(2, "0");
        const secs = Math.floor(safeDuration % 60).toString().padStart(2, "0");
        return `${mins}:${secs}`;
    };

    function handlePlayAll() {
        const firstSong = visibleSongs[0];
        if (!firstSong) {
            return;
        }

        setSelectedPlaylist(playlist);
        setCurrentSong(firstSong);
        setCurrentTime(0);
        setIsPlaying(true);
    }

    function renderPlayAllButton(extraClassName = "") {
        return (
            <button
                className={`button is-small button-primary container__header-btn btn--play-all ${extraClassName}`.trim()}
                onClick={handlePlayAll}>
                <i className="bi bi-play-fill container__header-icon"></i>
                <span>Phát tất cả</span>
            </button>
        );
    }

    //--------------Slide show logic-------------
    useEffect(() => {
        if (!slideshowActive) {
            setSlideIndex(0);
            return;
        }

        const interval = setInterval(() => {
            setSlideIndex((prev) => (visibleSongs.length > 0 ? (prev + 1) % visibleSongs.length : 0));
        }, 3000);

        return () => clearInterval(interval);
    }, [slideshowActive, visibleSongs.length]);


    useEffect(() => {
        if (!currentUser?.id || visibleSongs.length === 0) {
            setFavouriteSongIds(new Set());
            return;
        }

        let isMounted = true;

        async function loadFavouriteStatuses() {
            try {
                const checks = await Promise.all(
                    visibleSongs.map(async (song) => {
                        const response = await axios.get(
                            `${API_URL}/api/songs/is-favourite-song?defaultPlaylistId=${currentUser.defaultPlaylistId}&songId=${song.id}`
                        );
                        return { songId: song.id, isFavourite: Boolean(response?.data?.isFavouriteSong) };
                    })
                );

                if (!isMounted) {
                    return;
                }

                const ids = new Set(
                    checks.filter((item) => item.isFavourite).map((item) => item.songId)
                );
                setFavouriteSongIds(ids);
            } catch (error) {
                console.error("Load favourite statuses failed:", error);
            }
        }

        loadFavouriteStatuses();

        return () => {
            isMounted = false;
        };
    }, [visibleSongs, currentUser?.id]);

    useEffect(() => {
        if (!currentUser?.id) {
            setUserPlaylists([]);
            return;
        }

        let isMounted = true;
        //Tải danh sách playlist của người dùng
        async function loadUserPlaylists() {
            try {
                const response = await axios.get(
                    `${API_URL}/api/playlists/user-created-playlists?userId=${currentUser.id}`
                );

                if (!isMounted) {
                    return;
                }

                setUserPlaylists(Array.isArray(response?.data) ? response.data : []);
            } catch (error) {
                if (isMounted) {
                    setUserPlaylists([]);
                }
                console.error("Load user playlists failed:", error);
            }
        }

        loadUserPlaylists();

        return () => {
            isMounted = false;
        };
    }, [currentUser?.id]);
    //--------------Xử lí khi click bên ngoài----------
    useEffect(() => {
        function handleClickOutside(event) {
            if (playlistMenuRef.current && !playlistMenuRef.current.contains(event.target)) {
                setOpenSongMenuId(null);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const currentSlideClasses = (index) => {
        if (!slideshowActive || visibleSongs.length < 2) {
            return "container__slide-item single";
        }

        const relativeIndex = (index - slideIndex + visibleSongs.length) % visibleSongs.length;
        if (relativeIndex === 0) return "container__slide-item first";
        if (relativeIndex === 1) return "container__slide-item second";
        if (relativeIndex === 2) return "container__slide-item third";
        return "container__slide-item fourth";
    };

    return (
        <>
            <div className="container__control row">
                {!hideHeaderTitle && <div className="col l-12 m-12 c-12 mb-10">
                    <div className="container__header">
                        <>
                            <NavLink className="container__header-title" to="song">
                                <h3>Bài Hát&nbsp;</h3>
                                <i className="bi bi-chevron-right container__header-icon" />
                            </NavLink>
                            <h3 className="container__header-subtitle">Bài Hát</h3>
                        </>
                        <div className="container__header-actions">

                            {renderPlayAllButton()}
                        </div>
                    </div>
                </div>}
                <div className="col l-12 m-12 c-12">
                    <div className={`container__playmusic ${hideHeaderTitle ? "playlist-detail__playmusic" : ""}`}>
                        {!playlist || !playlist.songs || playlist.songs.length === 0 ? (
                            <div className="box--no-content">
                                <div className="no-content-image" />
                                <span className="no-content-text">
                                    Chưa có bài hát nào trong playlist này!
                                </span>
                            </div>
                        ) : (
                            <>
                                <div className={`container__slide hide-on-mobile ${hideHeaderTitle ? "playlist-detail__slide" : ""}`}>
                                    <div className="container__slide-show">
                                        {visibleSongs.map((song, songIndex) => {
                                            const className = currentSlideClasses(songIndex);
                                            return (
                                                <div className={className} key={`${song.name}-${songIndex}`}>
                                                    <div className="container__slide-img" style={{ background: `url(${song.image}) no-repeat center center / cover` }}></div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {hideHeaderTitle ? (
                                        <div className="playlist-detail__summary">
                                            <h2 className="playlist-detail__name">{playlistName}</h2>
                                            <div className="playlist-detail__actions">
                                                {renderPlayAllButton("playlist-detail__play-all")}
                                                <div
                                                    className="action-btn btn--heart"
                                                    onClick={(event) => toggleFavouritePlaylist(event, playlist.id)}
                                                    title={favouritePlaylistIds.has(playlist.id) ? "Bỏ thích playlist" : "Thêm vào playlist yêu thích"}
                                                >
                                                    <i className={`btn--icon icon--heart bi bi-heart${favouritePlaylistIds.has(playlist.id) ? "-fill" : ""} primary`}></i>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                                <div className="container__playlist">
                                    <div className="playlist__list">
                                        {playlist?.songs?.map((song, index) => {
                                            return (
                                                <div className={`playlist__list-song media ${currentSong?.id === song.id ? 'active' : ''} ${currentSong?.id === song.id && isPlaying ? 'playing' : ''}`} key={song.id} onClick={() => {
                                                    handleClickSong(song);
                                                    setSelectedPlaylist(playlist);
                                                }
                                                }>
                                                    <div className="playlist__song-info media__left">
                                                        <div className="playlist__song-thumb media__thumb mr-10"
                                                            style={{
                                                                "background": `url(${song.image}) no-repeat center center / cover`
                                                            }}>
                                                            <span className="song-note note-1">♪</span>
                                                            <span className="song-note note-2">♫</span>
                                                            <span className="song-note note-3">♪</span>
                                                            <span className="song-note note-4">♫</span>
                                                            <div className="thumb--animate" >
                                                                <div className="thumb--animate-img" style={{ "background": "url('./../assets/img/SongActiveAnimation/icon-playing.gif') no-repeat 50% / contain" }}>

                                                                </div>
                                                            </div>
                                                            <div className="play-song--actions">
                                                                <div className="control-btn btn-toggle-play btn--play-song">
                                                                    <i className="bi bi-play-fill"></i>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="playlist__song-body media__info">
                                                            <span className="playlist__song-title info__title">{song.title}</span>
                                                            <p className="playlist__song-author info__author">
                                                                {
                                                                    song?.artist_names?.map((artist, i) => {
                                                                        return (
                                                                            <span key={i}>
                                                                                <ArtistNameLink artist={artist} />
                                                                                {i < song?.artist_names?.length - 1 && ', '}
                                                                            </span>
                                                                        );
                                                                    })
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="playlist__song-time media__content">
                                                        {
                                                            `${Math.floor(song.duration_seconds / 60).toString().padStart(2, '0')}:${Math.floor(song.duration_seconds % 60).toString().padStart(2, '0')}`
                                                        }
                                                    </span>

                                                    <div className="playlist__song-option song--tab media__right hide-on-mobile">
                                                        {/* <div className="playlist__song-btn btn--mic option-btn">
                                                            <i className="btn--icon song__icon bi bi-mic-fill"></i>
                                                        </div> */}
                                                        <div className="playlist__song-btn btn--heart option-btn" onClick={(event) => toggleFavouriteSong(event, song.id)}
                                                            title={favouriteSongIds.has(song.id) ? "Bỏ thích bài hát" : "Thêm vào bài hát yêu thích"}
                                                        >
                                                            <i className={`btn--icon song__icon icon--heart bi bi-heart${favouriteSongIds.has(song.id) ? '-fill' : ''} primary`}></i>
                                                        </div>
                                                        <div className="playlist__song-btn option-btn playlist__song-more" onClick={(event) => handleToggleSongMenu(event, song.id)} ref={openSongMenuId === song.id ? playlistMenuRef : null}
                                                            title="Khác"
                                                        >
                                                            <i className="btn--icon bi bi-three-dots"></i>
                                                            <AddSongToPlaylist
                                                                song={song}
                                                                isOpen={openSongMenuId === song.id}
                                                                playlists={userPlaylists}
                                                                selectedTargetPlaylist={selectedPlaylistBySong[song.id] ?? ""}
                                                                onSelectPlaylist={handleSelectTargetPlaylist}
                                                                canRemoveFromCurrentPlaylist={!playlist.isdefault && Number(playlist?.creator_id) === Number(currentUser?.id)}
                                                                isAddingSong={isAddingSong}
                                                                onCloseMenu={() => setOpenSongMenuId(null)}
                                                            />
                                                        </div>
                                                    </div>

                                                </div>
                                            )
                                        })}
                                    </div >
                                </div >
                            </>
                        )}
                    </div >
                </div >
            </div >
        </>
    )
}
