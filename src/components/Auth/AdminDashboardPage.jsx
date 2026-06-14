import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { API_URL } from '../../api.js';
import { useAuthContext } from '../../context/AuthContext';
import { showNotificationToast } from '../../toast.js';
import { InsertSong } from './InsertSong.jsx';
import { UpdateAlbum } from './UpdateAlbum.jsx';
import { UpdateArtist } from './UpdateArtist.jsx';
import { SongManagementPage } from './SongManagementPage.jsx';
import { AlbumManagementPage } from "./AlbumManagementPage.jsx";
import { ArtistManagementPage } from "./ArtistManagementPage.jsx";
import { PlaylistManagementPage } from "./PlaylistManagementPage.jsx";
const EMPTY_SONG_FORM = {
  title: '',
  album_id: '',
  track_number: '',
  release_date: '',
  artist_ids: [],
  audio: '',
  image: '',
  lyrics: '',
  duration_seconds: '',
};

const EMPTY_ALBUM_FORM = {
  title: '',
  image: '',
  release_date: '',
  artist_id: '',
};

const EMPTY_ARTIST_FORM = {
  name: '',
  image: '',
  bio: '',
  follower_count: '',
};

const EMPTY_PLAYLIST_FORM = {
  name: '',
  image: '',
  songIds: [],
};

const EMPTY_SONG_FILES = {
  audio: null,
  image: null,
  lyrics: null,
};

const EMPTY_UPLOAD_STATUS = {
  audio: '',
  image: '',
  lyrics: '',
  album: '',
  artist: '',
};

const EMPTY_FORM_ERRORS = {};

const ADMIN_TAB_PATHS = {
  songs: '/admin/songs',
  albums: '/admin/albums',
  artists: '/admin/artists',
  playlists: '/admin/playlists',
  users: '/admin/users',
};

const SONG_CREATE_DRAFT_KEY = 'admin-song-draft-create';

function toDateInput(value) {
  return value ? String(value).slice(0, 10) : '';
}

function getSongDraftKey(mode, songId) {
  if (mode === 'create') {
    return SONG_CREATE_DRAFT_KEY;
  }

  if (mode === 'edit' && songId) {
    return `admin-song-draft-edit-${songId}`;
  }

  return '';
}

function readSongDraft(mode, songId) {
  const draftKey = getSongDraftKey(mode, songId);

  if (!draftKey) {
    return null;
  }

  try {
    const draft = JSON.parse(localStorage.getItem(draftKey));
    return draft && typeof draft === 'object' ? draft : null;
  } catch (error) {
    return null;
  }
}

function clearSongDraft(mode, songId) {
  const draftKey = getSongDraftKey(mode, songId);

  if (draftKey) {
    localStorage.removeItem(draftKey);
  }
}

function getSongFormFromSong(song) {
  return {
    title: song.title || '',
    album_id: song.album_id || '',
    track_number: song.track_number || '',
    release_date: toDateInput(song.release_date),
    artist_ids: song.artists?.map((artist) => Number(artist.id)).filter(Boolean) || [],
    audio: song.audio || '',
    image: song.image || '',
    lyrics: song.lyrics || '',
    duration_seconds: song.duration_seconds || '',
  };
}

function formatDuration(seconds) {
  const total = Number(seconds || 0);
  if (!total) {
    return '--:--';
  }

  const minutes = Math.floor(total / 60);
  const remainSeconds = total % 60;
  return `${minutes}:${String(remainSeconds).padStart(2, '0')}`;
}

