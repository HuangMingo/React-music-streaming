import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useMusicContext } from "../../context/MusicContext";
import { useAuthContext } from "../../context/AuthContext";
import { AddSongToPlaylist } from "../AddSongToPlaylist/AddSongToPlaylist";
export function DreamChart() {
    const [topSongs, setTopSongs] = useState([]);
    const [userPlaylists, setUserPlaylists] = useState([]);

    const {
        currentSong,
        isPlaying,
        favouriteSongIds,
        setFavouriteSongIds,
        toggleFavouriteSong,
        handleClickSong,
        playlistMenuRef,
        handleSelectTargetPlaylist,
        selectedPlaylistBySong,
    } = useMusicContext();
    const { currentUser } = useAuthContext();
    const defaultPlaylistId = currentUser?.defaultPlaylistId;
    const isMountedRef = useRef(true);
    const [openSongMenuId, setOpenSongMenuId] = useState(null);
    //Mở menu khi click vào 3 chấm của bài hát
    function handleToggleSongMenu(event, songId) {
        event.stopPropagation();

        setOpenSongMenuId((prevSongId) =>
            prevSongId === songId ? null : songId
        );
    }
    useEffect(() => {
        axios
            .get("http://localhost:3000/api/songs/top10-most-played-songs")
            .then((response) => {
                setTopSongs(Array.isArray(response?.data) ? response.data : []);
            })
            .catch((error) => {
                console.log(error.message);
            })
    }, []);

    useEffect(() => {
        if (!currentUser?.id) {
            setUserPlaylists([]);
            return;
        }

        loadUserPlaylists();
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
    async function loadUserPlaylists() {
        if (!currentUser?.id) {
            setUserPlaylists([]);
            return;
        }

        try {
            const response = await axios.get(
                `http://localhost:3000/api/playlists/user-created-playlists?userId=${currentUser.id}`
            );

            setUserPlaylists(Array.isArray(response?.data) ? response.data : []);
        } catch (error) {
            console.error("Load user playlists failed:", error);
            setUserPlaylists([]);
        }
    }

    useEffect(() => {
        if (!currentUser?.id || topSongs.length === 0) {
            setFavouriteSongIds(new Set());
            return;
        }

        let isMounted = true;

        async function loadFavouriteStatuses() {
            try {
                const checks = await Promise.all(
                    topSongs.map(async (song) => {
                        const response = await axios.get(
                            `http://localhost:3000/api/songs/is-favourite-song?defaultPlaylistId=${defaultPlaylistId}&songId=${song.id}`
                        );
                        return { songId: song.id, isFavourite: Boolean(response?.data?.isFavouriteSong) };
                    })
                );

                if (!isMounted) {
                    return;
                }

                setFavouriteSongIds(
                    new Set(checks.filter((item) => item.isFavourite).map((item) => item.songId))
                );
            } catch (error) {
                if (isMounted) {
                    setFavouriteSongIds(new Set());
                }
                console.error("Load favourite statuses failed:", error);
            }
        }

        loadFavouriteStatuses();

        return () => {
            isMounted = false;
        };
    }, [topSongs, currentUser?.id]);
    return (
        <>
            {/* Tab charts */}
            <div className="app__container tab--charts active" >
                <div className="app__container-content">
                    <div className="charts__container">
                        <div className="grid">
                            <div className="chart__container-header mb-40">
                                <h3 className="chart__header-name">#Dream Chart</h3>
                                <div className="chart__header-btn">
                                    <i className="bi bi-play-fill chart__header-icon"></i>
                                </div>
                            </div>
                            <div className="row no-gutters chart--container mt-10 mb-20">
                                <div className="col l-12 m-12 c-12">
                                    <div className="container__playlist">
                                        <div className="playlist__list-charts overflow-visible">
                                            {
                                                topSongs.map((song, songIndex) => {
                                                    const isActiveSong = currentSong?.id === song.id;
                                                    const isPlayingSong = isActiveSong && isPlaying;

                                                    return (
                                                        <div key={song.id} className={`playlist__list-song media ${songIndex > 9 && 'song--not-expand'} ${isActiveSong ? 'active' : ''} ${isPlayingSong ? 'playing' : ''}`} onClick={() => handleClickSong(song)}>
                                                            <div className="playlist__song-info media__left">
                                                                <div className="playlist__song-rank">
                                                                    <div className={`playlist__rank-number
                                                                                ${songIndex === 0 && 'is-outline--blue'}
                                                                                ${songIndex === 1 && 'is-outline--green'}
                                                                                ${songIndex === 2 && 'is-outline--red'}
                                                                                ${songIndex > 2 && 'is-outline--text'}`}>
                                                                        {songIndex + 1}
                                                                    </div>

                                                                    <div className="playlist__song-thumb media__thumb mr-10" style={
                                                                        {
                                                                            background: `url(${song.image}) no-repeat center center / cover`
                                                                        }
                                                                    }>
                                                                        <span className="song-note note-1">♪</span>
                                                                        <span className="song-note note-2">♫</span>
                                                                        <span className="song-note note-3">♪</span>
                                                                        <span className="song-note note-4">♫</span>
                                                                        <div className="thumb--animate">
                                                                            <div className="thumb--animate-img" style={
                                                                                {
                                                                                    background: `url('./../assets/img/SongActiveAnimation/icon-playing.gif') no-repeat 50% / contain`
                                                                                }
                                                                            }>

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
                                                                                song.artist_names.map((artist, artistIndex) => {
                                                                                    return (
                                                                                        <span>
                                                                                            <a href="#" className="is-ghost">{artist}</a>
                                                                                            {artistIndex < song.artist_names.length - 1 && ", "}
                                                                                        </span>
                                                                                    )

                                                                                })
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                            </div>
                                                            <span className="playlist__song-time media__content">
                                                                {
                                                                    // const duration = song.audio.currentDuration;
                                                                    `${Math.floor(song.duration_seconds / 60).toString().padStart(2, '0')}:${Math.floor(song.duration_seconds % 60).toString().padStart(2, '0')}`
                                                                }
                                                            </span>
                                                            <div className="playlist__song-option song--tab media__right hide-on-mobile">
                                                                {/* <div className="playlist__song-btn btn--mic option-btn" title= "Xem lời bài hát">
                                                                    <i className="btn--icon song__icon bi bi-mic-fill"></i>
                                                                </div> */}
                                                                <div className="playlist__song-btn btn--heart option-btn" onClick={(e) => toggleFavouriteSong(e, song.id)}
                                                                    title={favouriteSongIds.has(song.id) ? "Bỏ thích bài hát" : "Thêm vào bài hát yêu thích"}>
                                                                    <i className={`btn--icon song__icon icon--heart bi bi-heart${favouriteSongIds.has(song.id) ? '-fill' : ''} primary`}></i>
                                                                </div>
                                                                <div className="playlist__song-btn option-btn playlist__song-more" onClick={(event) => handleToggleSongMenu(event, song.id)} ref={openSongMenuId === song.id ? playlistMenuRef : null}
                                                                        title="Khác"
                                                                    >
                                                                    <i className="btn--icon bi bi-three-dots"></i>
                                                                    <AddSongToPlaylist
                                                                        songId={song.id}
                                                                        isOpen={openSongMenuId === song.id}
                                                                        playlists={userPlaylists}
                                                                        selectedPlaylistId={selectedPlaylistBySong[song.id] ?? ""}
                                                                        onSelectPlaylist={handleSelectTargetPlaylist}
                                                                        onCloseMenu={() => setOpenSongMenuId(null)}
                                                                        onPlaylistsChanged={loadUserPlaylists}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}