import { useState } from "react";
import { useMusicContext } from "../../context/MusicContext";
import { DeleteSongFromPlaylistDialog } from "./DeleteSongFromPlaylistDialog";

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

export function SongSection() {
    const {
        selectedPlaylist,
        setSelectedPlaylist,
        currentSong,
        setCurrentSong,
        setCurrentTime,
        isPlaying,
        setIsPlaying,
        favouriteSongIds,
        toggleFavouriteSong,
        handleClickSong,
    } = useMusicContext();

    const [songToRemove, setSongToRemove] = useState(null);
    const songs = selectedPlaylist?.songs ?? [];

    function handleOpenRemoveSongDialog(event, song) {
        event.preventDefault();
        event.stopPropagation();
        setSongToRemove(song);
    }

    function handleCloseRemoveSongDialog() {
        setSongToRemove(null);
    }

    function handleSongRemoved(removedSong) {
        const nextSongs = (selectedPlaylist?.songs ?? []).filter((song) => song.id !== removedSong.id);

        setSelectedPlaylist((prevPlaylist) => {
            if (!prevPlaylist) {
                return prevPlaylist;
            }

            return {
                ...prevPlaylist,
                songs: nextSongs,
            };
        });

        if (currentSong?.id === removedSong.id) {
            setCurrentSong(
                nextSongs[0] ?? {
                    id: undefined,
                    title: "",
                    artist_names: [],
                    image: "",
                    duration_seconds: 0,
                }
            );
            setCurrentTime(0);
            setIsPlaying(false);
        }

        handleCloseRemoveSongDialog();
    }

    return (
        <>
            <div className="grid container__tab tab-song active">
                <div className="row no-gutters">
                    <div className="col l-12 m-12 c-12">
                        <div className="container__header mb-10">
                            <a href="#" className="container__header-title">
                                <h3>Bài Hát&nbsp;</h3>
                            </a>
                            <h3 className="container__header-subtitle">Bài Hát</h3>
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
                                {songs.length === 0 ? (
                                    <div className="box--no-content">
                                        <div className="no-content-image" />
                                        <span className="no-content-text">Chưa có bài hát trong playlist được chọn.</span>
                                    </div>
                                ) : (
                                    songs.map((song, index) => {
                                        const isActiveSong = currentSong?.id === song.id;

                                        return (
                                            <div
                                                className={`playlist__list-song media ${isActiveSong ? "active" : ""} ${isActiveSong && isPlaying ? "playing" : ""}`}
                                                key={song.id ?? `${song.name ?? song.title ?? "song"}-${index}`}
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
                                                                style={{ background: "url('./../assets/img/SongActiveAnimation/icon-playing.gif') no-repeat 50% / contain" }}
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
                                                            {song?.artist_names?.length ? (
                                                                song.artist_names.map((artist, artistIndex) => (
                                                                    <span key={`${artist}-${artistIndex}`}>
                                                                        <a href="#" className="is-ghost">
                                                                            {artist}
                                                                        </a>
                                                                        {artistIndex < song.artist_names.length - 1 && ", "}
                                                                    </span>
                                                                ))
                                                            ) : (
                                                                "Đang cập nhật"
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>

                                                <span className="playlist__song-time media__content">{formatDuration(song.duration_seconds)}</span>

                                                <div className="playlist__song-option song--tab media__right">
                                                    <div className="playlist__song-option-main hide-on-mobile">
                                                        <div className="playlist__song-btn btn--mic option-btn">
                                                            <i className="btn--icon song__icon bi bi-mic-fill" />
                                                        </div>
                                                        <div className="playlist__song-btn btn--heart option-btn" onClick={(event) => toggleFavouriteSong(event, song.id)}>
                                                            <i className={`btn--icon song__icon icon--heart bi bi-heart${favouriteSongIds.has(song.id) ? "-fill" : ""} primary`} />
                                                        </div>
                                                        <div className="playlist__song-btn option-btn">
                                                            <i className="btn--icon bi bi-three-dots" />
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        className="playlist__song-btn playlist__song-btn--remove option-btn"
                                                        onClick={(event) => handleOpenRemoveSongDialog(event, song)}
                                                        aria-label={`Xóa ${song.title} khỏi playlist`}
                                                        title="Xóa khỏi playlist"
                                                    >
                                                        <i className="btn--icon bi bi-trash3" />
                                                    </button>
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

            {songToRemove ? (
                <DeleteSongFromPlaylistDialog
                    playlistId={selectedPlaylist?.id}
                    song={songToRemove}
                    onClose={handleCloseRemoveSongDialog}
                    onDeleted={handleSongRemoved}
                />
            ) : null}
        </>
    );
}