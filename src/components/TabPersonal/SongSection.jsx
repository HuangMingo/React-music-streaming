import { useMemo } from "react";
import { useMusicContext } from "../../context/MusicContext";

export function SongSection() {
    const {
        selectedPlaylist,
        currentIndex,
        setCurrentIndex,
        currentSong,
        setCurrentSong,
        setCurrentTime,
        isPlaying
    } = useMusicContext();

    const songs = useMemo(() => selectedPlaylist?.songs ?? [], [selectedPlaylist]);

    function handleClickSong(song, index) {
        setCurrentIndex(index);
        setCurrentSong(song);

        if (currentSong !== song) {
            setCurrentTime(0);
        }
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
                            <div className="container__header-actions">
                                <div className="button is-small container__header-btn hide-on-mobile">
                                    <input
                                        type="file"
                                        name="upload song"
                                        id="song__upload-input"
                                        className="container__header-input"
                                    />
                                    <label htmlFor="song__upload-input">
                                        <i className="bi bi-upload container__header-icon" />
                                        Tải lên
                                    </label>
                                </div>
                                <button className="button is-small button-primary container__header-btn btn--play-all">
                                    <i className="bi bi-play-fill container__header-icon" />
                                    <span>Phát tất cả</span>
                                </button>
                            </div>
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
                                        <span className="no-content-text">
                                            Chưa có bài hát trong playlist được chọn.
                                        </span>
                                    </div>
                                ) : (
                                    songs.map((song, index) => {
                                        const isActiveSong = currentIndex === index;
                                        const songDuration = Number(song.duration) || 0;
                                        const durationText = `${Math.floor(songDuration / 60)
                                            .toString()
                                            .padStart(2, "0")}:${Math.floor(songDuration % 60)
                                            .toString()
                                            .padStart(2, "0")}`;

                                        return (
                                            <div
                                                className={`playlist__list-song media ${isActiveSong ? "active" : ""} ${isActiveSong && isPlaying ? "playing" : ""}`}
                                                key={`${song.name}-${index}`}
                                                onClick={() => handleClickSong(song, index)}
                                            >
                                                <div className="playlist__song-info media__left">
                                                    <i className="bi bi-music-note-beamed playlist__song-icon mr-10" />
                                                    <div
                                                        className="playlist__song-thumb media__thumb mr-10"
                                                        style={{
                                                            background: `url(${song.image}) no-repeat center center / cover`
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
                                                        <span className="playlist__song-title info__title">{song.name}</span>
                                                        <p className="playlist__song-author info__author">
                                                            {song?.artists?.length ? (
                                                                song.artists.map((artist, i) => {
                                                                    return (
                                                                        <span key={i}>
                                                                            <a href="#" className="is-ghost">{artist}</a>
                                                                            {i < song.artists.length - 1 && ", "}
                                                                        </span>
                                                                    );
                                                                })
                                                            ) : (
                                                                "Đang cập nhật"
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="playlist__song-time media__content">
                                                    {durationText}
                                                </span>

                                                <div className="playlist__song-option song--tab media__right hide-on-mobile">
                                                    <div className="playlist__song-btn btn--mic option-btn">
                                                        <i className="btn--icon song__icon bi bi-mic-fill" />
                                                    </div>
                                                    <div className="playlist__song-btn btn--heart option-btn">
                                                        <i className="btn--icon song__icon icon--heart bi bi-heart-fill primary" />
                                                    </div>
                                                    <div className="playlist__song-btn option-btn">
                                                        <i className="btn--icon bi bi-three-dots" />
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
        </>
    )
}