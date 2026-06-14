import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { API_URL } from '../../api.js';
import { useAuthContext } from '../../context/AuthContext';
import { showNotificationToast } from '../../toast.js';
import { InsertSong } from './InsertSong.jsx';
import { UpdateAlbum } from './UpdateAlbum.jsx';
import { UpdateArtist } from './UpdateArtist.jsx';

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
    navigate(ADMIN_TAB_PATHS.songs);
  }

  function resetAlbumForm() {
    setEditingAlbumId(null);
    setAlbumForm(EMPTY_ALBUM_FORM);
    setAlbumFormOpen(false);
    setUploading((current) => ({ ...current, album: '' }));
    navigate(ADMIN_TAB_PATHS.albums);
  }

  function openCreateAlbumForm() {
    setEditingAlbumId(null);
    setAlbumForm(EMPTY_ALBUM_FORM);
    setAlbumFormOpen(true);
    setUploading((current) => ({ ...current, album: '' }));
    navigate('/admin/albums/create');
  }

  function resetArtistForm() {
    setEditingArtistId(null);
    setArtistForm(EMPTY_ARTIST_FORM);
    setArtistFormOpen(false);
    setUploading((current) => ({ ...current, artist: '' }));
    navigate(ADMIN_TAB_PATHS.artists);
  }

  function openCreateArtistForm() {
    setEditingArtistId(null);
    setArtistForm(EMPTY_ARTIST_FORM);
    setArtistFormOpen(true);
    setUploading((current) => ({ ...current, artist: '' }));
    navigate('/admin/artists/create');
  }

  function resetPlaylistForm() {
    setEditingPlaylistId(null);
    setPlaylistForm(EMPTY_PLAYLIST_FORM);
    setPlaylistFormOpen(false);
    setPlaylistDropdownOpen(false);
    setUploading((current) => ({ ...current, playlist: '' }));
    navigate(ADMIN_TAB_PATHS.playlists);
  }

  function openCreatePlaylistForm() {
    setEditingPlaylistId(null);
    setPlaylistForm(EMPTY_PLAYLIST_FORM);
    setPlaylistFormOpen(true);
    setPlaylistDropdownOpen(false);
    setUploading((current) => ({ ...current, playlist: '' }));
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
      if(field === 'audio' && urlAndDuration.duration_seconds) {
        setSongForm((current) => ({ ...current, duration_seconds: urlAndDuration.duration_seconds }));
      }
    } catch (error) {
      setSongFiles((current) => ({ ...current, [field]: null }));
      setUploading((current) => ({ ...current, [field]: '' }));
      setMessage(error.response?.data?.message || error.message || 'Upload thất bại.');
    }
  }

  async function uploadAlbumImage(file) {
    if (!file) {
      setAlbumForm((current) => ({ ...current, image: '' }));
      setUploading((current) => ({ ...current, album: '' }));
      return;
    }

    setUploading((current) => ({ ...current, album: 'Đang upload...' }));
    setMessage('');

    try {
      const urlAndDuration = await uploadFile(file, 'album');
      setAlbumForm((current) => ({ ...current, image: urlAndDuration.url }));
      setUploading((current) => ({ ...current, album: 'Upload thành công.' }));
    } catch (error) {
      setUploading((current) => ({ ...current, album: '' }));
      setMessage(error.response?.data?.message || 'Upload ảnh album thất bại.');
    }
  }

  async function uploadArtistImage(file) {
    if (!file) {
      setArtistForm((current) => ({ ...current, image: '' }));
      setUploading((current) => ({ ...current, artist: '' }));
      return;
    }

    setUploading((current) => ({ ...current, artist: 'Đang upload...' }));
    setMessage('');

    try {
      const urlAndDuration = await uploadFile(file, 'artists');
      setArtistForm((current) => ({ ...current, image: urlAndDuration.url }));
      setUploading((current) => ({ ...current, artist: 'Upload thành công.' }));
    } catch (error) {
      setUploading((current) => ({ ...current, artist: '' }));
      setMessage(error.response?.data?.message || 'Upload avatar nghệ sĩ thất bại.');
    }
  }

  async function uploadArtistBio(file) {
    if (!file) {
      setArtistForm((current) => ({ ...current, bio: '' }));
      setUploading((current) => ({ ...current, artist: '' }));
      return;
    }

    setUploading((current) => ({ ...current, artist: 'Đang upload...' }));
    setMessage('');

    try {
      const urlAndDuration = await uploadFile(file, 'bio');
      setArtistForm((current) => ({ ...current, bio: urlAndDuration.url }));
      setUploading((current) => ({ ...current, artist: 'Upload thành công.' }));
    } catch (error) {
      setUploading((current) => ({ ...current, artist: '' }));
      setMessage(error.response?.data?.message || 'Upload file giới thiệu nghệ sĩ thất bại.');
    }
  }

  async function uploadPlaylistImage(file) {
    if (!file) {
      setPlaylistForm((current) => ({ ...current, image: '' }));
      setUploading((current) => ({ ...current, playlist: '' }));
      return;
    }

    setUploading((current) => ({ ...current, playlist: 'Đang upload...' }));
    setMessage('');

    try {
      const urlAndDuration = await uploadFile(file, 'album');
      setPlaylistForm((current) => ({ ...current, image: urlAndDuration.url }));
      setUploading((current) => ({ ...current, playlist: 'Upload thành công.' }));
    } catch (error) {
      setUploading((current) => ({ ...current, playlist: '' }));
      setMessage(error.response?.data?.message || 'Upload ảnh playlist thất bại.');
    }
  }

  async function submitSong(event) {
    event.preventDefault();

    if (!songForm.title.trim()) {
      setMessage('Vui lòng nhập tiêu đề bài hát.');
      return;
    }

    if (!songForm.audio) {
      setMessage('Vui lòng chọn file audio MP3.');
      return;
    }

    if (!songForm.image) {
      setMessage('Vui lòng chọn ảnh bìa.');
      return;
    }

    if (Object.values(uploading).some((status) => status === 'Đang upload...')) {
      setMessage('Vui lòng chờ upload hoàn tất.');
      return;
    }

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
      setMessage(error.response?.data?.message || 'Không thể lưu bài hát.');
    } finally {
      setSongSubmitting(false);
    }
  }

  async function submitAlbum(event) {
    event.preventDefault();

    if (!albumForm.title.trim()) {
      setMessage('Vui lòng nhập tên album.');
      return;
    }

    if (!albumForm.artist_id) {
      setMessage('Vui lòng chọn nghệ sĩ cho album.');
      return;
    }

    if (uploading.album === 'Đang upload...') {
      setMessage('Vui lòng chờ upload ảnh album hoàn tất.');
      return;
    }

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
      setMessage(error.response?.data?.message || 'Không thể lưu album.');
    }
  }

  async function submitArtist(event) {
    event.preventDefault();

    if (!artistForm.name.trim()) {
      setMessage('Vui lòng nhập tên nghệ sĩ.');
      return;
    }

    if (uploading.artist === 'Đang upload...') {
      setMessage('Vui lòng chờ upload ảnh nghệ sĩ hoàn tất.');
      return;
    }

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
      setMessage(error.response?.data?.message || 'Không thể lưu nghệ sĩ.');
    }
  }

  async function submitPlaylist(event) {
    event.preventDefault();

    if (!playlistForm.name.trim()) {
      setMessage('Vui lòng nhập tên playlist.');
      return;
    }

    if (uploading.playlist === 'Đang upload...') {
      setMessage('Vui lòng chờ upload ảnh playlist hoàn tất.');
      return;
    }

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
      setMessage(error.response?.data?.message || 'Không thể lưu playlist hệ thống.');
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

        {message ? <p className="admin-message">{message}</p> : null}

        {activeTab === 'songs' && songMode === 'create' ? (
          <InsertSong
            albums={albums}
            artists={artists}
            songFiles={songFiles}
            songForm={songForm}
            songSubmitting={songSubmitting}
            editingSongId={editingSongId}
            uploading={uploading}
            onClose={closeCreateSongForm}
            onFileChange={updateSongFile}
            onFormChange={setSongForm}
            onSubmit={submitSong}
          />
        ) : null}

        {activeTab === 'songs' && songMode === 'list' ? (
          <section className="admin-panel">
            <div className="admin-panel__header">
              <div>
                <h3>
                  Quản lý bài hát
                </h3>
              </div>
            </div>
            <div>
              <form className="admin-form">
                <input placeholder="Tìm kiếm bài hát" value={songForm.title} onChange={(e) => setSongForm({ ...songForm, title: e.target.value })} />
              </form>
              <button type="button" className="admin-save-btn" onClick={openCreateSongForm}>
                Thêm bài hát
              </button>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Ảnh</th>
                    <th>Tên bài hát</th>
                    <th>Nghệ sĩ</th>
                    <th>Album</th>
                    <th>Thời lượng</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {songs.map((song, index) => (
                    <tr key={song.id}>
                      <td>{index + 1}</td>
                      <td>{song.image ? <img src={song.image} alt="" /> : null}</td>
                      <td>{song.title}</td>
                      <td>{song.artists?.map((artist) => artist.name).join(', ') || '--'}</td>
                      <td>{song.album_title || '--'}</td>
                      <td>{formatDuration(song.duration_seconds)}</td>
                      <td>
                        <button type="button" onClick={() => editSong(song)}>
                          Sửa
                        </button>
                        <button type="button" className="is-danger" onClick={() => removeItem('songs', song.id)}>
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {activeTab === 'albums' && albumFormOpen ?
          <UpdateAlbum
            albumForm={albumForm}
            artists={artists}
            editingAlbumId={editingAlbumId}
            uploading={uploading}
            onClose={resetAlbumForm}
            onFormChange={setAlbumForm}
            onImageChange={uploadAlbumImage}
            onSubmit={submitAlbum}
          /> : null}

        {activeTab === 'albums' && !albumFormOpen ?
          <section className="admin-panel">
            <div className="admin-panel__header">
              <div>
                <h3>Quản lý album</h3>
              </div>
              <button type="button" className="admin-save-btn" onClick={openCreateAlbumForm}>Thêm album</button>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Ảnh</th>
                    <th>Tên album</th>
                    <th>Nghệ sĩ</th>
                    <th>Ngày phát hành</th>
                    <th>Số bài hát</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {albums.map((album, index) => (
                    <tr key={album.id}>
                      <td>{index + 1}</td>
                      <td>{album.image ? <img src={album.image} alt="" /> : null}</td>
                      <td>{album.title || album.name}</td>
                      <td>{album.artist_name || '--'}</td>
                      <td>{toDateInput(album.release_date) || '--'}</td>
                      <td>{album.song_count || 0}</td>
                      <td>
                        <button type="button" onClick={() => editAlbum(album)}>
                          Sửa
                        </button>
                        <button type="button" className="is-danger" onClick={() => removeItem('albums', album.id)}>
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section> : null}

        {activeTab === 'artists' && artistFormOpen ?
          <UpdateArtist
            artistForm={artistForm}
            editingArtistId={editingArtistId}
            uploading={uploading}
            onClose={resetArtistForm}
            onFormChange={setArtistForm}
            onBioChange={uploadArtistBio}
            onImageChange={uploadArtistImage}
            onSubmit={submitArtist}
          /> : null}

        {activeTab === 'artists' && !artistFormOpen ?
          <section className="admin-panel">
            <div className="admin-panel__header">
              <div>
                <h3>Quản lý nghệ sĩ</h3>
              </div>
              <button type="button" className="admin-save-btn" onClick={openCreateArtistForm}>Thêm nghệ sĩ</button>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Ảnh</th>
                    <th>Tên nghệ sĩ</th>
                    <th>Bài hát</th>
                    <th>Follower</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {artists.map((artist, index) => (
                    <tr key={artist.id}>
                      <td>{index + 1}</td>
                      <td>{artist.image ? <img src={artist.image} alt="" /> : null}</td>
                      <td>{artist.name}</td>
                      <td>{artist.song_count || 0}</td>
                      <td>{artist.follower_count || artist.followers_count || 0}</td>
                      <td>
                        <button type="button" onClick={() => editArtist(artist)}>
                          Sửa
                        </button>
                        <button type="button" className="is-danger" onClick={() => removeItem('artists', artist.id)}>
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section> : null}

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
                <input maxLength={255} placeholder="Nhập tên playlist" value={playlistForm.name} onChange={(e) => setPlaylistForm({ ...playlistForm, name: e.target.value })} />

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
                <p className="admin-song-hint">Định dạng: JPG, PNG, WEBP</p>

                <div className="admin-song-editor__actions">
                  <button type="button" className="admin-cancel-btn" onClick={resetPlaylistForm}>Hủy</button>
                  <button type="submit" className="admin-save-btn" disabled={uploading.playlist === 'Đang upload...'}>Lưu playlist</button>
                </div>
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
          <section className="admin-panel">
            <div className="admin-panel__header">
              <div>
                <h3>Quản lý playlist hệ thống</h3>
              </div>
              <button type="button" className="admin-save-btn" onClick={openCreatePlaylistForm}>Thêm playlist</button>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Ảnh</th>
                    <th>Tên playlist</th>
                    <th>Số bài hát</th>
                    <th>Người tạo</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {systemPlaylists.map((playlist, index) => (
                    <tr key={playlist.id}>
                      <td>{index + 1}</td>
                      <td>{playlist.image || playlist.playlist_image ? <img src={playlist.image || playlist.playlist_image} alt="" /> : null}</td>
                      <td>{playlist.name || playlist.playlist_name}</td>
                      <td>{playlist.song_count || playlist.songs?.length || 0}</td>
                      <td>{playlist.username || '--'}</td>
                      <td>
                        <button type="button" onClick={() => editPlaylist(playlist)}>
                          Sửa
                        </button>
                        <button type="button" className="is-danger" onClick={() => removeItem('playlists', playlist.id)}>
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
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
