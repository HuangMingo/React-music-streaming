import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useMusicContext } from "../../context/MusicContext";
import { useAuthContext } from "../../context/AuthContext";
import { showNotificationToast } from "../../toast";

const SONGS_PER_COLUMN = 3;
const NUM_COLUMNS = 2;

export function AllSongs() {
    const { setCurrentSong,
        setCurrentTime,
        setIsPlaying,
        isPlaying,
        currentSong,
        handleClickSong,
        favouriteSongIds,
        setFavouriteSongIds,
        toggleFavouriteSong } = useMusicContext();
    const { currentUser } = useAuthContext();
    const [allSongs, setAllSongs] = useState([]);

    const [isLoading, setIsLoading] = useState(false);
    const [userPlaylists, setUserPlaylists] = useState([]);
    const [openSongMenuId, setOpenSongMenuId] = useState(null);
    const [selectedPlaylistBySong, setSelectedPlaylistBySong] = useState({});
    const [isAddingSong, setIsAddingSong] = useState(false);
    const playlistMenuRef = useRef(null);
    const fetchSong = function () {
        setIsLoading(true);
        axios
            .get("http://localhost:3000/api/songs")
            .then((response) => {
                setAllSongs(Array.isArray(response?.data) ? response.data : []);
            })
            .catch((error) => {
                console.error("Fetch all songs failed:", error);
                setAllSongs([]);
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    // Chia bài hát thành 2 cột, mỗi cột 3 bài hát
    const songColumns = useMemo(() => {
        const columns = [];
        for (let colIndex = 0; colIndex < NUM_COLUMNS; colIndex++) {
            const columnSongs = [];
            for (let rowIndex = 0; rowIndex < SONGS_PER_COLUMN; rowIndex++) {
                const songIndex = colIndex * SONGS_PER_COLUMN + rowIndex;
                if (songIndex < allSongs.length) {
                    columnSongs.push(allSongs[songIndex]);
                }
            }
            columns.push(columnSongs);
        }
        return columns;
    }, [allSongs]);

    function handleToggleSongMenu(event, songId) {
        event.stopPropagation();
        setOpenSongMenuId((prevSongId) => (prevSongId === songId ? null : songId));
    }

    function handleSelectTargetPlaylist(songId, playlistId) {
        setSelectedPlaylistBySong((prev) => ({
            ...prev,
            [songId]: playlistId,
        }));
    }

    async function handleAddSongToPlaylist(event, songId) {
        event.stopPropagation();
        const playlistId = Number(selectedPlaylistBySong[songId]);

        if (!playlistId || !songId) {
            showNotificationToast("Vui lòng chọn playlist trước khi thêm");
            return;
        }

        try {
            setIsAddingSong(true);
            await axios.post("http://localhost:3000/api/playlists/add-song-to-playlist", null, {
                params: { playlistId, songId },
            });
            showNotificationToast("Đã thêm bài hát vào playlist");
            setOpenSongMenuId(null);
        } catch (error) {
            console.error("Add song to playlist failed:", error);
            showNotificationToast("Không thể thêm bài hát vào playlist");
        } finally {
            setIsAddingSong(false);
        }
    }

    useEffect(() => {
        if (!currentUser?.id || allSongs.length === 0) {
            setFavouriteSongIds(new Set());
            return;
        }
        let isMounted = true;
        async function loadFavouriteStatuses() {
            try {
                const checks = await Promise.all(
                    allSongs.map(async (song) => {
                        const response = await axios.get(
                            `http://localhost:3000/api/songs/is-favourite?userId=${currentUser.id}&songId=${song.id}`
                        );
                        return { songId: song.id, isFavourite: Boolean(response?.data?.isFavourite) };
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
    }, [allSongs, currentUser?.id]);

    useEffect(() => {
        if (!currentUser?.id) {
            setUserPlaylists([]);
            return;
        }

        let isMounted = true;

        async function loadUserPlaylists() {
            try {
                const response = await axios.get(
                    `http://localhost:3000/api/playlists/user-created-playlists?userId=${currentUser.id}`
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

    useEffect(() => {
        function handleClickOutside(event) {
            if (playlistMenuRef.current && !playlistMenuRef.current.contains(event.target)) {
                setOpenSongMenuId(null);
            }
        }
        fetchSong();
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <>
            <div className="row container__section mt-30">
                <div className="col l-12 m-12 c-12 mb-16">
                    <div className="container__header">
                        <a href="#" className="container__header-title">
                            <h3>Có thể bạn muốn nghe</h3>
                        </a>
                        <h3 className="container__header-subtitle">Bài hát nổi bật</h3>
                    </div>
                </div>
                <div className="col l-12 m-12 c-12">
                    {isLoading ? (
                        <div style={{ textAlign: "center", padding: "20px" }}>
                            Đang tải...
                        </div>
                    ) : allSongs.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "20px" }}>
                            Chưa có bài hát nào
                        </div>
                    ) : (
                        <div className="row">
                            {songColumns.map((columnSongs, colIndex) => (
                                <div className="col l-6 m-12 c-12" key={`col-${colIndex}`}>
                                    <div className="explore__column-songs">
                                        {columnSongs.map((song, rowIndex) => (
                                            <div
                                                className={`playlist__list-song media media mb-15 ${currentSong.id === song.id ? 'active' : ''} ${currentSong.id === song.id && isPlaying ? 'playing' : ''}`}
                                                key={`${colIndex}-${rowIndex}`}
                                                onClick={() => handleClickSong(song)}
                                                style={{ cursor: "pointer" }}
                                            >
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
                                                                            <a href="#" className="is-ghost">{artist}</a>
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
                                                        `${Math.floor((Number(song.duration_seconds) || 0) / 60).toString().padStart(2, '0')}:${Math.floor((Number(song.duration_seconds) || 0) % 60).toString().padStart(2, '0')}`
                                                    }
                                                </span>
                                                <div className="playlist__song-option song--tab media__right hide-on-mobile">
                                                    <div className="playlist__song-btn btn--mic option-btn">
                                                        <i className="btn--icon song__icon bi bi-mic-fill"></i>
                                                    </div>
                                                    <div className="playlist__song-btn btn--heart option-btn" onClick={(event) => toggleFavouriteSong(event, song.id)}>
                                                        <i className={`btn--icon song__icon icon--heart bi bi-heart${favouriteSongIds.has(song.id) ? '-fill' : ''} primary`}></i>
                                                    </div>
                                                    <div className="playlist__song-btn option-btn playlist__song-more" onClick={(event) => handleToggleSongMenu(event, song.id)} ref={openSongMenuId === song.id ? playlistMenuRef : null}>
                                                        <i className="btn--icon bi bi-three-dots"></i>
                                                        <div className={`option__log-out ${openSongMenuId === song.id ? "open" : ""}`}>
                                                            <div className="log-out__action playlist__menu-title">
                                                                <i className="bi bi-music-note-list log-out__icon" />
                                                                <span>Thêm vào playlist</span>
                                                            </div>
                                                            <div className="playlist__menu-field">
                                                                <select
                                                                    className="playlist__menu-select"
                                                                    value={selectedPlaylistBySong[song.id] ?? ""}
                                                                    onChange={(event) => handleSelectTargetPlaylist(song.id, event.target.value)}
                                                                    onClick={(event) => event.stopPropagation()}
                                                                >
                                                                    <option value="">Chọn playlist</option>
                                                                    {userPlaylists.map((item) => (
                                                                        <option key={item.id} value={item.id}>{item.playlist_name}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            <button
                                                                className="log-out__action playlist__menu-submit"
                                                                type="button"
                                                                onClick={(event) => handleAddSongToPlaylist(event, song.id)}
                                                                disabled={isAddingSong}
                                                            >
                                                                <i className="bi bi-plus-circle log-out__icon" />
                                                                <span>{isAddingSong ? "Đang thêm..." : "Thêm bài hát"}</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}