import { useEffect, useState } from "react";
import { AddSongToPlaylist } from "../AddSongToPlaylist/AddSongToPlaylist";
import { ArtistNameLink } from "../ArtistNameLink/ArtistNameLink";
import { useMusicContext } from "../../context/MusicContext";

function formatDuration(durationSeconds) {
    const duration = Number(durationSeconds) || 0;
    const minutes = Math.floor(duration / 60)
        .toString()
        .padStart(2, "0");
    const seconds = Math.floor(duration % 60)
        .toString()
        .padStart(2, "0");

    return `${minutes}:${seconds}`;
}

function getArtistNames(song) {
    if (Array.isArray(song?.artist_names) && song.artist_names.length) {
        return song.artist_names;
    }

    if (Array.isArray(song?.artists) && song.artists.length) {
        return song.artists.map((artist) => artist?.name || artist).filter(Boolean);
    }

    return [];
}

export function RecentSong() {
    const {
        currentSong,
        favouriteSongIds,
        handleSelectTargetPlaylist,
        isPlaying,
        playlistMenuRef,
        recentSongs,
        saveRecentSongToStorage,
        selectedPlaylistBySong,
        setCurrentSong,
        setCurrentTime,
        setExploreSelectedPlaylist,
        setIsPlaying,
        setRecentSongs,
        toggleFavouriteSong,
        userPlaylists,
    } = useMusicContext();
    const [openSongMenuId, setOpenSongMenuId] = useState(null);

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
    }, [playlistMenuRef]);

    function handleClickSong(song) {
        const nextRecentSongs = saveRecentSongToStorage(song);
        setRecentSongs(nextRecentSongs);
        setExploreSelectedPlaylist({
            id: "recent-songs",
            playlist_name: "Gần đây",
            playlist_image: song.image,
            songs: nextRecentSongs,
        });
        setCurrentSong(song);
        setCurrentTime(0);
        setIsPlaying(true);
    }

    function handleToggleSongMenu(event, songId) {
        event.stopPropagation();
        setOpenSongMenuId((currentId) => currentId === songId ? null : songId);
    }

    return (
        <div className="app__container tab--following active">
            <div className="app__container-content">
                <div className="following__container">
                    <div className="grid">
                        <div className="row no-gutters">
                            <div className="col l-12 m-12 c-12">
                                <div className="container__header mb-10">

                                    <h3 className="container__header-subtitle">Gần đây</h3>
                                </div>
                            </div>

                            <div className="col l-12 m-12 c-12">
                                <div className="container__playlist">
                                    <div className="playlist__header mt-5">
                                        <span className="playlist__header-title">Bài hát</span>
                                        <span className="playlist__header-time">Thời gian</span>
                                        <span className="playlist__header-options hide-on-mobile">Tùy chọn</span>
                                    </div>

                                    <div className="playlist__list mb-30 overflow-visible">
                                        {recentSongs.length === 0 ? (
                                            <div className="box--no-content">
                                                <span className="no-content-text">Bạn chưa nghe bài hát nào gần đây.</span>
                                            </div>
                                        ) : (
                                            recentSongs.map((song, index) => {
                                                const isActiveSong = currentSong?.id === song.id;
                                                const artistNames = getArtistNames(song);

                                                return (
                                                    <div
                                                        className={`playlist__list-song media ${isActiveSong ? "active" : ""} ${isActiveSong && isPlaying ? "playing" : ""}`}
                                                        key={song.id ?? `${song.title ?? "recent-song"}-${index}`}
                                                        onClick={() => handleClickSong(song)}
                                                    >
                                                        <div className="playlist__song-info media__left">
                                                            <i className="bi bi-music-note-beamed playlist__song-icon mr-10" />
                                                            <div
                                                                className={`playlist__song-thumb media__thumb mr-10 ${isActiveSong ? "active" : ""} ${isActiveSong && isPlaying ? "playing" : ""}`}
                                                                style={{
                                                                    background: `url(${song.image}) no-repeat center center / cover`,
                                                                }}
                                                            >
                                                                <span className="song-note note-1">♪</span>
                                                                <span className="song-note note-2">♫</span>
                                                                <span className="song-note note-3">♪</span>
                                                                <span className="song-note note-4">♫</span>
                                                                <div className="thumb--animate">
                                                                    <div
                                                                        className="thumb--animate-img"
                                                                        style={{ background: "url('/assets/img/SongActiveAnimation/icon-playing.gif') no-repeat 50% / contain" }}
                                                                    />
                                                                </div>
                                                                <div className="play-song--actions">
                                                                    <div className="control-btn btn-toggle-play btn--play-song">
                                                                        <i className="bi bi-play-fill" />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="playlist__song-body media__info">
                                                                <span className="playlist__song-title info__title">{song.title}</span>
                                                                <p className="playlist__song-author info__author">
                                                                    {artistNames.length ? (
                                                                        artistNames.map((artist, artistIndex) => (
                                                                            <span key={`${artist}-${artistIndex}`}>
                                                                                <ArtistNameLink artist={artist} />
                                                                                {artistIndex < artistNames.length - 1 && ", "}
                                                                            </span>
                                                                        ))
                                                                    ) : (
                                                                        "Unknown Artist"
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <span className="playlist__song-time media__content">{formatDuration(song.duration_seconds)}</span>

                                                        <div className="playlist__song-option song--tab media__right">
                                                            <div className="playlist__song-option-main hide-on-mobile">
                                                                <div
                                                                    className="playlist__song-btn btn--heart option-btn"
                                                                    onClick={(event) => toggleFavouriteSong(event, song.id)}
                                                                    title={favouriteSongIds.has(song.id) ? "Bỏ thích bài hát" : "Thêm vào bài hát yêu thích"}
                                                                >
                                                                    <i className={`btn--icon song__icon icon--heart bi bi-heart${favouriteSongIds.has(song.id) ? "-fill" : ""} primary`} />
                                                                </div>
                                                                <div
                                                                    className="playlist__song-btn option-btn playlist__song-more"
                                                                    onClick={(event) => handleToggleSongMenu(event, song.id)}
                                                                    ref={openSongMenuId === song.id ? playlistMenuRef : null}
                                                                    title="Khác"
                                                                >
                                                                    <i className="btn--icon bi bi-three-dots" />
                                                                    <AddSongToPlaylist
                                                                        song={song}
                                                                        isOpen={openSongMenuId === song.id}
                                                                        playlists={userPlaylists}
                                                                        selectedTargetPlaylist={selectedPlaylistBySong[song.id] ?? ""}
                                                                        onCloseMenu={() => setOpenSongMenuId(null)}
                                                                        onSelectPlaylist={handleSelectTargetPlaylist}
                                                                    />
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
                    </div>
                </div>
            </div>
        </div>
    );
}
