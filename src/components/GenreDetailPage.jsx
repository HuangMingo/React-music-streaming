import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { AddSongToPlaylist } from './AddSongToPlaylist/AddSongToPlaylist.jsx';
import { ArtistNameLink } from './ArtistNameLink/ArtistNameLink.jsx';
import { LoadingState } from './LoadingState/LoadingState.jsx';
import { useAuthContext } from '../context/AuthContext.jsx';
import { useMusicContext } from '../context/MusicContext.jsx';
import './GenrePages.css';
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

export function GenreDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuthContext();
  const {
    currentSong,
    isPlaying,
    setCurrentSong,
    setCurrentTime,
    setIsPlaying,
    setExploreSelectedPlaylist,
    favouriteSongIds,
    setFavouriteSongIds,
    toggleFavouriteSong,
    playlistMenuRef,
    handleSelectTargetPlaylist,
    selectedPlaylistBySong,
    userPlaylists,
  } = useMusicContext();
  const [loading, setLoading] = useState(true);
  const [genre, setGenre] = useState(null);
  const [songs, setSongs] = useState([]);
  const [error, setError] = useState('');
  const [openSongMenuId, setOpenSongMenuId] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    let mounted = true;

    async function loadGenre() {
      setLoading(true);
      setError('');

      try {
        const response = await axios.get(`${API_URL}/api/genres/${slug}/songs`);
        if (!mounted) return;

        const data = response?.data || {};
        setGenre(data.genre || null);
        setSongs(Array.isArray(data.songs) ? data.songs.map(normalizeSong) : []);
      } catch (err) {
        console.error('Load genre detail failed:', err);
        if (mounted) {
          setGenre(null);
          setSongs([]);
          setError(err?.response?.status === 404 ? 'Không tìm thấy thể loại' : 'Không thể tải dữ liệu thể loại');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadGenre();

    return () => {
      mounted = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!currentUser?.id || songs.length === 0) {
      setFavouriteSongIds(new Set());
      return;
    }

    let mounted = true;

    async function loadFavouriteStatuses() {
      try {
        const checks = await Promise.all(
          songs.map(async (song) => {
            const response = await axios.get(`${API_URL}/api/songs/is-favourite-song`, {
              params: {
                defaultPlaylistId: currentUser.defaultPlaylistId,
                songId: song.id,
              },
            });

            return { songId: song.id, isFavourite: Boolean(response?.data?.isFavouriteSong) };
          })
        );

        if (!mounted) return;

        setFavouriteSongIds(new Set(checks.filter((item) => item.isFavourite).map((item) => item.songId)));
      } catch (err) {
        console.error('Load genre favourite statuses failed:', err);
      }
    }

    loadFavouriteStatuses();

    return () => {
      mounted = false;
    };
  }, [currentUser?.defaultPlaylistId, currentUser?.id, songs, setFavouriteSongIds]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (playlistMenuRef.current && !playlistMenuRef.current.contains(event.target)) {
        setOpenSongMenuId(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      isMountedRef.current = false;
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [playlistMenuRef]);

  function handleSongClick(song) {
    const nextPlaylist = {
      id: genre?.id ? `genre-${genre.id}` : `genre-${slug}`,
      playlist_name: genre?.name || 'Thể Loại',
      playlist_image: genre?.image || song.image,
      songs,
    };

    setExploreSelectedPlaylist(nextPlaylist);
    setCurrentSong(normalizeSong(song));
    setCurrentTime(0);
    setIsPlaying(true);
  }

  function handleToggleSongMenu(event, songId) {
    event.stopPropagation();
    setOpenSongMenuId((currentId) => (currentId === songId ? null : songId));
  }

  const title = genre?.name || 'Thể Loại';
  const heroImage = getImage(genre);

  return (
    <div className="app__container tab--explore active">
      <div className="app__container-content">
        <div className="genre-detail explore__container">
          <div className="grid">
            <div className="row no-gutters">
              <div className="col l-12 m-12 c-12">
                <div className="container__header mb-10">
                  <h3 className="container__header-subtitle">{title}</h3>
                </div>
              </div>

              <div className="col l-12 m-12 c-12">
                {loading ? (
                  <LoadingState message="Đang tải thể loại..." />
                ) : error ? (
                  <div className="box--no-content">
                    <span className="no-content-text">{error}</span>
                  </div>
                ) : (
                  <>
                    <div className="genre-detail__header" style={{ backgroundImage: `linear-gradient(135deg, rgba(0,0,0,.15), rgba(0,0,0,.45)), url(${heroImage})` }}>
                      <div className="genre-detail__header-overlay" />
                      <div className="genre-detail__header-content">
                        <span className="genre-detail__eyebrow">Thể Loại</span>
                        <h2 className="genre-detail__title">{title}</h2>
                      </div>
                    </div>

                    <section className="row container__section mt-30">

                      <div className="col l-12 m-12 c-12">
                        <div className="container__playlist">

                          <div className="playlist__list mb-30 overflow-visible">
                            {songs.length === 0 ? (
                              <div className="box--no-content">
                                <span className="no-content-text">Chưa có bài hát nào thuộc thể loại này</span>
                              </div>
                            ) : (
                              songs.map((song, index) => {
                                const isActiveSong = currentSong?.id === song.id;
                                const artistNames = getArtistNames(song);

                                return (
                                  <div
                                    key={song.id ?? `genre-song-${index}`}
                                    className={`playlist__list-song media ${isActiveSong ? 'active' : ''} ${isActiveSong && isPlaying ? 'playing' : ''}`}
                                    onClick={() => handleSongClick(song)}
                                  >
                                    <div className="playlist__song-info media__left">
                                      <div className="playlist__song-thumb media__thumb mr-10" style={{ background: `url(${getImage(song)}) no-repeat center center / cover` }}>
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
                                        <span className="playlist__song-title info__title">{song.title}</span>
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

                                    <span className="playlist__song-time media__content">{formatDuration(song.duration_seconds)}</span>

                                    <div className="playlist__song-option song--tab media__right hide-on-mobile">
                                      <div
                                        className="playlist__song-btn btn--heart option-btn"
                                        onClick={(event) => toggleFavouriteSong(event, song.id)}
                                        title={favouriteSongIds.has(song.id) ? 'Bỏ thích bài hát' : 'Thêm vào bài hát yêu thích'}
                                      >
                                        <i className={`btn--icon song__icon icon--heart bi bi-heart${favouriteSongIds.has(song.id) ? '-fill' : ''} primary`} />
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
                                          selectedTargetPlaylist={selectedPlaylistBySong[song.id] ?? ''}
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