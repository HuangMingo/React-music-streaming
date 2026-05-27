import { useState, useEffect, useRef } from "react";
import { useMusicContext } from "../context/MusicContext";
import { useAuthContext } from "../context/AuthContext";
import axios from "axios";
import { AddSongToPlaylist } from "./AddSongToPlaylist/AddSongToPlaylist.jsx";
import { showNotificationToast } from "../toast";
const formatTime = (seconds = 0) => {
    const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
    const mins = Math.floor(safeSeconds / 60)
        .toString()
        .padStart(2, "0");
    const secs = Math.floor(safeSeconds % 60)
        .toString()
        .padStart(2, "0");
    return `${mins}:${secs}`;
};

export function Player() {
    const {
        currentSong,
        setCurrentSong,
        currentSongId,
        selectedPlaylist,
        currentTime,
        currentVolume,
        setCurrentVolume,
        setCurrentTime,
        isPlaying,
        setIsPlaying,
        favouriteSongIds,
        setIsFavouriteSongIds,
        toggleFavouriteSong,
        playlistMenuRef,
        handleSelectTargetPlaylist,
        selectedPlaylistBySong,
        userPlaylists,
        isAddingSong,
    } = useMusicContext();
    const [isFullscreen, setIsFullscreen] = useState(false);
    useEffect(() => {
        function handleFullscreenChange() {
            setIsFullscreen(!!document.fullscreenElement);
        }

        document.addEventListener("fullscreenchange", handleFullscreenChange);

        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
        };
    }, []);
    const [openSongMenuId, setOpenSongMenuId] = useState(null);
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
    //Mở menu khi click vào 3 chấm của bài hát
    function handleToggleSongMenu(event, songId) {
        event.stopPropagation();

        setOpenSongMenuId((prevSongId) =>
            prevSongId === songId ? null : songId
        );
    }
    const { currentUser } = useAuthContext();
    const defaultPlaylistId = currentUser?.defaultPlaylistId;
    const audioRef = useRef();
    const incrementedSongIdRef = useRef(null); // Lưu ID bài hát đã được tăng play_count để tránh tăng nhiều lần cho cùng một bài hát trong cùng một phiên nghe
    const playSessionRef = useRef(null); //Lưu số thứ tự lần phát để
    // mỗi lần phát là độc lập
    //Để mỗi lần nghe lại đủ điều kiện sẽ tăng số lượt nghe dù là cùng một bài hát

    const listenedTimeRef = useRef(0); // Lưu thời gian đã nghe của bài hát hiện tại để tính toán khi tăng play_count
    const lastTimeRef = useRef(null); //Lưu currenTime của lần update trước
    const [isRandom, setIsRandom] = useState(() => JSON.parse(localStorage.getItem("isRandom") || "false"));
    const [isRepeat, setIsRepeat] = useState(() => JSON.parse(localStorage.getItem("isRepeat") || "false"));
    const duration = audioRef.current?.duration || currentSong?.duration_seconds || 0;
    const [pendingRestoreTime, setPendingRestoreTime] = useState(null);
    const [isFavouriteCurrentSong, setIsFavouriteCurrentSong] = useState(false);
    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
    const songs = selectedPlaylist?.songs || [];
    const [openPlayerPopup, setOpenPlayerPopup] = useState(false);
    function handleOpenPlayerPopup(event) {
        const player = event.currentTarget;
        //Kiểm tra nếu click vào nút heart hoặc "Khác" thì không mở popup
        const heartBtn = event.target.closest(".btn--heart");
        const threeDotsBtn = event.target.closest(".btn-three-dots");
        //Kiểm tra nếu click vào các nút điều khiển  thì không mở popup
        const randomBtn = event.target.closest(".btn-random");
        const prevBtn = event.target.closest(".btn-prev");
        const togglePlayBtn = event.target.closest(".btn-toggle-play");
        const nextBtn = event.target.closest(".btn-next");
        const repeatBtn = event.target.closest(".btn-repeat");
        //Kiểm tra nếu click vào thanh tiến trình thì không mở popup
        const volumeBtn = event.target.closest(".btn-volume");
        const progressNode = event.target.closest(".progress-block");
        const volumeNode = event.target.closest(".player__volume-progress");
        const popupNode = event.target.closest(".player__popup");

        if (
            heartBtn ||
            randomBtn ||
            prevBtn ||
            togglePlayBtn ||
            nextBtn ||
            repeatBtn ||
            progressNode ||
            volumeNode ||
            volumeBtn ||
            popupNode
        ) {
            return;
        }
        setOpenPlayerPopup(true);
        // if (!player.classList.contains("open-popup")) {
        //     setOpenPlayerPopup(true);
        // }

    }
    function handleClosePlayerPopup(event) {
        event.stopPropagation();
        setOpenPlayerPopup(false);
    }
    async function handleToggleFullscreen(event) {
        event.stopPropagation();

        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (error) {
            console.error("Fullscreen failed:", error);
        }
    }
    //Khôi phục trạng thái phát nhạc khi reload trang nếu có dữ liệu hợp lệ trong localStorage
    useEffect(() => {
        if (audioRef.current && currentSong?.audio) {
            const savedTime = currentTime;
            if (savedTime && savedTime !== "undefined") {
                setPendingRestoreTime(savedTime);
            }
            // Reset incrementedSongIdRef khi bài hát thay đổi
            incrementedSongIdRef.current = null;
            playSessionRef.current += 1;
            listenedTimeRef.current = 0;
            lastTimeRef.current = null;
            audioRef.current
                .play()
                .then(() => setIsPlaying(true))
                .catch(() => setIsPlaying(false));
        }
    }, [currentSong, setCurrentTime]);
    //Cập nhật âm lượng của thẻ audio khi currentVolume thay đổi
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.volume = currentVolume / 100;
    }, [currentVolume]);
    //Lưu trạng thái phát ngẫu nhiên vào localStorage mỗi khi thay đổi để khôi phục khi reload trang
    useEffect(() => {
        localStorage.setItem("isRandom", JSON.stringify(isRandom));
    }, [isRandom]);
    //Lưu trạng thái lặp lại vào localStorage mỗi khi thay đổi để khôi phục khi reload trang
    useEffect(() => {
        localStorage.setItem("isRepeat", JSON.stringify(isRepeat));
    }, [isRepeat]);
    //Cập nhật bài hát yêu thích khi currentSong hoặc currentUser thay đổi
    useEffect(() => {
        if (!currentUser?.id || !currentSong?.id) {
            setIsFavouriteCurrentSong(false);
            return;
        }

        let isMounted = true;

        async function loadFavouriteStatus() {
            try {
                const response = await axios.get(
                    `http://localhost:3000/api/songs/is-favourite-song?defaultPlaylistId=${defaultPlaylistId}&songId=${currentSong.id}`
                );

                if (!isMounted) {
                    return;
                }

                setIsFavouriteCurrentSong(Boolean(response?.data?.isFavourite));
            } catch (error) {
                if (isMounted) {
                    setIsFavouriteCurrentSong(false);
                }
                console.error("Load current song favourite status failed:", error);
            }
        }

        loadFavouriteStatus();

        return () => {
            isMounted = false;
        };
    }, [currentSong?.id, currentUser?.id]);


    const playSongAt = (songIndex) => {
        if (!songs.length) return;
        const nextIndex = (songIndex + songs.length) % songs.length;
        const nextSong = songs[nextIndex];
        if (!nextSong) return;
        setCurrentSong(nextSong)
        setCurrentTime(0);
        setPendingRestoreTime(null);
    };
    //Hàm chọn bài hát ngẫu nhiên khác với bài hiện tại để phát khi ở chế độ phát ngẫu nhiên
    const pickRandomIndex = () => {
        if (songs.length <= 1) return currentSongId;
        let nextIndex = currentSongId;
        while (nextIndex === currentSongId) {
            nextIndex = Math.floor(Math.random() * songs.length);
        }
        return nextIndex;
    };

    const handleNextSong = () => {
        if (!songs.length) return;
        const nextIndex = isRandom ? pickRandomIndex() : currentSongId + 1;
        playSongAt(nextIndex);
    };

    const handlePrevSong = () => {
        if (!songs.length) return;
        const prevIndex = isRandom ? pickRandomIndex() : currentSongId - 1;
        playSongAt(prevIndex);
    };

    const toggleRandom = () => {
        setIsRandom((prev) => !prev);
    };

    const toggleRepeat = () => {
        setIsRepeat((prev) => !prev);
    };

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;
        if (audio.paused) {
            audio
                .play()
                .then(() => setIsPlaying(true))
                .catch(() => setIsPlaying(false));
            return;
        }
        audio.pause();
        setIsPlaying(false);
    };
    //Cập nhật thời gian hiện tại của bài hát khi phát và lưu tiến trình vào localStorage
    const handleTimeUpdate = () => {
        if (!audioRef.current || !currentSong?.audio) return;
        const newTime = audioRef.current.currentTime;
        setCurrentTime(newTime);
        const audioDuration = audioRef.current.duration;
        if (audioDuration && currentSong?.id) {
            //Tính toán thời gian nghe thực tế (bỏ qua nếu tua)
            if (lastTimeRef.current !== null) {
                const timeDiff = newTime - lastTimeRef.current;
                if (timeDiff > 0 && timeDiff < 2) {
                    listenedTimeRef.current += timeDiff;
                }
            }
            lastTimeRef.current = newTime;
            //Kiểm tra xem đã đủ 50% audio chưa
            const halfDuration = audioDuration * 0.5;
            const sessionKey = `${currentSong.id}- ${playSessionRef.current}`;
            if (incrementedSongIdRef.current !== sessionKey && listenedTimeRef.current >= halfDuration) {
                incrementedSongIdRef.current = sessionKey;
                // Gọi API để tăng play_count
                axios.post('http://localhost:3000/api/songs/increment-play-count', {
                    songId: currentSong.id
                }).catch(error => {
                    console.error('Failed to increment play count:', error);
                });
            }

        }
    };

    const handleLoadedMetadata = () => {
        const audio = audioRef.current;
        if (!audio) return;
        if (pendingRestoreTime !== null) {
            const restoredTime = Math.min(pendingRestoreTime, audio.duration || pendingRestoreTime);
            audio.currentTime = restoredTime;
            setCurrentTime(restoredTime);
            setPendingRestoreTime(null);
        }
    };
    //Sự kiện tua bài hát khi người dùng tương tác với thanh tiến trình, đồng thời cập nhật thời gian hiện tại và lưu tiến trình vào localStorage
    const handleSeek = (event) => {
        const audio = audioRef.current;
        if (!audio || !duration) return;
        const value = Number(event.target.value);
        const nextTime = (value / 100) * duration;
        audio.currentTime = nextTime;
        setCurrentTime(nextTime);
        // Save progress immediately when seeking  
    };

    const handleVolumeChange = (event) => {
        const nextVolume = Number(event.target.value);
        setCurrentVolume(nextVolume);
    };

    return (
        <>
            < div className={`player grid ${isPlaying ? " playing" : ""} ${openPlayerPopup ? "open-popup" : ""}`} >
                <div className="player__container" onClick={(e) => handleOpenPlayerPopup(e)}>
                    <div className="player__container-song">
                        <div className={`player__song-info media${isPlaying ? " playing" : ""}`}>
                            <div className="media__left">
                                <div className="player__song-thumb media__thumb note-1">
                                    <div
                                        className="thumb-img"
                                        style={{
                                            background:
                                                `url(${currentSong?.image || "https://res.cloudinary.com/dnsne0dgp/image/upload/v1774878121/vinyl-record-isolated_wjrnjk.jpg"}) no-repeat center center / cover`
                                        }}
                                    />
                                    <svg
                                        fill="#fff"
                                        viewBox="0 0 512 512"
                                        className="thumb-note note-1"
                                    >
                                        <path d="M470.38 1.51L150.41 96A32 32 0 0 0 128 126.51v261.41A139 139 0 0 0 96 384c-53 0-96 28.66-96 64s43 64 96 64 96-28.66 96-64V214.32l256-75v184.61a138.4 138.4 0 0 0-32-3.93c-53 0-96 28.66-96 64s43 64 96 64 96-28.65 96-64V32a32 32 0 0 0-41.62-30.49z" />
                                    </svg>
                                    <svg
                                        fill="#fff"
                                        viewBox="0 0 384 512"
                                        className="thumb-note note-2"
                                    >
                                        <path d="M310.94 1.33l-96.53 28.51A32 32 0 0 0 192 60.34V360a148.76 148.76 0 0 0-48-8c-61.86 0-112 35.82-112 80s50.14 80 112 80 112-35.82 112-80V148.15l73-21.39a32 32 0 0 0 23-30.71V32a32 32 0 0 0-41.06-30.67z" />
                                    </svg>
                                    <svg
                                        fill="#fff"
                                        viewBox="0 0 512 512"
                                        className="thumb-note note-3"
                                    >
                                        <path d="M470.38 1.51L150.41 96A32 32 0 0 0 128 126.51v261.41A139 139 0 0 0 96 384c-53 0-96 28.66-96 64s43 64 96 64 96-28.66 96-64V214.32l256-75v184.61a138.4 138.4 0 0 0-32-3.93c-53 0-96 28.66-96 64s43 64 96 64 96-28.65 96-64V32a32 32 0 0 0-41.62-30.49z" />
                                    </svg>
                                    <svg
                                        fill="#fff"
                                        viewBox="0 0 384 512"
                                        className="thumb-note note-4"
                                    >
                                        <path d="M310.94 1.33l-96.53 28.51A32 32 0 0 0 192 60.34V360a148.76 148.76 0 0 0-48-8c-61.86 0-112 35.82-112 80s50.14 80 112 80 112-35.82 112-80V148.15l73-21.39a32 32 0 0 0 23-30.71V32a32 32 0 0 0-41.06-30.67z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="media__content">
                                <div className="player__song-body media__info">
                                    <div className="player__song-title info__title">
                                        <div className="player__title-animate">
                                            <div className="title__item">{currentSong?.title}</div>
                                        </div>
                                    </div>
                                    <div className="player__song-author info__author">
                                        {
                                            currentSong?.artist_names?.map((artist, index) => {
                                                return (
                                                    <span key={index}>
                                                        <a href="#" className="is-ghost">{artist}</a>
                                                        {index < currentSong?.artist_names?.length - 1 && ", "}
                                                    </span>
                                                )
                                            })
                                        }
                                    </div>
                                </div>
                            </div>
                            <div className="media__right hide-on-tablet-mobile">
                                <div className="player__song-options">
                                    <div className="player__song-btn option-btn btn--heart" onClick={(e) => toggleFavouriteSong(e, currentSong.id)}
                                        title={favouriteSongIds?.has(currentSong?.id) ? "Bỏ thích bài hát" : "Thêm vào bài hát yêu thích"}
                                    >
                                        <i className={`btn--icon icon--heart bi bi-heart${favouriteSongIds?.has(currentSong?.id) ? "-fill" : ""} primary`} />
                                    </div>
                                    <div className="player__song-btn option-btn btn-three-dots" onClick={(event) => handleToggleSongMenu(event, currentSong.id)} ref={openSongMenuId === currentSong?.id ? playlistMenuRef : null}
                                        title="Khác">
                                        <i className="btn--icon bi bi-three-dots" />
                                    </div>
                                    <AddSongToPlaylist
                                        songId={currentSong?.id}
                                        isOpen={openSongMenuId === currentSong?.id}
                                        playlists={userPlaylists}
                                        selectedPlaylistId={selectedPlaylistBySong[currentSong?.id] ?? ""}
                                        onCloseMenu={() => setOpenSongMenuId(null)}
                                        onSelectPlaylist={handleSelectTargetPlaylist}
                                        isAddingSong={isAddingSong}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="player__control">
                        <div className="player__control-btn">
                            <div className={`control-btn btn-random is-small${isRandom ? " active" : ""}`} onClick={toggleRandom}
                                title={
                                    isRandom ? "Tắt phát ngẫu nhiên" : "Bật phát ngẫu nhiên"
                                }
                            >
                                <i className="bi bi-shuffle" />
                            </div>
                            <div className="control-btn btn-prev" onClick={handlePrevSong}
                                title="Phát bài trước">
                                <i className="bi bi-skip-start-fill" />
                            </div>
                            <div className="control-btn btn-toggle-play btn--play-song is-medium" onClick={togglePlay}>
                                <i className="bi bi-pause icon-pause" />
                                <i className="bi bi-play-fill icon-play" />
                            </div>
                            <div className="control-btn btn-next" onClick={handleNextSong}
                                title="Phát bài tiếp theo"
                            >
                                <i className="bi bi-skip-end-fill" />
                            </div>
                            <div className={`control-btn btn-repeat is-small is-medium${isRepeat ? " active" : ""}`} onClick={toggleRepeat}
                                title={
                                    isRepeat ? "Tắt lặp lại" : "Bật lặp lại"
                                }
                            >
                                <i className="bi bi-arrow-repeat" />
                            </div>
                        </div>
                        <div className="progress-block hide-on-mobile">
                            <span className="tracktime">{formatTime(currentTime)}</span>
                            <input
                                id="progress--main"
                                className="progress"
                                type="range"
                                value={pendingRestoreTime || undefined ? (pendingRestoreTime / duration) * 100 : progressPercent}
                                onChange={handleSeek}
                                step={1}
                                min={0}
                                max={100}
                            />
                            <div className="progress__track song--track">
                                <div className="progress__track-update" style={{ width: `${progressPercent}%` }} />
                            </div>
                            <span className="durationtime">{formatTime(duration)}</span>
                        </div>
                    </div>
                    <div className="player__options hide-on-mobile">
                        <div className="player__options-container">
                            <div className="player__options-btn option-btn hide-on-tablet-mobile" title="Xem lời bài hát" onClick={(e) => handleOpenPlayerPopup(e)}>
                                <i className="bi bi-mic btn--icon" />
                            </div>
                            <div className="player__options-btn volume option-btn btn-volume">
                                <i className="bi bi-volume-up btn--icon" />
                            </div>
                            <div className="player__volume-progress">
                                <input
                                    type="range"
                                    className="volume__range"
                                    value={currentVolume}
                                    onChange={handleVolumeChange}
                                    step={1}
                                    min={0}
                                    max={100}
                                />
                                <div className="progress__track volume--track">
                                    <div className="progress__track-update" style={{ width: `${currentVolume}%` }}></div>
                                </div>
                            </div>
                            <div className="player__list-icon">
                                <i className="bi bi-music-note-list" />
                            </div>
                        </div>
                    </div>
                    <audio
                        ref={audioRef}
                        src={currentSong?.audio || undefined}
                        id="audio"
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onEnded={() => {
                            if (isRepeat) {
                                if (audioRef.current) {
                                    audioRef.current.currentTime = 0;
                                    setCurrentTime(0);
                                    audioRef.current
                                        .play()
                                        .then(() => setIsPlaying(true))
                                        .catch(() => setIsPlaying(false));
                                }
                                return;
                            }
                            handleNextSong();
                        }}
                    ></audio>

                </div>
                <div className="player__popup">
                    <div className="player__popup-header">
                        <div className="player__popup-logo">
                            <img
                                src="./assets/img/logos/main-logo.png"
                                alt="Logo"
                                className="player__logo-img"
                            />
                        </div>
                        <div className="player__popup-action">
                            <ul className="popup__action-menu">
                                <li className="popup__action-btn hide-on-tablet-mobile" onClick={handleToggleFullscreen}>
                                    {
                                        document.fullscreenElement
                                            ? <i className="bi bi-arrows-angle-contract popup__action-btn-icon" />
                                            : <i className="bi bi-arrows-angle-expand popup__action-btn-icon" />
                                    }


                                </li>
                                {
                                     !isFullscreen && (
                                        <li className="popup__action-btn btn--pop-down" onClick={(e) => handleClosePlayerPopup(e)}>
                                            <i className="bi bi-chevron-down popup__action-btn-icon" />
                                        </li>
                                    )
                                }

                            </ul>
                        </div>
                    </div>
                    <div className="player__popup-cd-display">
                        <div
                            className="player__popup-cd-img"
                            style={{
                                background:
                                    `url(${currentSong?.image || "https://res.cloudinary.com/dnsne0dgp/image/upload/v1774878121/vinyl-record-isolated_wjrnjk.jpg"}) no-repeat center center / cover`
                            }}
                        />
                    </div>
                    <div className="player__popup-cd-info">
                        <h4>Now playing</h4>
                        <h2 className="is-twoline">{currentSong?.title || "Unknown Song"}</h2>
                        <div className="player__song-author info__author">
                            {
                                currentSong?.artist_names?.map((artist, index) => {
                                    return (
                                        <span key={index}>
                                            <a href="#" className="is-ghost">{artist}</a>
                                            {index < currentSong?.artist_names?.length - 1 && ", "}
                                        </span>
                                    )
                                })
                            }
                        </div>
                    </div>
                    <div className="player__popup-footer">
                        <div className="player__container-song hide-on-mobile">
                            <div className={`player__song-info media${isPlaying ? " playing" : ""}`}>
                                <div className="media__left">
                                    <div className="player__song-thumb media__thumb note-1">
                                        <div
                                            className="thumb-img"
                                            style={{
                                                background:
                                                    `url(${currentSong?.image || "https://res.cloudinary.com/dnsne0dgp/image/upload/v1774878121/vinyl-record-isolated_wjrnjk.jpg"}) no-repeat center center / cover`
                                            }}
                                        />
                                        <svg
                                            fill="#fff"
                                            viewBox="0 0 512 512"
                                            className="thumb-note note-1"
                                        >
                                            <path d="M470.38 1.51L150.41 96A32 32 0 0 0 128 126.51v261.41A139 139 0 0 0 96 384c-53 0-96 28.66-96 64s43 64 96 64 96-28.66 96-64V214.32l256-75v184.61a138.4 138.4 0 0 0-32-3.93c-53 0-96 28.66-96 64s43 64 96 64 96-28.65 96-64V32a32 32 0 0 0-41.62-30.49z" />
                                        </svg>
                                        <svg
                                            fill="#fff"
                                            viewBox="0 0 384 512"
                                            className="thumb-note note-2"
                                        >
                                            <path d="M310.94 1.33l-96.53 28.51A32 32 0 0 0 192 60.34V360a148.76 148.76 0 0 0-48-8c-61.86 0-112 35.82-112 80s50.14 80 112 80 112-35.82 112-80V148.15l73-21.39a32 32 0 0 0 23-30.71V32a32 32 0 0 0-41.06-30.67z" />
                                        </svg>
                                        <svg
                                            fill="#fff"
                                            viewBox="0 0 512 512"
                                            className="thumb-note note-3"
                                        >
                                            <path d="M470.38 1.51L150.41 96A32 32 0 0 0 128 126.51v261.41A139 139 0 0 0 96 384c-53 0-96 28.66-96 64s43 64 96 64 96-28.66 96-64V214.32l256-75v184.61a138.4 138.4 0 0 0-32-3.93c-53 0-96 28.66-96 64s43 64 96 64 96-28.65 96-64V32a32 32 0 0 0-41.62-30.49z" />
                                        </svg>
                                        <svg
                                            fill="#fff"
                                            viewBox="0 0 384 512"
                                            className="thumb-note note-4"
                                        >
                                            <path d="M310.94 1.33l-96.53 28.51A32 32 0 0 0 192 60.34V360a148.76 148.76 0 0 0-48-8c-61.86 0-112 35.82-112 80s50.14 80 112 80 112-35.82 112-80V148.15l73-21.39a32 32 0 0 0 23-30.71V32a32 32 0 0 0-41.06-30.67z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="media__content">
                                    <div className="player__song-body media__info">
                                        <div className="player__song-title info__title">
                                            <div className="player__title-animate">
                                                <div className="title__item">{currentSong?.title || 'Unknown Song'}</div>

                                            </div>
                                        </div>
                                        <div className="player__song-author info__author">{currentSong?.artist_names?.join(', ') || 'Unknown Artist'}</div>
                                    </div>
                                </div>
                                <div className="media__right hide-on-tablet-mobile">
                                    <div className="player__song-options">
                                        <div className="player__song-btn option-btn btn--heart" onClick={(e) => toggleFavouriteSong(e, currentSong.id)}>
                                            <i className={`btn--icon icon--heart bi bi-heart${favouriteSongIds.has(currentSong?.id) ? "-fill" : ""} primary`} />
                                        </div>
                                        <div className="player__song-btn option-btn">
                                            <i className="btn--icon bi bi-three-dots" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="player__control">
                            <div className="player__control-btn">
                                <div className={`control-btn btn-random is-small${isRandom ? " active" : ""}`} onClick={toggleRandom}>
                                    <i className="bi bi-shuffle" />
                                </div>
                                <div className="control-btn btn-prev" onClick={handlePrevSong}>
                                    <i className="bi bi-skip-start-fill" />
                                </div>
                                <div className="control-btn btn-toggle-play btn--play-song is-medium" onClick={togglePlay}>
                                    <i className="bi bi-pause icon-pause" />
                                    <i className="bi bi-play-fill icon-play" />
                                </div>
                                <div className="control-btn btn-next" onClick={handleNextSong}>
                                    <i className="bi bi-skip-end-fill" />
                                </div>
                                <div className={`control-btn btn-repeat is-small is-medium${isRepeat ? " active" : ""}`} onClick={toggleRepeat}>
                                    <i className="bi bi-arrow-repeat" />
                                </div>
                            </div>
                            <div className="progress-block">
                                <span className="tracktime">{formatTime(currentTime)}</span>
                                <input
                                    id="progress--pop-up"
                                    className="progress"
                                    type="range"
                                    value={progressPercent}
                                    onChange={handleSeek}
                                    step={1}
                                    min={0}
                                    max={100}
                                />
                                <div className="progress__track song--track">
                                    <div className="progress__track-update" style={{ width: `${progressPercent}%` }} />
                                </div>
                                <span className="durationtime">{formatTime(duration || currentSong?.duration_seconds)}</span>
                            </div>
                        </div>
                        <div className="player__options hide-on-mobile">
                            <div className="player__options-container">
                                {/* <div className="player__options-btn option-btn hide-on-tablet-mobile" >
                                    <i className="bi bi-camera-video btn--icon" />
                                </div> */}
                                <div className="player__options-btn option-btn hide-on-tablet-mobile" onClick={(e) => handleOpenPlayerPopup(e)}>
                                    <i className="bi bi-mic btn--icon" />
                                </div>
                                <div className="player__options-btn volume option-btn">
                                    <i className="bi bi-volume-up btn--icon" />
                                </div>
                                <div className="player__volume-progress">
                                    <input
                                        type="range"
                                        className="volume__range"
                                        value={currentVolume}
                                        onChange={handleVolumeChange}
                                        step={1}
                                        min={0}
                                        max={100}
                                    />
                                    <div className="progress__track volume--track">
                                        <div className="progress__track-update" style={{ width: `${currentVolume}%` }} />
                                    </div>
                                    <span className="volume__background" />
                                </div>
                                <div className="player__list-icon">
                                    <i className="bi bi-music-note-list" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div >
        </>
    )
}