export function AdminDashboardPage() {
  const { tab, mode, songId } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAdmin, isSuperAdmin } = useAuthContext();
  const [activeTab, setActiveTab] = useState('songs');
  const [songMode, setSongMode] = useState('list');
  const [overview, setOverview] = useState({ songs: 0, albums: 0, artists: 0, playlists: 0, users: 0 });
  const [songs, setSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [artists, setArtists] = useState([]);
  const [systemPlaylists, setSystemPlaylists] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [songSubmitting, setSongSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [editingSongId, setEditingSongId] = useState(null);
  const [editingAlbumId, setEditingAlbumId] = useState(null);
  const [editingArtistId, setEditingArtistId] = useState(null);
  const [editingPlaylistId, setEditingPlaylistId] = useState(null);
  const [albumFormOpen, setAlbumFormOpen] = useState(false);
  const [artistFormOpen, setArtistFormOpen] = useState(false);
  const [playlistFormOpen, setPlaylistFormOpen] = useState(false);
  const [playlistDropdownOpen, setPlaylistDropdownOpen] = useState(false);
  const [songForm, setSongForm] = useState(EMPTY_SONG_FORM);
  const [songFiles, setSongFiles] = useState(EMPTY_SONG_FILES);
  const [songDraftReady, setSongDraftReady] = useState(false);
  const [uploading, setUploading] = useState(EMPTY_UPLOAD_STATUS);
  const [albumForm, setAlbumForm] = useState(EMPTY_ALBUM_FORM);
  const [artistForm, setArtistForm] = useState(EMPTY_ARTIST_FORM);
  const [playlistForm, setPlaylistForm] = useState(EMPTY_PLAYLIST_FORM);
  const [songFormErrors, setSongFormErrors] = useState(EMPTY_FORM_ERRORS);
  const [albumFormErrors, setAlbumFormErrors] = useState(EMPTY_FORM_ERRORS);
  const [artistFormErrors, setArtistFormErrors] = useState(EMPTY_FORM_ERRORS);
  const [playlistFormErrors, setPlaylistFormErrors] = useState(EMPTY_FORM_ERRORS);

  const adminHeaders = useMemo(
    () => ({ 'x-user-id': currentUser?.id }),
    [currentUser?.id]
  );

  const tabs = useMemo(
    () => [
      { id: 'songs', label: 'Quản lý bài hát' },
      { id: 'albums', label: 'Quản lý album' },
      { id: 'artists', label: 'Quản lý nghệ sĩ' },
      { id: 'playlists', label: 'Quản lý playlist' },
      ...(isSuperAdmin ? [{ id: 'users', label: 'Quản lý user' }] : []),
    ],
    [isSuperAdmin]
  );

  useEffect(() => {
    const nextTab = ['songs', 'albums', 'artists', 'playlists', 'users'].includes(tab) ? tab : 'songs';
    const isFormMode = ['create', 'edit'].includes(mode);
    const canUseFormMode = ['songs', 'albums', 'artists', 'playlists'].includes(nextTab) && isFormMode;

    if (nextTab === 'users' && !isSuperAdmin) {
      navigate('/admin/songs', { replace: true });
      return;
    }

    if (mode && !canUseFormMode) {
      navigate(ADMIN_TAB_PATHS[nextTab] || '/admin/songs', { replace: true });
      return;
    }

    if (mode === 'edit' && !songId) {
      navigate(ADMIN_TAB_PATHS[nextTab] || ADMIN_TAB_PATHS.songs, { replace: true });
      return;
    }

    setActiveTab(nextTab);
    setSongMode(nextTab === 'songs' && ['create', 'edit'].includes(mode) ? 'create' : 'list');
    setAlbumFormOpen(nextTab === 'albums' && isFormMode);
    setArtistFormOpen(nextTab === 'artists' && isFormMode);
    setPlaylistFormOpen(nextTab === 'playlists' && isFormMode);
    setSongDraftReady(false);
  }, [isSuperAdmin, mode, navigate, songId, tab]);

  useEffect(() => {
    if (tab !== 'songs' || mode !== 'create') {
      return;
    }

    const draft = readSongDraft(mode, songId);
    setEditingSongId(null);
    setSongForm({ ...EMPTY_SONG_FORM, ...(draft || {}) });
    setSongFiles(EMPTY_SONG_FILES);
    setUploading(EMPTY_UPLOAD_STATUS);
    setSongFormErrors(EMPTY_FORM_ERRORS);
    setSongDraftReady(true);
  }, [mode, songId, tab]);

  useEffect(() => {
    if (tab !== 'songs' || mode !== 'edit' || !songId || !songs.length) {
      return;
    }

    const song = songs.find((item) => String(item.id) === String(songId));
    if (!song) {
      setMessage('Không tìm thấy bài hát cần sửa.');
      navigate(ADMIN_TAB_PATHS.songs, { replace: true });
      return;
    }

    const draft = readSongDraft(mode, songId);
    setEditingSongId(song.id);
    setSongForm({ ...getSongFormFromSong(song), ...(draft || {}) });
    setSongFiles(EMPTY_SONG_FILES);
    setUploading(EMPTY_UPLOAD_STATUS);
    setSongFormErrors(EMPTY_FORM_ERRORS);
    setSongDraftReady(true);
  }, [mode, navigate, songId, songs, tab]);

  useEffect(() => {
    if (tab !== 'albums' || !['create', 'edit'].includes(mode)) {
      return;
    }

    if (mode === 'create') {
      setEditingAlbumId(null);
      setAlbumForm(EMPTY_ALBUM_FORM);
      setUploading((current) => ({ ...current, album: '' }));
      setAlbumFormErrors(EMPTY_FORM_ERRORS);
      setAlbumFormOpen(true);
      return;
    }

    if (!songId || !albums.length) {
      return;
    }

    const album = albums.find((item) => String(item.id) === String(songId));
    if (!album) {
      setMessage('Không tìm thấy album cần sửa.');
      navigate(ADMIN_TAB_PATHS.albums, { replace: true });
      return;
    }

    setEditingAlbumId(album.id);
    setAlbumForm({
      title: album.title || album.name || '',
      image: album.image || '',
      release_date: toDateInput(album.release_date),
      artist_id: album.artist_id || '',
    });
    setUploading((current) => ({ ...current, album: '' }));
    setAlbumFormErrors(EMPTY_FORM_ERRORS);
    setAlbumFormOpen(true);
  }, [albums, mode, navigate, songId, tab]);

  useEffect(() => {
    if (tab !== 'artists' || !['create', 'edit'].includes(mode)) {
      return;
    }

    if (mode === 'create') {
      setEditingArtistId(null);
      setArtistForm(EMPTY_ARTIST_FORM);
      setUploading((current) => ({ ...current, artist: '' }));
      setArtistFormErrors(EMPTY_FORM_ERRORS);
      setArtistFormOpen(true);
      return;
    }

    if (!songId || !artists.length) {
      return;
    }

    const artist = artists.find((item) => String(item.id) === String(songId));
    if (!artist) {
      setMessage('Không tìm thấy nghệ sĩ cần sửa.');
      navigate(ADMIN_TAB_PATHS.artists, { replace: true });
      return;
    }

    setEditingArtistId(artist.id);
    setArtistForm({
      name: artist.name || '',
      image: artist.image || artist.avatar || '',
      bio: artist.bio || '',
      follower_count: artist.follower_count || artist.followers_count || '',
    });
    setUploading((current) => ({ ...current, artist: '' }));
    setArtistFormErrors(EMPTY_FORM_ERRORS);
    setArtistFormOpen(true);
  }, [artists, mode, navigate, songId, tab]);

  useEffect(() => {
    if (tab !== 'playlists' || !['create', 'edit'].includes(mode)) {
      return;
    }

    if (mode === 'create') {
      setEditingPlaylistId(null);
      setPlaylistForm(EMPTY_PLAYLIST_FORM);
      setUploading((current) => ({ ...current, playlist: '' }));
      setPlaylistFormErrors(EMPTY_FORM_ERRORS);
      setPlaylistDropdownOpen(false);
      setPlaylistFormOpen(true);
      return;
    }

    if (!songId || !systemPlaylists.length) {
      return;
    }

    const playlist = systemPlaylists.find((item) => String(item.id) === String(songId));
    if (!playlist) {
      setMessage('Không tìm thấy playlist cần sửa.');
      navigate(ADMIN_TAB_PATHS.playlists, { replace: true });
      return;
    }

    setEditingPlaylistId(playlist.id);
    setPlaylistForm({
      name: playlist.name || playlist.playlist_name || '',
      image: playlist.image || playlist.playlist_image || '',
      songIds: Array.isArray(playlist.song_ids)
        ? playlist.song_ids.map(Number).filter(Boolean)
        : (playlist.songs || []).map((song) => Number(song.id)).filter(Boolean),
    });
    setUploading((current) => ({ ...current, playlist: '' }));
    setPlaylistFormErrors(EMPTY_FORM_ERRORS);
    setPlaylistDropdownOpen(false);
    setPlaylistFormOpen(true);
  }, [mode, navigate, songId, systemPlaylists, tab]);

  useEffect(() => {
    const draftKey = getSongDraftKey(mode, songId);

    if (!songDraftReady || tab !== 'songs' || !draftKey) {
      return;
    }

    localStorage.setItem(draftKey, JSON.stringify(songForm));
  }, [mode, songDraftReady, songForm, songId, tab]);

  const setNotice = useCallback((text) => {
    setMessage(text);
    showNotificationToast(text);
  }, []);

  function clearFieldError(setErrors, field) {
    setErrors((current) => {
      if (!current[field] && !current.form) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      delete next.form;
      return next;
    });
  }

  function updateSongForm(nextForm, field) {
    setSongForm(nextForm);
    if (field) {
      clearFieldError(setSongFormErrors, field);
    }
  }

  function updateAlbumForm(nextForm, field) {
    setAlbumForm(nextForm);
    if (field) {
      clearFieldError(setAlbumFormErrors, field);
    }
  }

  function updateArtistForm(nextForm, field) {
    setArtistForm(nextForm);
    if (field) {
      clearFieldError(setArtistFormErrors, field);
    }
  }

  function updatePlaylistForm(nextForm, field) {
    setPlaylistForm(nextForm);
    if (field) {
      clearFieldError(setPlaylistFormErrors, field);
    }
  }

  const fetchAdminData = useCallback(async () => {
    if (!currentUser?.id) {
      return;
    }

    setLoading(true);
    try {
      const requests = [
        axios.get(`${API_URL}/api/admin/overview`, { headers: adminHeaders }),
        axios.get(`${API_URL}/api/admin/songs`, { headers: adminHeaders }),
        axios.get(`${API_URL}/api/admin/albums`, { headers: adminHeaders }),
        axios.get(`${API_URL}/api/admin/artists`, { headers: adminHeaders }),
        axios.get(`${API_URL}/api/admin/playlists`, { headers: adminHeaders }),
      ];

      if (isSuperAdmin) {
        requests.push(axios.get(`${API_URL}/api/admin/users`, { headers: adminHeaders }));
      }

      const [overviewRes, songsRes, albumsRes, artistsRes, playlistsRes, usersRes] = await Promise.all(requests);
      setOverview(overviewRes.data.data || { songs: 0, albums: 0, artists: 0, playlists: 0, users: 0 });
      setSongs(songsRes.data.data || []);
      setAlbums(albumsRes.data.data || []);
      setArtists(artistsRes.data.data || []);
      setSystemPlaylists(playlistsRes.data.data || []);
      setUsers(usersRes?.data?.data || []);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Không thể tải dữ liệu quản trị.');
    } finally {
      setLoading(false);
    }
  }, [adminHeaders, currentUser?.id, isSuperAdmin]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  function openCreateSongForm() {
    setSongMode('create');
    setEditingSongId(null);
    setSongForm(EMPTY_SONG_FORM);
    setSongFiles(EMPTY_SONG_FILES);
    setSongDraftReady(false);
    setUploading(EMPTY_UPLOAD_STATUS);
    setSongFormErrors(EMPTY_FORM_ERRORS);
    setMessage('');
    navigate('/admin/songs/create');
  }

  function closeCreateSongForm() {
    clearSongDraft(mode, songId);
    setSongMode('list');
    setEditingSongId(null);
    setSongForm(EMPTY_SONG_FORM);
    setSongFiles(EMPTY_SONG_FILES);
    setSongDraftReady(false);
    setUploading(EMPTY_UPLOAD_STATUS);
    setSongFormErrors(EMPTY_FORM_ERRORS);
    navigate(ADMIN_TAB_PATHS.songs);
  }

  function resetAlbumForm() {
    setEditingAlbumId(null);
    setAlbumForm(EMPTY_ALBUM_FORM);
    setAlbumFormOpen(false);
    setUploading((current) => ({ ...current, album: '' }));
    setAlbumFormErrors(EMPTY_FORM_ERRORS);
    navigate(ADMIN_TAB_PATHS.albums);
  }

  function openCreateAlbumForm() {
    setEditingAlbumId(null);
    setAlbumForm(EMPTY_ALBUM_FORM);
    setAlbumFormOpen(true);
    setUploading((current) => ({ ...current, album: '' }));
    setAlbumFormErrors(EMPTY_FORM_ERRORS);
    navigate('/admin/albums/create');
  }

  function resetArtistForm() {
    setEditingArtistId(null);
    setArtistForm(EMPTY_ARTIST_FORM);
    setArtistFormOpen(false);
    setUploading((current) => ({ ...current, artist: '' }));
    setArtistFormErrors(EMPTY_FORM_ERRORS);
    navigate(ADMIN_TAB_PATHS.artists);
  }

  function openCreateArtistForm() {
    setEditingArtistId(null);
    setArtistForm(EMPTY_ARTIST_FORM);
    setArtistFormOpen(true);
    setUploading((current) => ({ ...current, artist: '' }));
    setArtistFormErrors(EMPTY_FORM_ERRORS);
    navigate('/admin/artists/create');
  }

  function resetPlaylistForm() {
    setEditingPlaylistId(null);
    setPlaylistForm(EMPTY_PLAYLIST_FORM);
    setPlaylistFormOpen(false);
    setPlaylistDropdownOpen(false);
    setUploading((current) => ({ ...current, playlist: '' }));
    setPlaylistFormErrors(EMPTY_FORM_ERRORS);
    navigate(ADMIN_TAB_PATHS.playlists);
  }

  function openCreatePlaylistForm() {
    setEditingPlaylistId(null);
    setPlaylistForm(EMPTY_PLAYLIST_FORM);
    setPlaylistFormOpen(true);
    setPlaylistDropdownOpen(false);
    setUploading((current) => ({ ...current, playlist: '' }));
    setPlaylistFormErrors(EMPTY_FORM_ERRORS);
    navigate('/admin/playlists/create');
  }
  //Hàm upload file lên Cloudinary và trả về URL của file đã upload
  async function uploadFile(file, type) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_URL}/api/uploads/${type}`, formData, {
      headers: adminHeaders,
    });

    // return response.data.url || response.data.data?.secure_url;
    return {
      url: response.data.url || response.data.data?.secure_url,
      duration_seconds: response.data.duration_seconds || response.data.data?.duration_seconds,
    }
  }
  //Hàm xử lý khi người dùng chọn file mới cho bài hát (audio, image, lyrics)
  async function updateSongFile(field, file) {
    setSongFiles((current) => ({ ...current, [field]: file || null }));
    setSongForm((current) => ({ ...current, [field]: '' }));
    clearFieldError(setSongFormErrors, field);

    if (!file) {
      setUploading((current) => ({ ...current, [field]: '' }));
      return;
    }

    const typeMap = {
      audio: 'song',
      image: 'songImage',
      lyrics: 'lyrics',
    };

    setUploading((current) => ({ ...current, [field]: 'Đang upload...' }));
    setMessage('');

    try {
      const urlAndDuration = await uploadFile(file, typeMap[field]);
      if (!urlAndDuration.url) {
        throw new Error('Backend không trả về URL Cloudinary.');
      }
      setSongForm((current) => ({ ...current, [field]: urlAndDuration.url }));
      setUploading((current) => ({ ...current, [field]: 'Upload thành công.' }));
      if (field === 'audio' && urlAndDuration.duration_seconds) {
        setSongForm((current) => ({ ...current, duration_seconds: urlAndDuration.duration_seconds }));
      }
    } catch (error) {
      setSongFiles((current) => ({ ...current, [field]: null }));
      setUploading((current) => ({ ...current, [field]: '' }));
      setSongFormErrors((current) => ({
        ...current,
        [field]: error.response?.data?.message || error.message || 'Upload thất bại.',
      }));
    }
  }

  async function uploadAlbumImage(file) {
    if (!file) {
      setAlbumForm((current) => ({ ...current, image: '' }));
      setUploading((current) => ({ ...current, album: '' }));
      clearFieldError(setAlbumFormErrors, 'image');
      return;
    }

    setUploading((current) => ({ ...current, album: 'Đang upload...' }));
    clearFieldError(setAlbumFormErrors, 'image');
    setMessage('');

    try {
      const urlAndDuration = await uploadFile(file, 'album');
      setAlbumForm((current) => ({ ...current, image: urlAndDuration.url }));
      setUploading((current) => ({ ...current, album: 'Upload thành công.' }));
    } catch (error) {
      setUploading((current) => ({ ...current, album: '' }));
      setAlbumFormErrors((current) => ({ ...current, image: error.response?.data?.message || 'Upload ảnh album thất bại.' }));
    }
  }

  async function uploadArtistImage(file) {
    if (!file) {
      setArtistForm((current) => ({ ...current, image: '' }));
      setUploading((current) => ({ ...current, artist: '' }));
      clearFieldError(setArtistFormErrors, 'image');
      return;
    }

    setUploading((current) => ({ ...current, artist: 'Đang upload...' }));
    clearFieldError(setArtistFormErrors, 'image');
    setMessage('');

    try {
      const urlAndDuration = await uploadFile(file, 'artists');
      setArtistForm((current) => ({ ...current, image: urlAndDuration.url }));
      setUploading((current) => ({ ...current, artist: 'Upload thành công.' }));
    } catch (error) {
      setUploading((current) => ({ ...current, artist: '' }));
      setArtistFormErrors((current) => ({ ...current, image: error.response?.data?.message || 'Upload avatar nghệ sĩ thất bại.' }));
    }
  }

  async function uploadArtistBio(file) {
    if (!file) {
      setArtistForm((current) => ({ ...current, bio: '' }));
      setUploading((current) => ({ ...current, artist: '' }));
      clearFieldError(setArtistFormErrors, 'bio');
      return;
    }

    setUploading((current) => ({ ...current, artist: 'Đang upload...' }));
    clearFieldError(setArtistFormErrors, 'bio');
    setMessage('');

    try {
      const urlAndDuration = await uploadFile(file, 'bio');
      setArtistForm((current) => ({ ...current, bio: urlAndDuration.url }));
      setUploading((current) => ({ ...current, artist: 'Upload thành công.' }));
    } catch (error) {
      setUploading((current) => ({ ...current, artist: '' }));
      setArtistFormErrors((current) => ({ ...current, bio: error.response?.data?.message || 'Upload file giới thiệu nghệ sĩ thất bại.' }));
    }
  }

  async function uploadPlaylistImage(file) {
    if (!file) {
      setPlaylistForm((current) => ({ ...current, image: '' }));
      setUploading((current) => ({ ...current, playlist: '' }));
      clearFieldError(setPlaylistFormErrors, 'image');
      return;
    }

    setUploading((current) => ({ ...current, playlist: 'Đang upload...' }));
    clearFieldError(setPlaylistFormErrors, 'image');
    setMessage('');

    try {
      const urlAndDuration = await uploadFile(file, 'album');
      setPlaylistForm((current) => ({ ...current, image: urlAndDuration.url }));
      setUploading((current) => ({ ...current, playlist: 'Upload thành công.' }));
    } catch (error) {
      setUploading((current) => ({ ...current, playlist: '' }));
      setPlaylistFormErrors((current) => ({ ...current, image: error.response?.data?.message || 'Upload ảnh playlist thất bại.' }));
    }
  }

  async function submitSong(event) {
    event.preventDefault();
    const errors = {};

    if (!songForm.title.trim()) {
      errors.title = 'Vui lòng nhập tiêu đề bài hát.';
    }

    if (!songForm.audio) {
      errors.audio = 'Vui lòng chọn file audio MP3.';
    }

    if (!songForm.image) {
      errors.image = 'Vui lòng chọn ảnh bìa.';
    }

    if (Object.values(uploading).some((status) => status === 'Đang upload...')) {
      errors.form = 'Vui lòng chờ upload hoàn tất.';
    }

    if (Object.keys(errors).length > 0) {
      setSongFormErrors(errors);
      return;
    }

    setSongFormErrors(EMPTY_FORM_ERRORS);
    setSongSubmitting(true);
    try {
      if (editingSongId) {
        await axios.put(`${API_URL}/api/admin/songs/${editingSongId}`, { ...songForm, title: songForm.title.trim() }, { headers: adminHeaders });
        setNotice('Đã cập nhật bài hát.');
      } else {
        await axios.post(`${API_URL}/api/admin/songs`, { ...songForm, title: songForm.title.trim() }, { headers: adminHeaders });
        setNotice('Đã thêm bài hát.');
      }
      closeCreateSongForm();
      fetchAdminData();
    } catch (error) {
      setSongFormErrors({ form: error.response?.data?.message || 'Không thể lưu bài hát.' });
    } finally {
      setSongSubmitting(false);
    }
  }

  async function submitAlbum(event) {
    event.preventDefault();
    const errors = {};

    if (!albumForm.title.trim()) {
      errors.title = 'Vui lòng nhập tên album.';
    }

    if (!albumForm.artist_id) {
      errors.artist_id = 'Vui lòng chọn nghệ sĩ cho album.';
    }

    if (!albumForm.image) {
      errors.image = 'Vui lòng chọn ảnh bìa album.';
    }

    if (uploading.album === 'Đang upload...') {
      errors.image = 'Vui lòng chờ upload ảnh album hoàn tất.';
    }

    if (Object.keys(errors).length > 0) {
      setAlbumFormErrors(errors);
      return;
    }

    setAlbumFormErrors(EMPTY_FORM_ERRORS);
    const albumPayload = {
      ...albumForm,
      title: albumForm.title.trim(),
    };

    try {
      if (editingAlbumId) {
        await axios.put(`${API_URL}/api/admin/albums/${editingAlbumId}`, albumPayload, { headers: adminHeaders });
        setNotice('Đã cập nhật album.');
      } else {
        await axios.post(`${API_URL}/api/admin/albums`, albumPayload, { headers: adminHeaders });
        setNotice('Đã thêm album.');
      }

      resetAlbumForm();
      fetchAdminData();
    } catch (error) {
      setAlbumFormErrors({ form: error.response?.data?.message || 'Không thể lưu album.' });
    }
  }

  async function submitArtist(event) {
    event.preventDefault();
    const errors = {};

    if (!artistForm.name.trim()) {
      errors.name = 'Vui lòng nhập tên nghệ sĩ.';
    }

    if (uploading.artist === 'Đang upload...') {
      errors.image = 'Vui lòng chờ upload ảnh nghệ sĩ hoàn tất.';
    }

    if (Object.keys(errors).length > 0) {
      setArtistFormErrors(errors);
      return;
    }

    setArtistFormErrors(EMPTY_FORM_ERRORS);
    const artistPayload = {
      ...artistForm,
      name: artistForm.name.trim(),
    };

    try {
      if (editingArtistId) {
        await axios.put(`${API_URL}/api/admin/artists/${editingArtistId}`, artistPayload, { headers: adminHeaders });
        setNotice('Đã cập nhật nghệ sĩ.');
      } else {
        await axios.post(`${API_URL}/api/admin/artists`, artistPayload, { headers: adminHeaders });
        setNotice('Đã thêm nghệ sĩ.');
      }

      resetArtistForm();
      fetchAdminData();
    } catch (error) {
      setArtistFormErrors({ form: error.response?.data?.message || 'Không thể lưu nghệ sĩ.' });
    }
  }

  async function submitPlaylist(event) {
    event.preventDefault();
    const errors = {};

    if (!playlistForm.name.trim()) {
      errors.name = 'Vui lòng nhập tên playlist.';
    }

    if (uploading.playlist === 'Đang upload...') {
      errors.image = 'Vui lòng chờ upload ảnh playlist hoàn tất.';
    }

    if (Object.keys(errors).length > 0) {
      setPlaylistFormErrors(errors);
      return;
    }

    setPlaylistFormErrors(EMPTY_FORM_ERRORS);
    const playlistPayload = {
      name: playlistForm.name.trim(),
      image: playlistForm.image,
      songIds: Array.isArray(playlistForm.songIds) ? playlistForm.songIds : [],
      ispublic: true,
      isSystem: true,
      isdefault: false,
    };

    try {
      if (editingPlaylistId) {
        await axios.put(`${API_URL}/api/admin/playlists/${editingPlaylistId}`, playlistPayload, { headers: adminHeaders });
        setNotice('Đã cập nhật playlist hệ thống.');
      } else {
        await axios.post(`${API_URL}/api/admin/playlists`, playlistPayload, { headers: adminHeaders });
        setNotice('Đã thêm playlist hệ thống.');
      }

      resetPlaylistForm();
      fetchAdminData();
    } catch (error) {
      setPlaylistFormErrors({ form: error.response?.data?.message || 'Không thể lưu playlist hệ thống.' });
    }
  }

  async function removeItem(type, id) {
    if (!window.confirm('Bạn chắc chắn muốn xóa mục này?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/admin/${type}/${id}`, { headers: adminHeaders });
      setNotice('Đã xóa thành công.');
      fetchAdminData();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Không thể xóa dữ liệu.');
    }
  }

  async function updateRole(userId, role) {
    try {
      await axios.patch(`${API_URL}/api/admin/users/${userId}/role`, { role }, { headers: adminHeaders });
      setNotice('Đã cập nhật quyền user.');
      fetchAdminData();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Không thể cập nhật quyền user.');
    }
  }

  function editAlbum(album) {
    setEditingAlbumId(album.id);
    setAlbumFormOpen(true);
    setAlbumForm({
      title: album.title || album.name || '',
      image: album.image || '',
      release_date: toDateInput(album.release_date),
      artist_id: album.artist_id || '',
    });
    navigate(`/admin/albums/edit/${album.id}`);
  }

  function editArtist(artist) {
    setEditingArtistId(artist.id);
    setArtistFormOpen(true);
    setArtistForm({
      name: artist.name || '',
      image: artist.image || artist.avatar || '',
      bio: artist.bio || '',
      follower_count: artist.follower_count || artist.followers_count || '',
    });
    navigate(`/admin/artists/edit/${artist.id}`);
  }

  function editSong(song) {
    setSongMode('create');
    setEditingSongId(song.id);
    setSongForm(getSongFormFromSong(song));
    setSongFiles(EMPTY_SONG_FILES);
    setSongDraftReady(false);
    setUploading(EMPTY_UPLOAD_STATUS);
    navigate(`/admin/songs/edit/${song.id}`);
  }

  function editPlaylist(playlist) {
    setEditingPlaylistId(playlist.id);
    setPlaylistFormOpen(true);
    setPlaylistDropdownOpen(false);
    setPlaylistForm({
      name: playlist.name || playlist.playlist_name || '',
      image: playlist.image || playlist.playlist_image || '',
      songIds: Array.isArray(playlist.song_ids)
        ? playlist.song_ids.map(Number).filter(Boolean)
        : (playlist.songs || []).map((song) => Number(song.id)).filter(Boolean),
    });
    setUploading((current) => ({ ...current, playlist: '' }));
    navigate(`/admin/playlists/edit/${playlist.id}`);
  }

  function updatePlaylistSongIds(nextSongIds) {
    setPlaylistForm((current) => ({ ...current, songIds: nextSongIds }));
  }

  function togglePlaylistSong(songId) {
    const normalizedSongId = Number(songId);
    const currentIds = (playlistForm.songIds || []).map(Number);

    if (currentIds.includes(normalizedSongId)) {
      updatePlaylistSongIds(currentIds.filter((id) => id !== normalizedSongId));
      return;
    }

    updatePlaylistSongIds([...currentIds, normalizedSongId]);
  }

  const selectedPlaylistSongIds = (playlistForm.songIds || []).map(Number);
  const selectedPlaylistSongs = songs.filter((song) => selectedPlaylistSongIds.includes(Number(song.id)));

  return (
    <div className="admin-dashboard-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <a href="/">
            <img src="./../../assets/img/logos/main-logo.png" alt="Logo" />
          </a>

        </div>

        <nav className="admin-nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? 'is-active' : ''}
              type="button"
              onClick={() => {
                navigate(ADMIN_TAB_PATHS[tab.id]);
                setSongMode('list');
                setAlbumFormOpen(false);
                setArtistFormOpen(false);
                setPlaylistFormOpen(false);
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="admin-main">
        {songMode === 'list' && !albumFormOpen && !artistFormOpen && !playlistFormOpen ? (
          <>
            <header className="admin-header">
              <div>
                <h2>{currentUser?.role === 'super_admin' ? 'Super Admin panel' : 'Admin Panel'}</h2>
                <p>Chào mừng trở lại, {currentUser?.username}!</p>
              </div>
              {loading ? <span className="admin-status">Đang tải...</span> : null}
            </header>

            <section className="admin-stats">
              <div><span>Bài hát</span><strong>{overview.songs}</strong></div>
              <div><span>Album</span><strong>{overview.albums}</strong></div>
              <div><span>Nghệ sĩ</span><strong>{overview.artists}</strong></div>
              <div><span>Playlist hệ thống</span><strong>{overview.playlists || 0}</strong></div>
              {isSuperAdmin ? <div><span>User</span><strong>{overview.users}</strong></div> : null}
            </section>
          </>
        ) : null}

        {message && songMode === 'list' && !albumFormOpen && !artistFormOpen && !playlistFormOpen ? <p className="admin-message">{message}</p> : null}

        {activeTab === 'songs' && songMode === 'create' ? (
          <InsertSong
            albums={albums}
            artists={artists}
            songFiles={songFiles}
            songForm={songForm}
            errors={songFormErrors}
            songSubmitting={songSubmitting}
            editingSongId={editingSongId}
            uploading={uploading}
            onClose={closeCreateSongForm}
            onFileChange={updateSongFile}
            onFormChange={updateSongForm}
            onSubmit={submitSong}
          />
        ) : null}

        {activeTab === 'songs' && songMode === 'list' ? (
          <SongManagementPage
            active={activeTab === 'songs'}
            albums={albums}
            artists={artists}
            editingSongId={editingSongId}
            errors={songFormErrors}
            formatDuration={formatDuration}
            onCloseForm={closeCreateSongForm}
            onDeleteSong={removeItem}
            onEditSong={editSong}
            onFileChange={updateSongFile}
            onFormChange={updateSongForm}
            onOpenCreateForm={openCreateSongForm}
            onSubmitSong={submitSong}
            songFiles={songFiles}
            songForm={songForm}
            songMode={songMode}
            songSubmitting={songSubmitting}
            songs={songs}
            uploading={uploading}
          />
        ) : null}

        {activeTab === 'albums' && albumFormOpen ?
          <UpdateAlbum
            albumForm={albumForm}
            errors={albumFormErrors}
            artists={artists}
            editingAlbumId={editingAlbumId}
            uploading={uploading}
            onClose={resetAlbumForm}
            onFormChange={updateAlbumForm}
            onImageChange={uploadAlbumImage}
            onSubmit={submitAlbum}
          /> : null}

        {
          activeTab === 'albums' && !albumFormOpen ?
            <AlbumManagementPage
              active={activeTab === 'albums'}
              albumForm={albumForm}
              albumFormOpen={albumFormOpen}
              albums={albums}
              artists={artists}
              editingAlbumId={editingAlbumId}
              errors={albumFormErrors}
              onCloseForm={resetAlbumForm}
              onDeleteAlbum={removeItem}
              onEditAlbum={editAlbum}
              onFormChange={updateAlbumForm}
              onImageChange={uploadAlbumImage}
              onOpenCreateForm={openCreateAlbumForm}
              onSubmitAlbum={submitAlbum}
              toDateInput={toDateInput}
              uploading={uploading}
            /> : null
        }

        {activeTab === 'artists' && artistFormOpen ?
          <UpdateArtist
            artistForm={artistForm}
            errors={artistFormErrors}
            editingArtistId={editingArtistId}
            uploading={uploading}
            onClose={resetArtistForm}
            onFormChange={updateArtistForm}
            onBioChange={uploadArtistBio}
            onImageChange={uploadArtistImage}
            onSubmit={submitArtist}
          /> : null}

        {activeTab === 'artists' && !artistFormOpen ?
          <ArtistManagementPage
            active={activeTab === 'artists'}
            artistForm={artistForm}
            artistFormOpen={artistFormOpen}
            artists={artists}
            editingArtistId={editingArtistId}
            errors={artistFormErrors}
            onCloseForm={resetArtistForm}
            onDeleteArtist={removeItem}
            onEditArtist={editArtist}
            onFormChange={updateArtistForm}
            onBioChange={uploadArtistBio}
            onImageChange={uploadArtistImage}
            onOpenCreateForm={openCreateArtistForm}
            onSubmitArtist={submitArtist}
            uploading={uploading}
          />
          : null}

        {activeTab === 'playlists' && playlistFormOpen ? (
          <section className="admin-song-editor admin-playlist-manager">
            <div className="admin-song-editor__topline">
              <button className="admin-breadcrumb" type="button" onClick={resetPlaylistForm}>Quản lý playlist</button>
              <span>&gt;</span>
              <strong>{editingPlaylistId ? 'Sửa playlist hệ thống' : 'Thêm playlist hệ thống'}</strong>
            </div>

            <div className="admin-song-editor__header">
              <div className="admin-song-editor__title">
                <button type="button" className="admin-back-btn" onClick={resetPlaylistForm}>←</button>
                <div>
                  <h2>{editingPlaylistId ? 'Sửa playlist hệ thống' : 'Thêm playlist hệ thống'}</h2>
                  <p>{editingPlaylistId ? 'Cập nhật tên, ảnh bìa và danh sách bài hát' : 'Tạo playlist hệ thống mới cho trang khám phá'}</p>
                </div>
              </div>
            </div>

            <div className="admin-song-editor__grid">
              <form className="admin-song-card" onSubmit={submitPlaylist}>
                <label>Tên playlist <span>*</span></label>
                <input maxLength={255} placeholder="Nhập tên playlist" value={playlistForm.name} onChange={(e) => updatePlaylistForm({ ...playlistForm, name: e.target.value }, 'name')} />
                {playlistFormErrors.name ? <p className="admin-field-error">{playlistFormErrors.name}</p> : null}

                <label>Ảnh bìa playlist</label>
                <input id="admin-playlist-image-upload" hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => uploadPlaylistImage(e.target.files?.[0])} />
                <div className="admin-cover-upload">
                  {playlistForm.image ? <div className="admin-cover-preview">
                    <img src={playlistForm.image} alt="Preview ảnh playlist" />
                    <button type="button" onClick={() => uploadPlaylistImage(null)}>
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div> : null}
                  <label className="admin-cover-drop" htmlFor="admin-playlist-image-upload">
                    <strong>Upload ảnh playlist</strong>
                  </label>
                </div>
                {playlistForm.image ? (
                  <p className="admin-cloudinary-link">
                    <span>Đường dẫn Cloudinary ảnh playlist</span>
                    <a href={playlistForm.image} target="_blank" rel="noreferrer" title={playlistForm.image}>{playlistForm.image}</a>
                  </p>
                ) : null}
                {uploading.playlist ? <p className="admin-song-hint">{uploading.playlist}</p> : null}
                {playlistFormErrors.image ? <p className="admin-field-error">{playlistFormErrors.image}</p> : null}
                <p className="admin-song-hint">Định dạng: JPG, PNG, WEBP</p>

                <div className="admin-song-editor__actions">
                  <button type="button" className="admin-cancel-btn" onClick={resetPlaylistForm}>Hủy</button>
                  <button type="submit" className="admin-save-btn" disabled={uploading.playlist === 'Đang upload...'}>Lưu playlist</button>
                </div>
                {playlistFormErrors.form ? <p className="admin-field-error">{playlistFormErrors.form}</p> : null}
              </form>

              <section className="admin-song-card">
                <label>Chọn bài hát</label>
                <div className={`admin-multi-select${playlistDropdownOpen ? ' is-open' : ''}`}>
                  <div className="admin-multi-select__control">
                    <div className="admin-multi-select__values">
                      {selectedPlaylistSongs.length ? selectedPlaylistSongs.map((song) => (
                        <span className="admin-multi-select__tag" key={song.id}>
                          {song.title}
                          <button type="button" onClick={() => togglePlaylistSong(song.id)}><i className="fa-solid fa-x"></i></button>
                        </span>
                      )) : <span className="admin-multi-select__placeholder">Chọn bài hát cho playlist</span>}
                    </div>
                    <button
                      className="admin-multi-select__clear"
                      disabled={!selectedPlaylistSongs.length}
                      type="button"
                      onClick={() => updatePlaylistSongIds([])}
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                    <span className="admin-multi-select__divider"></span>
                    <button
                      className="admin-multi-select__arrow"
                      type="button"
                      onClick={() => setPlaylistDropdownOpen((current) => !current)}
                    >
                      <i className="bi bi-caret-down-fill"></i>
                    </button>
                  </div>
                  {playlistDropdownOpen ? (
                    <div className="admin-multi-select__menu">
                      {songs.map((song) => (
                        <label className="admin-multi-select__option" key={song.id}>
                          <input
                            checked={selectedPlaylistSongIds.includes(Number(song.id))}
                            type="checkbox"
                            onChange={() => togglePlaylistSong(song.id)}
                          />
                          <span>{song.title}</span>
                        </label>
                      ))}
                    </div>
                  ) : null}
                </div>
                <p className="admin-song-hint">Có thể chọn một hoặc nhiều bài hát. Các cờ hệ thống được gửi tự động.</p>
              </section>
            </div>
          </section>
        ) : null}

        {activeTab === 'playlists' && !playlistFormOpen ? (
          <PlaylistManagementPage
            active={activeTab === 'playlists'}
            editingPlaylistId={editingPlaylistId}
            errors={playlistFormErrors}
            onClearSongs={() => updatePlaylistSongIds([])}
            onCloseForm={resetPlaylistForm}
            onDeletePlaylist={removeItem}
            onEditPlaylist={editPlaylist}
            onFormChange={updatePlaylistForm}
            onImageChange={uploadPlaylistImage}
            onOpenCreateForm={openCreatePlaylistForm}
            onSubmitPlaylist={submitPlaylist}
            playlistDropdownOpen={playlistDropdownOpen}
            playlistForm={playlistForm}
            playlistFormOpen={playlistFormOpen}
            selectedPlaylistSongIds={selectedPlaylistSongIds}
            selectedPlaylistSongs={selectedPlaylistSongs}
            setPlaylistDropdownOpen={setPlaylistDropdownOpen}
            songs={songs}
            systemPlaylists={systemPlaylists}
            togglePlaylistSong={togglePlaylistSong}
            uploading={uploading}
          />
        ) : null}

        {activeTab === 'users' && isSuperAdmin ? (
          <section className="admin-panel">
            <div className="admin-panel__header">
              <div>
                <h3>Quản lý user</h3>
                <p>Nâng hoặc hạ quyền tài khoản</p>
              </div>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.username}</td>
                      <td>{user.email || '--'}</td>
                      <td><span className="admin-role">{user.role}</span></td>
                      <td>
                        {user.role === 'user' && (
                          <button type="button" onClick={() => updateRole(user.id, 'admin')}>
                            Nâng admin
                          </button>
                        )}
                        {(user.role === 'user' || user.role === 'admin') && (
                          <button type="button" onClick={() => updateRole(user.id, 'super_admin')}>
                            Nâng super admin
                          </button>
                        )}
                        {user.role === 'admin' && (
                          <button type="button" onClick={() => updateRole(user.id, 'user')}>
                            Hạ user
                          </button>
                        )}
                        {user.role === 'super_admin' && (
                          <span>Không đổi</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section >
        ) : null}
      </main >
    </div >
  );
}
