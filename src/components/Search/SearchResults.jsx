import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { AddSongToPlaylist } from '../AddSongToPlaylist/AddSongToPlaylist.jsx';
import { useAuthContext } from '../../context/AuthContext.jsx';
import { useMusicContext } from '../../context/MusicContext.jsx';
import { ArtistNameLink } from '../ArtistNameLink/ArtistNameLink.jsx';
import { getArtistPath } from '../../utils/artistNavigation.js';
import '../../assets/css/main.css';
import { API_URL } from '../../api.js';

const SEARCH_TABS = [
  { slug: 'tat-ca', label: 'Tất cả' },
  { slug: 'bai-hat', label: 'Bài hát' },
  { slug: 'nghe-si', label: 'Nghệ sĩ' },
  { slug: 'playlist', label: 'Playlist/ Album' },
];

const VALID_TABS = new Set(SEARCH_TABS.map((tab) => tab.slug));

export function SearchResults() {
  const [searchParams] = useSearchParams();
  const { tab = 'tat-ca' } = useParams();
  const activeTab = VALID_TABS.has(tab) ? tab : 'tat-ca';
  const q = searchParams.get('q') || '';
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ songs: [], artists: [], playlists: [], albums: [] });
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [openSongMenuId, setOpenSongMenuId] = useState(null);
  const navigate = useNavigate();
  const { currentUser } = useAuthContext();
  const isMountedRef = useRef(true);
  const {
    currentSong,
    setCurrentSong,
    setCurrentTime,
    isPlaying,
    setIsPlaying,
    setExploreSelectedPlaylist,
    favouriteSongIds,
    favouritePlaylistIds,
    favouriteAlbumIds,
    setFavouriteSongIds,
    toggleFavouriteSong,
    toggleFavouritePlaylist,
    toggleFavouriteAlbum,
    handleClickSong,
    playlistMenuRef,
    handleSelectTargetPlaylist,
    selectedPlaylistBySong,
  } = useMusicContext();

  useEffect(() => {
    if (!VALID_TABS.has(tab)) {
      navigate(`/tim-kiem/tat-ca?q=${encodeURIComponent(q)}`, { replace: true });
    }
  }, [navigate, q, tab]);

  useEffect(() => {
    let mounted = true;
    async function doSearch() {
      if (!q.trim()) {
        setResults({ songs: [], artists: [], playlists: [], albums: [] });
        return;
      }
      setLoading(true);
      try {
        const userParam = currentUser?.id ? `&userId=${encodeURIComponent(currentUser.id)}` : '';
        const res = await axios.get(`${API_URL}/api/search/all?q=${encodeURIComponent(q)}${userParam}`);
        if (!mounted) return;
        const data = res.data || {};
        setResults({
          songs: Array.isArray(data.songs) ? data.songs : [],
          artists: Array.isArray(data.artists) ? data.artists : [],
          playlists: Array.isArray(data.playlists) ? data.playlists : [],
          albums: Array.isArray(data.albums) ? data.albums : [],
        });
      } catch (err) {
        console.error('Search error', err);
        if (mounted) setResults({ songs: [], artists: [], playlists: [], albums: [] });
      } finally {
        if (mounted) setLoading(false);
      }
    }
    doSearch();
    return () => {
      mounted = false;
    };
  }, [q, currentUser?.id]);
  //lấy dữ liệu playlist của người dùng để hiển thị trong menu thêm bài hát vào playlist
  useEffect(() => {
    async function loadUserPlaylists() {
      if (!currentUser?.id) {
        setUserPlaylists([]);
        return;
      }

      try {
        const response = await axios.get(
          `${API_URL}/api/playlists/user-created-playlists?userId=${currentUser.id}`
        );
        setUserPlaylists(Array.isArray(response?.data) ? response.data : []);
      } catch (error) {
        console.error('Load user playlists failed:', error);
        setUserPlaylists([]);
      }
    }

    loadUserPlaylists();
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id || results.songs.length === 0) {
      setFavouriteSongIds(new Set());
      return;
    }

    let mounted = true;
    async function loadFavouriteStatuses() {
      try {
        const checks = await Promise.all(
          results.songs.map(async (song) => {
            const response = await axios.get(
              `${API_URL}/api/songs/is-favourite-song?defaultPlaylistId=${currentUser.defaultPlaylistId}&songId=${song.id}`
            );
            return { songId: song.id, isFavourite: Boolean(response?.data?.isFavouriteSong) };
          })
        );

        if (!mounted) return;
        setFavouriteSongIds(new Set(checks.filter((item) => item.isFavourite).map((item) => item.songId)));
      } catch (error) {
        console.error('Load favourite statuses failed:', error);
      }
    }

    loadFavouriteStatuses();
    return () => {
      mounted = false;
    };
  }, [currentUser?.defaultPlaylistId, currentUser?.id, results.songs, setFavouriteSongIds]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (playlistMenuRef.current && !playlistMenuRef.current.contains(event.target)) {
        if (!isMountedRef.current) return;
        setOpenSongMenuId(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      isMountedRef.current = false;
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [playlistMenuRef]);

  function goToTab(nextTab) {
    navigate(`/tim-kiem/${nextTab}?q=${encodeURIComponent(q)}`);
  }

  function getPlaylistName(playlist) {
    return playlist?.playlist_name || playlist?.name || '';
  }

  function getAlbumName(album) {
    return album?.playlist_name || album?.title || album?.name || album?.album_name || '';
  }

  function createPlaylistSlug(playlist) {
    const rawSlug = playlist?.slug || getPlaylistName(playlist);
    return String(rawSlug)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function createAlbumSlug(album) {
    const rawSlug = album?.slug || getAlbumName(album);
    return String(rawSlug)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function navigateToPlaylist(playlist) {
    const slug = createPlaylistSlug(playlist);
    if (!slug) return;

    navigate(`/playlist/${slug}`, {
      state: {
        playlistId: playlist?.id,
        playlist,
      },
    });
  }

  function toPlayableAlbum(album) {
    return {
      ...album,
      playlist_name: getAlbumName(album),
      playlist_image: getImage(album),
      songs: Array.isArray(album?.songs) ? album.songs : [],
    };
  }

  function navigateToAlbum(album) {
    const albumData = toPlayableAlbum(album);
    const slug = createAlbumSlug(albumData);
    if (!slug) return;

    setExploreSelectedPlaylist(albumData);
    navigate(`/playlist/${slug}`, {
      state: {
        playlistId: albumData?.id,
        playlist: albumData,
      },
    });
  }

  async function loadPlaylistDetails(playlist) {
    if (playlist?.songs?.length) {
      return playlist;
    }

    if (!playlist?.id) {
      return playlist;
    }

    const response = await axios.get(`${API_URL}/api/playlists/playlist-details`, {
      params: {
        playlistId: playlist.id,
      },
    });

    return response.data;
  }

  async function loadAlbumDetails(album) {
    if (album?.songs?.length) {
      return toPlayableAlbum(album);
    }

    if (!album?.id) {
      return toPlayableAlbum(album);
    }

    const response = await axios.get(`${API_URL}/api/albums/${album.id}`);
    return toPlayableAlbum(response.data);
  }

  async function handlePlayPlaylist(event, playlist) {
    event.stopPropagation();

    try {
      const playlistData = await loadPlaylistDetails(playlist);
      const songs = playlistData?.songs ?? [];
      const firstSong = songs[0];

      if (!firstSong) {
        navigateToPlaylist(playlist);
        return;
      }

      setExploreSelectedPlaylist(playlistData);
      setCurrentSong(firstSong);
      setCurrentTime(0);
      setIsPlaying(true);
      navigate(`/playlist/${createPlaylistSlug(playlistData) || createPlaylistSlug(playlist)}`, {
        state: {
          playlistId: playlistData?.id ?? playlist?.id,
          playlist: playlistData,
        },
      });
    } catch (error) {
      console.error('Play playlist failed:', error);
    }
  }

  async function handlePlayAlbum(event, album) {
    event.stopPropagation();

    try {
      const albumData = await loadAlbumDetails(album);
      const songs = albumData?.songs ?? [];
      const firstSong = songs[0];

      if (!firstSong) {
        navigateToAlbum(albumData);
        return;
      }

      setExploreSelectedPlaylist(albumData);
      setCurrentSong(firstSong);
      setCurrentTime(0);
      setIsPlaying(true);
      navigate(`/playlist/${createAlbumSlug(albumData) || createAlbumSlug(album)}`, {
        state: {
          playlistId: albumData?.id ?? album?.id,
          playlist: albumData,
        },
      });
    } catch (error) {
      console.error('Play album failed:', error);
    }
  }
//Xử lí sự kiến nhấn bài hát
  function handleSongClick(song) {
    setExploreSelectedPlaylist(null);
    handleClickSong(song);
    setIsPlaying(true);
  }
//Mở menu bài hát
  function handleToggleSongMenu(event, songId) {
    event.stopPropagation();
    setOpenSongMenuId((prevSongId) => (prevSongId === songId ? null : songId));
  }

  function formatDuration(song) {
    const totalSeconds = Number(song?.duration_seconds ?? song?.duration ?? 0);
    if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '';
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function getImage(item) {
    return item?.image || item?.playlist_image || '/assets/img/avatars/avatar.jpg';
  }

  function getArtistNames(song) {
    return Array.isArray(song?.artist_names) ? song.artist_names.join(', ') : '';
  }

  const topSongs = activeTab === 'tat-ca' ? results.songs.slice(0, 5) : results.songs;
  const topArtists = activeTab === 'tat-ca' ? results.artists.slice(0, 5) : results.artists;
  const topPlaylists = activeTab === 'tat-ca' ? results.playlists.slice(0, 5) : results.playlists;
  const topAlbums = activeTab === 'tat-ca' ? results.albums.slice(0, 5) : results.albums;
  const topCollections = [
    ...topPlaylists.map((item) => ({ type: 'playlist', item })),
    ...topAlbums.map((item) => ({ type: 'album', item })),
  ];
  const showSongs = activeTab === 'tat-ca' || activeTab === 'bai-hat';
  const showArtists = activeTab === 'tat-ca' || activeTab === 'nghe-si';
  const showPlaylists = activeTab === 'tat-ca' || activeTab === 'playlist';

  return (
    <div className="app__container tab--search active">
      <div className="app__container-content">
        {loading && <div className="loader">Đang tìm...</div>}

        {!loading && (
          <div className="search-page">
            <div className="search-results">
              <div className="search-page__headline">
                <div className="search-page__eyebrow">Kết quả tìm kiếm</div>
                <h2 className="search-page__title">“{q}”</h2>
                <div className="search-page__tabs">
                  {SEARCH_TABS.map((item) => (
                    <button
                      key={item.slug}
                      className={`search-page__tab ${activeTab === item.slug ? 'search-page__tab--active' : ''}`}
                      type="button"
                      onClick={() => goToTab(item.slug)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {showSongs && (
                <section className="search-page__section">
                  <div className="search-page__section-header">
                    <h3 className="search-page__section-title">Bài hát</h3>
                    {activeTab === 'tat-ca' && (
                      <button className="search-page__see-all" type="button" onClick={() => goToTab('bai-hat')}>
                        Xem tất cả
                      </button>
                    )}
                  </div>

                  {topSongs.length === 0 ? (
                    <div className="search-page__empty">Không có bài hát nào</div>
                  ) : (
                    <div className="container__playlist">
                      <div className="playlist__list-charts overflow-visible search-page__songs">
                        {topSongs.map((song, idx) => {
                          const isActiveSong = currentSong?.id === song.id;
                          const isPlayingSong = isActiveSong && isPlaying;

                          return (
                            <div
                              key={song.id ?? `song-${idx}`}
                              className={`playlist__list-song media ${isActiveSong ? 'active' : ''} ${isPlayingSong ? 'playing' : ''}`}
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
                                    {
                                      song.artist_names.map((artist, artistIndex) => {
                                        return (
                                          <span key={`${artist}-${artistIndex}`}>
                                            <ArtistNameLink artist={artist} />
                                            {artistIndex < song.artist_names.length - 1 && ", "}
                                          </span>
                                        )

                                      })
                                    }
                                  </p>
                                </div>
                              </div>

                              <span className="playlist__song-time media__content">{formatDuration(song)}</span>

                              <div className="playlist__song-option song--tab media__right hide-on-mobile">
                                <div
                                  className="playlist__song-btn btn--heart option-btn"
                                  //sự kiện nhấn yêu thích/bỏ yêu thích bài hát
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
                        })}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {showArtists && (
                <section className="search-page__section">
                  <div className="search-page__section-header">
                    <h3 className="search-page__section-title">Nghệ sĩ</h3>
                    {activeTab === 'tat-ca' && (
                      <button className="search-page__see-all" type="button" onClick={() => goToTab('nghe-si')}>
                        Xem tất cả
                      </button>
                    )}
                  </div>

                  {topArtists.length === 0 ? (
                    <div className="search-page__empty">Không có nghệ sĩ nào</div>
                  ) : (
                    <div className="search-page__artist-track">
                      {topArtists.map((artist, i) => (
                        <div key={artist.id ?? `artist-${i}`} className="search-page__artist-col">
                          <div className="row__item item--artist search-page__artist-card" onClick={() => navigate(getArtistPath(artist))}>
                            <div className="row__item-container flex--top-left">
                              <div className="row__item-display is-rounded search-page__artist-display">
                                <div className="row__item-img img--square is-rounded" style={{ background: `url(${getImage(artist)}) no-repeat center center / cover` }} />
                                <div className="row__item-actions">
                                  <div className="btn--play-playlist">
                                    <div className="control-btn btn-toggle-play">
                                      <i className="bi bi-play-fill icon-play" />
                                    </div>
                                  </div>
                                </div>
                                <div className="overlay" />
                              </div>
                              <div className="row__item-info media artist--info search-page__artist-info">
                                <div className="media__left">
                                  <ArtistNameLink artist={artist} className="row__info-name is-ghost mt-15 lh-19 text-center" />
                                  <h3 className="row__info-creator text-center">Nghệ sĩ</h3>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {showPlaylists && (
                <section className="search-page__section">
                  <div className="search-page__section-header">
                    <h3 className="search-page__section-title">Playlist/ Album</h3>
                    {activeTab === 'tat-ca' && (
                      <button className="search-page__see-all" type="button" onClick={() => goToTab('playlist')}>
                        Xem tất cả
                      </button>
                    )}
                  </div>

                  {topCollections.length === 0 ? (
                    <div className="search-page__empty">Không tìm thấy playlist phù hợp</div>
                  ) : (
                    <div className="search-page__card-track">
                      {topCollections.map(({ type, item: pl }, idx) => {
                        const isAlbum = type === 'album';
                        const isMine = !isAlbum && Number(pl.creator_id) === Number(currentUser?.id);
                        const isFavouriteAlbum = favouriteAlbumIds.has(pl.id);
                        return (
                        <div className="search-page__card-col" key={`${type}-${pl.id ?? idx}`}>
                          <div className="row__item item--playlist search-page__card" onClick={() => (isAlbum ? navigateToAlbum(pl) : navigateToPlaylist(pl))}>
                            <div className="row__item-container flex--top-left">
                              <div className="row__item-display br-5 search-page__card-display">
                                <div className="row__item-img img--square" style={{ background: `url(${getImage(pl)}) no-repeat center center / cover`, overflow: 'hidden' }} />
                                <div className="row__item-actions">
                                  <div
                                    className="action-btn btn--heart"
                                    onClick={(e) => {
                                      if (isAlbum) {
                                        toggleFavouriteAlbum(e, pl.id);
                                        return;
                                      }
                                      if (isMine) {
                                        e.stopPropagation();
                                        return;
                                      }
                                      toggleFavouritePlaylist(e, pl.id);
                                    }}
                                    title={
                                      isAlbum
                                        ? (isFavouriteAlbum ? 'Bỏ thích album' : 'Thêm vào album yêu thích')
                                        : (!isMine ? (favouritePlaylistIds.has(pl.id) ? 'Bỏ thích playlist' : 'Thêm vào playlist yêu thích') : undefined)
                                    }
                                  >
                                    {isMine ? (
                                      <i className="btn--icon bi bi-x-lg" onClick={() => handleClickDeletePlaylist(pl.id)} />
                                    ) : isAlbum ? (
                                      <i className={`btn--icon icon--heart bi bi-heart${isFavouriteAlbum ? '-fill' : ''} primary`} />
                                    ) : (
                                      <i className={`btn--icon icon--heart bi bi-heart${favouritePlaylistIds.has(pl.id) ? '-fill' : ''} primary`} />
                                    )}
                                  </div>
                                  <div className="btn--play-playlist" onClick={(event) => (isAlbum ? handlePlayAlbum(event, pl) : handlePlayPlaylist(event, pl))}>
                                    <div className="control-btn btn-toggle-play"><i className="bi bi-play-fill" /></div>
                                    <span className="song-note note-1">♪</span>
                                    <span className="song-note note-2">♫</span>
                                    <span className="song-note note-3">♪</span>
                                    <span className="song-note note-4">♫</span>
                                  </div>
                                  <div className="playlist-actions">
                                    {isMine && (
                                      <button className="playlist-more-btn" onClick={(event) => event.stopPropagation()}>
                                        ...
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <div className="overlay" />
                              </div>
                              <div className="row__item-info search-page__card-info">
                                <span className="row__info-name is-twoline">{isAlbum ? getAlbumName(pl) : (pl.name || pl.playlist_name)}</span>
                                <h3 className="row__info-creator">{isAlbum ? (pl.artist_name || 'Album') : (pl.username || pl.creator || 'Playlist')}</h3>
                              </div>
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}


            </div>
          </div>
        )}
      </div>
    </div>
  );
}
