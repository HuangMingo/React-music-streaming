import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useMusicContext } from "../../context/MusicContext";
import { useAuthContext } from "../../context/AuthContext";
import { AddSongToPlaylist } from "../AddSongToPlaylist/AddSongToPlaylist";
// Component: AllSongs
// Chức năng: Hiển thị các bài hát gợi ý, cho phép mở menu "Thêm vào playlist"
// Các điểm chính:
// - Tải danh sách bài hát từ API (`fetchSong`)
// - Tải playlist do user tạo (dùng cho menu thêm bài)
// - Quản lý trạng thái menu cho từng bài (`openSongMenuId`)

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
        toggleFavouriteSong,
        playlistMenuRef,
        handleSelectTargetPlaylist,
        selectedPlaylistBySong, } = useMusicContext();
    const [openSongMenuId, setOpenSongMenuId] = useState(null);
    //Mở menu khi click vào 3 chấm của bài hát
    function handleToggleSongMenu(event, songId) {
        event.stopPropagation();

        setOpenSongMenuId((prevSongId) =>
            prevSongId === songId ? null : songId
        );
    }
    const { currentUser } = useAuthContext();
    const defaultPlaylistId = currentUser?.defaultPlaylistId;
    const [allSongs, setAllSongs] = useState([]);

    const [isLoading, setIsLoading] = useState(false);
    // Danh sách playlist do người dùng tạo (dùng để render menu thêm bài)
    const [userPlaylists, setUserPlaylists] = useState([]);
    const isMountedRef = useRef(true); // Ref để đánh dấu component vẫn mounted, tránh setState sau unmount 
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

    // Lấy danh sách bài hát từ backend
    // Lưu ý: fetchSong được gọi trong effect khởi tạo phía dưới

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

    // Gọi API lấy playlist do user tạo.
    // Sẽ được truyền xuống component AddSongToPlaylist để render list và xử lý tạo mới.

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
                            `http://localhost:3000/api/songs/is-favourite-song?defaultPlaylistId=${defaultPlaylistId}&songId=${song.id}`
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
    }, [allSongs, currentUser?.id]);

    useEffect(() => {

        // Khi user thay đổi (login/logout), tải lại playlist
        if (!currentUser?.id) {
            setUserPlaylists([]);
            return;
        }

        loadUserPlaylists();
    }, [currentUser?.id]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (playlistMenuRef.current && !playlistMenuRef.current.contains(event.target)) {
                // Nếu click ngoài menu, đóng menu hiện đang mở
                if (!isMountedRef.current) {
                    return;
                }
                setOpenSongMenuId(null);
            }
        }
        // Khởi tạo: fetch danh sách bài hát
        fetchSong();
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);
    // Đánh dấu component vẫn mounted; dùng trong các callback async để tránh setState sau unmount
    isMountedRef.current = true;


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
                        <div style={{ textAlign: "center", padding: "20px", color: "var(--text-color)", fontSize: "16px" }}>
                            Đang tải...
                        </div>
                    ) : allSongs.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "20px", color: "var(--text-color)", fontSize: "16px" }}>
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
                                                onClick={() => {handleClickSong(song); setSelectedPlaylist(null);} }
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
                                                    {/* <div className="playlist__song-btn btn--mic option-btn">
                                                        <i className="btn--icon song__icon bi bi-mic-fill"></i>
                                                    </div> */}
                                                    <div className="playlist__song-btn btn--heart option-btn" onClick={(event) => toggleFavouriteSong(event, song.id)}
                                                        title={
                                                            favouriteSongIds.has(song.id)
                                                                ? "Bỏ thích bài hát"
                                                                : "Thêm vào bài hat yêu thích"
                                                        }
                                                    >
                                                        <i className={`btn--icon song__icon icon--heart bi bi-heart${favouriteSongIds.has(song.id) ? '-fill' : ''} primary`}></i>
                                                    </div>
                                                    <div className="playlist__song-btn option-btn playlist__song-more" onClick={(event) => handleToggleSongMenu(event, song.id)} ref={openSongMenuId === song.id ? playlistMenuRef : null}
                                                         title="Khác">
                                                        <i className="btn--icon bi bi-three-dots"></i>
                                                        <AddSongToPlaylist
                                                            song={song}
                                                            isOpen={openSongMenuId === song.id}
                                                            playlists={userPlaylists}
                                                            selectedTargetPlaylist={selectedPlaylistBySong[song.id] ?? ""}
                                                            onSelectPlaylist={handleSelectTargetPlaylist}
                                                            onCloseMenu={() => setOpenSongMenuId(null)}
                                                            onPlaylistsChanged={loadUserPlaylists}
                                                        />
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