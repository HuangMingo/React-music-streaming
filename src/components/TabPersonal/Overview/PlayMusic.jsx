import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { useMusicContext } from "../../../context/MusicContext.jsx";

export function PlayMusic({ playlist }) {
    const { currentIndex, setCurrentIndex, currentSong, setCurrentSong } = useMusicContext();
    const [slideIndex, setSlideIndex] = useState(0);
    const visibleSongs = useMemo(() => (playlist?.songs ?? []), [playlist]);
    const slideshowActive = useMemo(() => visibleSongs.length >= 2, [visibleSongs.length]);

    // --------------Active song-------------
    function handleClickSong(index) {
        setCurrentIndex(index);
        setCurrentSong(playlist.songs[index]);
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
        if (currentIndex >= visibleSongs.length) {
            setCurrentIndex(0);
        }
    }, [visibleSongs.length, currentIndex]);

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
                <div className="col l-12 m-12 c-12 mb-10">
                    <div className="container__header">
                        <NavLink className="container__header-title" to="song">
                            <h3>Bài Hát&nbsp;</h3>
                            <i className="bi bi-chevron-right container__header-icon" />
                        </NavLink>
                        <h3 className="container__header-subtitle">Bài Hát</h3>
                        <div className="container__header-actions">
                            <div className="button is-small container__header-btn hide-on-mobile">
                                <input
                                    type="file"
                                    name="upload song"
                                    id="home__upload-input"
                                    className="container__header-input"
                                    accept=".mp3"
                                />
                                <label htmlFor="home__upload-input">
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
                    <div className="container__playmusic">
                        {!playlist || !playlist.songs || playlist.songs.length === 0 ? (
                            <div className="box--no-content">
                                <div className="no-content-image" />
                                <span className="no-content-text">
                                    Chưa có playlist nào được chọn!
                                </span>
                            </div>
                        ) : (
                            <>
                                <div className="container__slide hide-on-mobile">
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
                                </div>
                                <div className="container__playlist">
                                    <div className="playlist__list">
                                        {playlist?.songs?.map((song, index) => {
                                            return (
                                                <div className={`playlist__list-song playing media ${currentIndex === index ? 'active' : ''}`} key={index} onClick={() => handleClickSong(index)}>
                                                    <div className="playlist__song-info media__left">
                                                        <div className="playlist__song-thumb media__thumb mr-10"
                                                            style={{
                                                                "background": `url(${song.image}) no-repeat center center / cover`
                                                            }}>
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
                                                            <span className="playlist__song-title info__title">{song.name}</span>
                                                            <p className="playlist__song-author info__author">
                                                                {
                                                                    song.singers.map((s, i) => {
                                                                        return (
                                                                            <span key={i}>
                                                                                <a href="#" className="is-ghost">{s}</a>
                                                                                {i < song.singers.length - 1 && ', '}
                                                                            </span>
                                                                        );
                                                                    })
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="playlist__song-time media__content">
                                                        {
                                                            `${Math.floor(song.duration / 60).toString().padStart(2, '0')}:${Math.floor(song.duration % 60).toString().padStart(2, '0')}`
                                                        }
                                                    </span>

                                                    <div className="playlist__song-option song--tab media__right hide-on-mobile">
                                                        <div className="playlist__song-btn btn--mic option-btn">
                                                            <i className="btn--icon song__icon bi bi-mic-fill"></i>
                                                        </div>
                                                        <div className="playlist__song-btn btn--heart option-btn">
                                                            <i className="btn--icon song__icon icon--heart bi bi-heart-fill primary"></i>
                                                        </div>
                                                        <div className="playlist__song-btn option-btn">
                                                            <i className="btn--icon bi bi-three-dots"></i>
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