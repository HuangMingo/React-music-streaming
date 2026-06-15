import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AddSongToPlaylist } from './AddSongToPlaylist/AddSongToPlaylist.jsx';
import { ArtistNameLink } from './ArtistNameLink/ArtistNameLink.jsx';
import { LoadingState } from './LoadingState/LoadingState.jsx';
import { useAuthContext } from '../context/AuthContext.jsx';
import { useMusicContext } from '../context/MusicContext.jsx';
import { API_URL } from '../api.js';

function getImage(item) {
    return item?.image || item?.playlist_image || '/assets/img/avatars/avatar.jpg';
}

function getArtistNames(song) {
    if (Array.isArray(song?.artist_names)) {
        return song.artist_names.filter(Boolean);
    }

    if (Array.isArray(song?.artists)) {
        return song.artists
            .map((artist) => (typeof artist === 'string' ? artist : artist?.name))
            .filter(Boolean);
    }

    return [];
}

function formatDuration(seconds) {
    const totalSeconds = Number(seconds) || 0;
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const restSeconds = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${restSeconds}`;
}

function normalizeSong(song) {
    const artistNames = getArtistNames(song);

    return {
        ...song,
        artist_names: artistNames,
        artists: Array.isArray(song?.artists)
            ? song.artists
            : artistNames.map((name) => ({ name })),
    };
}

function normalizePlaylist(item) {
    return {
        ...item,
        playlist_name: item?.playlist_name || item?.name || 'Playlist',
        playlist_image: getImage(item),
        songs: Array.isArray(item?.songs) ? item.songs.map(normalizeSong) : [],
    };
}

function normalizeAlbum(item) {
    return {
        ...item,
        playlist_name: item?.playlist_name || item?.title || item?.name || 'Album',
        playlist_image: getImage(item),
        songs: Array.isArray(item?.songs) ? item.songs.map(normalizeSong) : [],
    };
}

export function NewMusicPage() {
    const navigate = useNavigate();
    const { currentUser } = useAuthContext();
    const {
        currentSong,
        setCurrentSong,
        setCurrentTime,
        setIsPlaying,
        setExploreSelectedPlaylist,
        favouriteSongIds,
        favouritePlaylistIds,
        favouriteAlbumIds,
        setFavouriteSongIds,
        toggleFavouriteSong,
        toggleFavouritePlaylist,
        toggleFavouriteAlbum,
        playlistMenuRef,
        handleSelectTargetPlaylist,
        selectedPlaylistBySong,
        userPlaylists,
    } = useMusicContext();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({ songs: [], playlists: [], albums: [] });
    const [openSongMenuId, setOpenSongMenuId] = useState(null);

    useEffect(() => {
        let mounted = true;

        async function loadNewMusic() {
            setLoading(true);

            try {
                const response = await axios.get(`${API_URL}/api/songs/new-music`);
                const payload = response?.data || {};

                if (!mounted) {
                    return;
                }

                setData({
                    songs: Array.isArray(payload.songs) ? payload.songs : [],
                    playlists: Array.isArray(payload.playlists) ? payload.playlists : [],
                    albums: Array.isArray(payload.albums) ? payload.albums : [],
                });
            } catch (error) {
                console.error('Load new music failed:', error);
                if (mounted) {
                    setData({ songs: [], playlists: [], albums: [] });
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        loadNewMusic();

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        if (!currentUser?.id || data.songs.length === 0) {
            setFavouriteSongIds(new Set());
            return;
        }

        let mounted = true;

        async function loadFavouriteStatuses() {
            try {
                const checks = await Promise.all(
                    data.songs.map(async (song) => {
                        const response = await axios.get(
                            `${API_URL}/api/songs/is-favourite-song?defaultPlaylistId=${currentUser.defaultPlaylistId}&songId=${song.id}`
                        );

                        return {
                            songId: song.id,
                            isFavourite: Boolean(response?.data?.isFavouriteSong),
                        };
                    })
                );

                if (!mounted) {
                    return;
                }

                setFavouriteSongIds(new Set(checks.filter((item) => item.isFavourite).map((item) => item.songId)));
            } catch (error) {
                console.error('Load favourite statuses failed:', error);
            }
        }

        loadFavouriteStatuses();

        return () => {
            mounted = false;
        };
    }, [currentUser?.defaultPlaylistId, currentUser?.id, data.songs, setFavouriteSongIds]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (playlistMenuRef.current && !playlistMenuRef.current.contains(event.target)) {
                setOpenSongMenuId(null);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [playlistMenuRef]);

    function getSongQueue() {
        return data.songs.map(normalizeSong);
    }

    function handleSongClick(song) {
        const normalizedSong = normalizeSong(song);
        const songQueue = getSongQueue();

        setExploreSelectedPlaylist({
            id: 'new-music-songs',
            playlist_name: 'Nhạc Mới',
            playlist_image: normalizedSong.image,
            songs: songQueue,
        });
        setCurrentSong(normalizedSong);
        setCurrentTime(0);
        setIsPlaying(true);
    }

    function handleToggleSongMenu(event, songId) {
        event.stopPropagation();
        setOpenSongMenuId((currentId) => (currentId === songId ? null : songId));
    }

    function navigateToPlaylist(playlist) {
        if (!playlist?.id) return;

        navigate(`/playlist/${playlist.id}`, {
            state: {
                playlistId: playlist.id,
                playlist,
            },
        });
    }

    function navigateToAlbum(album) {
        if (!album?.id) return;

        navigate(`/album/${album.id}`, {
            state: {
                playlistId: album.id,
                playlist: album,
            },
        });
    }

    async function loadPlaylistDetails(playlist) {
        const normalizedPlaylist = normalizePlaylist(playlist);

        if (normalizedPlaylist.songs.length) {
            return normalizedPlaylist;
        }

        if (!normalizedPlaylist?.id) {
            return normalizedPlaylist;
        }

        const response = await axios.get(`${API_URL}/api/playlists/playlist-details`, {
            params: {
                playlistId: normalizedPlaylist.id,
            },
        });

        return normalizePlaylist(response?.data || normalizedPlaylist);
    }

    async function loadAlbumDetails(album) {
        const normalizedAlbum = normalizeAlbum(album);

        if (normalizedAlbum.songs.length) {
            return normalizedAlbum;
        }

        if (!normalizedAlbum?.id) {
            return normalizedAlbum;
        }

        const response = await axios.get(`${API_URL}/api/albums/${normalizedAlbum.id}`);
        return normalizeAlbum(response?.data || normalizedAlbum);
    }

    async function handlePlayPlaylist(event, playlist) {
        event.stopPropagation();

        try {
            const playlistData = await loadPlaylistDetails(playlist);
            const firstSong = playlistData?.songs?.[0];

            if (!firstSong) {
                navigateToPlaylist(playlistData);
                return;
            }

            setExploreSelectedPlaylist(playlistData);
            setCurrentSong(normalizeSong(firstSong));
            setCurrentTime(0);
            setIsPlaying(true);
            navigateToPlaylist(playlistData);
        } catch (error) {
            console.error('Play playlist failed:', error);
        }
    }

    async function handlePlayAlbum(event, album) {
        event.stopPropagation();

        try {
            const albumData = await loadAlbumDetails(album);
            const firstSong = albumData?.songs?.[0];

            if (!firstSong) {
                navigateToAlbum(albumData);
                return;
            }

            setExploreSelectedPlaylist(albumData);
            setCurrentSong(normalizeSong(firstSong));
            setCurrentTime(0);
            setIsPlaying(true);
            navigateToAlbum(albumData);
        } catch (error) {
            console.error('Play album failed:', error);
        }
    }

    const songs = data.songs;
    const playlists = data.playlists.map(normalizePlaylist);
    const albums = data.albums.map(normalizeAlbum);

    return (
        <div className="app__container tab--explore active">
            <div className="app__container-content">
                <div className="explore__container">
                    <div className="grid">
                        <div className="row no-gutters">
                            <div className="chart__container-header mb-40">
                                <h3 className="chart__header-name">#Nhạc nóng hổi vừa thổi vừa nghe</h3>
                            </div>

                            <div className="col l-12 m-12 c-12">
                                {loading ? (
                                    <LoadingState message="Đang tải Nhạc Mới..." />
                                ) : (
                                    <>
                                        <section className="row container__section mt-30">
                                            <div className="col l-12 m-12 c-12 mb-16">
                                                <div className="container__header">
                                                    <a href="#" className="container__header-title">
                                                        <h3 className="container__header-title">Bài hát mới</h3>
                                                    </a>

                                                    <h3 className="container__header-subtitle">6 bài hát mới nhất</h3>
                                                </div>
                                            </div>

                                            <div className="col l-12 m-12 c-12">
                                                <div className="container__playlist">
                                                    {/* <div className="playlist__header mt-5">
                                                        <span className="playlist__header-title">Bài hát</span>
                                                        <span className="playlist__header-time">Thời gian</span>
                                                        <span className="playlist__header-options hide-on-mobile">Tùy chọn</span>
                                                    </div> */}

                                                    <div className="playlist__list mb-30 overflow-visible">
                                                        {songs.length === 0 ? (
                                                            <div className="box--no-content">
                                                                <span className="no-content-text">Chưa có bài hát mới</span>
                                                            </div>
                                                        ) : (
                                                            songs.map((song, index) => {
                                                                const normalizedSong = normalizeSong(song);
                                                                const artistNames = getArtistNames(normalizedSong);
                                                                const isActiveSong = currentSong?.id === normalizedSong.id;

                                                                return (
                                                                    <div
                                                                        key={normalizedSong.id ?? `new-song-${index}`}
                                                                        className={`playlist__list-song media ${isActiveSong ? 'active' : ''} ${isActiveSong ? 'playing' : ''}`}
                                                                        onClick={() => handleSongClick(normalizedSong)}
                                                                    >
                                                                        <div className="playlist__song-info media__left">
                                                                            <div
                                                                                className="playlist__song-thumb media__thumb mr-10"
                                                                                style={{ background: `url(${getImage(normalizedSong)}) no-repeat center center / cover` }}
                                                                            >
                                                                                <span className="song-note note-1">♪</span>
                                                                                <span className="song-note note-2">♫</span>
                                                                                <span className="song-note note-3">♪</span>
                                                                                <span className="song-note note-4">♫</span>
                                                                                <div className="thumb--animate">
                                                                                    <div className="thumb--animate-img" style={{ background: "url('/assets/img/SongActiveAnimation/icon-playing.gif') no-repeat 50% / contain" }} />
                                                                                </div>
                                                                                <div className="play-song--actions">
                                                                                    <div className="control-btn btn-toggle-play btn--play-song">
                                                                                        <i className="bi bi-play-fill" />
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            <div className="playlist__song-body media__info">
                                                                                <span className="playlist__song-title info__title">{normalizedSong.title}</span>
                                                                                <p className="playlist__song-author info__author">
                                                                                    {artistNames.length ? (
                                                                                        artistNames.map((artist, artistIndex) => (
                                                                                            <span key={`${artist}-${artistIndex}`}>
                                                                                                <ArtistNameLink artist={artist} />
                                                                                                {artistIndex < artistNames.length - 1 && ', '}
                                                                                            </span>
                                                                                        ))
                                                                                    ) : (
                                                                                        'Chưa rõ nghệ sĩ'
                                                                                    )}
                                                                                </p>
                                                                            </div>
                                                                        </div>

                                                                        <span className="playlist__song-time media__content">{formatDuration(normalizedSong.duration_seconds)}</span>

                                                                        <div className="playlist__song-option song--tab media__right hide-on-mobile">
                                                                            <div
                                                                                className="playlist__song-btn btn--heart option-btn"
                                                                                onClick={(event) => toggleFavouriteSong(event, normalizedSong.id)}
                                                                                title={favouriteSongIds.has(normalizedSong.id) ? 'Bỏ thích bài hát' : 'Thêm vào bài hát yêu thích'}
                                                                            >
                                                                                <i className={`btn--icon song__icon icon--heart bi bi-heart${favouriteSongIds.has(normalizedSong.id) ? '-fill' : ''} primary`} />
                                                                            </div>
                                                                            <div
                                                                                className="playlist__song-btn option-btn playlist__song-more"
                                                                                onClick={(event) => handleToggleSongMenu(event, normalizedSong.id)}
                                                                                ref={openSongMenuId === normalizedSong.id ? playlistMenuRef : null}
                                                                                title="Khác"
                                                                            >
                                                                                <i className="btn--icon bi bi-three-dots" />
                                                                                <AddSongToPlaylist
                                                                                    song={normalizedSong}
                                                                                    isOpen={openSongMenuId === normalizedSong.id}
                                                                                    playlists={userPlaylists}
                                                                                    selectedTargetPlaylist={selectedPlaylistBySong[normalizedSong.id] ?? ''}
                                                                                    onSelectPlaylist={handleSelectTargetPlaylist}
                                                                                    onCloseMenu={() => setOpenSongMenuId(null)}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </section>

                                        <section className="row container__section mt-30">
                                            <div className="col l-12 m-12 c-12 mb-16">
                                                <div className="container__header">
                                                    <a href="#" className="container__header-title">
                                                        <h3 className="container__header-title">Playlist mới</h3>
                                                    </a>

                                                    <h3 className="container__header-subtitle">5 playlist mới nhất</h3>
                                                </div>
                                            </div>

                                            <div className="col l-12 m-12 c-12">
                                                <div className="row no-wrap new-playlist--container search-page__card-track">
                                                    {playlists.length === 0 ? (
                                                        <div className="box--no-content">
                                                            <span className="no-content-text">Chưa có playlist mới</span>
                                                        </div>
                                                    ) : (
                                                        playlists.map((playlist, index) => {
                                                            const isMine = Number(playlist.creator_id) === Number(currentUser?.id);
                                                            const isFavouritePlaylist = favouritePlaylistIds.has(playlist.id);

                                                            return (
                                                                <div className="search-page__card-col" key={playlist.id ?? `playlist-${index}`}>
                                                                    <div className="row__item item--playlist search-page__card" onClick={() => navigateToPlaylist(playlist)}>
                                                                        <div className="row__item-container flex--top-left">
                                                                            <div className="row__item-display br-5 search-page__card-display">
                                                                                <div className="row__item-img img--square" style={{ background: `url(${getImage(playlist)}) no-repeat center center / cover`, overflow: 'hidden' }} />
                                                                                <div className="row__item-actions">
                                                                                    <div
                                                                                        className="action-btn btn--heart"
                                                                                        onClick={(event) => {
                                                                                            
                                                                                            toggleFavouritePlaylist(event, playlist.id);
                                                                                        }}
                                                                                        title={!isMine ? (isFavouritePlaylist ? 'Bỏ thích playlist' : 'Thêm vào playlist yêu thích') : undefined}
                                                                                    >
                                                                                        <i className={`btn--icon icon--heart bi bi-heart${isFavouritePlaylist ? '-fill' : ''} primary`} />
                                                                                    </div>
                                                                                    <div className="btn--play-playlist" onClick={(event) => handlePlayPlaylist(event, playlist)}>
                                                                                        <div className="control-btn btn-toggle-play"><i className="bi bi-play-fill" /></div>
                                                                                        <span className="song-note note-1">♪</span>
                                                                                        <span className="song-note note-2">♫</span>
                                                                                        <span className="song-note note-3">♪</span>
                                                                                        <span className="song-note note-4">♫</span>
                                                                                    </div>
                                                                                    <div className="action-btn" onClick={(event) => event.stopPropagation()}>
                                                                                        <i className="btn--icon bi bi-three-dots" />
                                                                                    </div>
                                                                                </div>
                                                                                <div className="overlay" />
                                                                            </div>
                                                                            <div className="row__item-info search-page__card-info">
                                                                                <span className="row__info-name is-twoline">{playlist.playlist_name}</span>
                                                  
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </div>
                                        </section>

                                        <section className="row container__section mt-30">
                                            <div className="col l-12 m-12 c-12 mb-16">
                                                <div className="container__header">
                                                    <a href="#" className="container__header-title">
                                                        <h3 className="container__header-title">Album mới</h3>
                                                    </a>
                                                    <h3 className="container__header-subtitle">5 album mới nhất</h3>
                                                </div>
                                            </div>

                                            <div className="col l-12 m-12 c-12">
                                                <div className="row no-wrap new-playlist--container search-page__card-track">
                                                    {albums.length === 0 ? (
                                                        <div className="box--no-content">
                                                            <span className="no-content-text">Chưa có album mới</span>
                                                        </div>
                                                    ) : (
                                                        albums.map((album, index) => {
                                                            const isFavouriteAlbum = favouriteAlbumIds.has(album.id);

                                                            return (
                                                                <div className="search-page__card-col" key={album.id ?? `album-${index}`}>
                                                                    <div className="row__item item--playlist search-page__card" onClick={() => navigateToAlbum(album)}>
                                                                        <div className="row__item-container flex--top-left">
                                                                            <div className="row__item-display br-5 search-page__card-display">
                                                                                <div className="row__item-img img--square" style={{ background: `url(${getImage(album)}) no-repeat center center / cover`, overflow: 'hidden' }} />
                                                                                <div className="row__item-actions">
                                                                                    <div
                                                                                        className="action-btn btn--heart"
                                                                                        onClick={(event) => toggleFavouriteAlbum(event, album.id)}
                                                                                        title={isFavouriteAlbum ? 'Bỏ thích album' : 'Thêm vào album yêu thích'}
                                                                                    >
                                                                                        <i className={`btn--icon icon--heart bi bi-heart${isFavouriteAlbum ? '-fill' : ''} primary`} />
                                                                                    </div>
                                                                                    <div className="btn--play-playlist" onClick={(event) => handlePlayAlbum(event, album)}>
                                                                                        <div className="control-btn btn-toggle-play"><i className="bi bi-play-fill" /></div>
                                                                                        <span className="song-note note-1">♪</span>
                                                                                        <span className="song-note note-2">♫</span>
                                                                                        <span className="song-note note-3">♪</span>
                                                                                        <span className="song-note note-4">♫</span>
                                                                                    </div>
                                                                                    <div className="action-btn" onClick={(event) => event.stopPropagation()}>
                                                                                        <i className="btn--icon bi bi-three-dots" />
                                                                                    </div>
                                                                                </div>
                                                                                <div className="overlay" />
                                                                            </div>
                                                                            <div className="row__item-info search-page__card-info">
                                                                                <span className="row__info-name is-twoline">{album.playlist_name}</span>
                                                                                <h3 className="row__info-creator">{album.artist_name || 'Album'}</h3>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </div>
                                        </section>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}