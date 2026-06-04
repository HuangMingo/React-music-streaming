import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { API_URL } from '../../api.js';
import { useAuthContext } from '../../context/AuthContext';
import { showNotificationToast } from '../../toast.js';
import { InsertSong } from './InsertSong.jsx';

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
  const [overview, setOverview] = useState({ songs: 0, albums: 0, artists: 0, users: 0 });
  const [songs, setSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [artists, setArtists] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [songSubmitting, setSongSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [editingSongId, setEditingSongId] = useState(null);
  const [editingAlbumId, setEditingAlbumId] = useState(null);
  const [editingArtistId, setEditingArtistId] = useState(null);
  const [songForm, setSongForm] = useState(EMPTY_SONG_FORM);
  const [songFiles, setSongFiles] = useState(EMPTY_SONG_FILES);
  const [songDraftReady, setSongDraftReady] = useState(false);
  const [uploading, setUploading] = useState(EMPTY_UPLOAD_STATUS);
  const [albumForm, setAlbumForm] = useState(EMPTY_ALBUM_FORM);
  const [artistForm, setArtistForm] = useState(EMPTY_ARTIST_FORM);

  const adminHeaders = useMemo(
    () => ({ 'x-user-id': currentUser?.id }),
    [currentUser?.id]
  );

  const tabs = useMemo(
    () => [
      { id: 'songs', label: 'Quản lý bài hát' },
      { id: 'albums', label: 'Quản lý album' },
      { id: 'artists', label: 'Quản lý nghệ sĩ' },
      ...(isSuperAdmin ? [{ id: 'users', label: 'Quản lý user' }] : []),
    ],
    [isSuperAdmin]
  );

  useEffect(() => {
    const nextTab = ['songs', 'albums', 'artists', 'users'].includes(tab) ? tab : 'songs';

    if (nextTab === 'users' && !isSuperAdmin) {
      navigate('/admin/songs', { replace: true });
      return;
    }

    if (mode && !(nextTab === 'songs' && ['create', 'edit'].includes(mode))) {
      navigate(ADMIN_TAB_PATHS[nextTab] || '/admin/songs', { replace: true });
      return;
    }

    if (mode === 'edit' && !songId) {
      navigate(ADMIN_TAB_PATHS.songs, { replace: true });
      return;
    }

    setActiveTab(nextTab);
    setSongMode(nextTab === 'songs' && ['create', 'edit'].includes(mode) ? 'create' : 'list');
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
      ];

      if (isSuperAdmin) {
        requests.push(axios.get(`${API_URL}/api/admin/users`, { headers: adminHeaders }));
      }

      const [overviewRes, songsRes, albumsRes, artistsRes, usersRes] = await Promise.all(requests);
      setOverview(overviewRes.data.data || { songs: 0, albums: 0, artists: 0, users: 0 });
      setSongs(songsRes.data.data || []);
      setAlbums(albumsRes.data.data || []);
      setArtists(artistsRes.data.data || []);
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
    setUploading((current) => ({ ...current, album: '' }));
  }

  function resetArtistForm() {
    setEditingArtistId(null);
    setArtistForm(EMPTY_ARTIST_FORM);
    setUploading((current) => ({ ...current, artist: '' }));
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

    try {
      if (editingAlbumId) {
        await axios.put(`${API_URL}/api/admin/albums/${editingAlbumId}`, albumForm, { headers: adminHeaders });
        setNotice('Đã cập nhật album.');
      } else {
        await axios.post(`${API_URL}/api/admin/albums`, albumForm, { headers: adminHeaders });
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

    try {
      if (editingArtistId) {
        await axios.put(`${API_URL}/api/admin/artists/${editingArtistId}`, artistForm, { headers: adminHeaders });
        setNotice('Đã cập nhật nghệ sĩ.');
      } else {
        await axios.post(`${API_URL}/api/admin/artists`, artistForm, { headers: adminHeaders });
        setNotice('Đã thêm nghệ sĩ.');
      }

      resetArtistForm();
      fetchAdminData();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Không thể lưu nghệ sĩ.');
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
    setAlbumForm({
      title: album.title || album.name || '',
      image: album.image || '',
      release_date: toDateInput(album.release_date),
      artist_id: album.artist_id || '',
    });
    navigate(ADMIN_TAB_PATHS.albums);
  }

  function editArtist(artist) {
    setEditingArtistId(artist.id);
    setArtistForm({
      name: artist.name || '',
      image: artist.image || artist.avatar || '',
      bio: artist.bio || '',
      follower_count: artist.follower_count || artist.followers_count || '',
    });
    navigate(ADMIN_TAB_PATHS.artists);
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
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="admin-main">
        {songMode === 'list' ? (
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

        {activeTab === 'albums' ?
          <section className="admin-panel">
            <div className="admin-panel__header">
              <div>
                <h3>Quản lý album</h3>
              </div>
            </div>
            <form className="admin-form" onSubmit={submitAlbum}>
              <input placeholder="Tên album" value={albumForm.title} onChange={(e) => setAlbumForm({ ...albumForm, title: e.target.value })} />
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => uploadAlbumImage(e.target.files?.[0])} />
              <input placeholder="Ảnh" value={albumForm.image} onChange={(e) => setAlbumForm({ ...albumForm, image: e.target.value })} />
              {uploading.album ? <p className="admin-song-hint">{uploading.album}</p> : null}
              {albumForm.image ? <img src={albumForm.image} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8 }} /> : null}
              <input type="date" value={albumForm.release_date} onChange={(e) => setAlbumForm({ ...albumForm, release_date: e.target.value })} />
              <select value={albumForm.artist_id} onChange={(e) => setAlbumForm({ ...albumForm, artist_id: e.target.value })}>
                <option value="">Chọn nghệ sĩ</option>
                {
                  artists.slice(0, 2).map(
                    (artist) =>
                      <option key={artist.id} value={artist.id}>{artist.name}</option>
                  )
                }
              </select>

              {editingAlbumId ? <button type="button" onClick={resetAlbumForm}>Hủy</button> : null}
              <button type="submit" disabled={uploading.album === 'Đang upload...'}>{editingAlbumId ? 'Lưu album' : 'Thêm album'}
              </button>
            </form>
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

        {activeTab === 'artists' ?
          <section className="admin-panel">
            <div className="admin-panel__header">
              <div>
                <h3>Quản lý nghệ sĩ</h3>
              </div>
            </div>
            <form className="admin-form" onSubmit={submitArtist}>
              <input placeholder="Tên nghệ sĩ" value={artistForm.name} onChange={(e) => setArtistForm({ ...artistForm, name: e.target.value })} />
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => uploadArtistImage(e.target.files?.[0])} />
              <input placeholder="Ảnh" value={artistForm.image} onChange={(e) => setArtistForm({ ...artistForm, image: e.target.value })} />
              {uploading.artist ? <p className="admin-song-hint">{uploading.artist}</p> : null}
              {artistForm.image ? <img src={artistForm.image} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8 }} /> : null}
              <input placeholder="Giới thiệu" value={artistForm.bio} onChange={(e) => setArtistForm({ ...artistForm, bio: e.target.value })} />
              <input placeholder="Số follower" type="number" value={artistForm.follower_count} onChange={(e) => setArtistForm({ ...artistForm, follower_count: e.target.value })} />
              <button type="submit" disabled={uploading.artist === 'Đang upload...'}>{editingArtistId ? 'Lưu nghệ sĩ' : 'Thêm nghệ sĩ'}</button>
              {editingArtistId ? <button type="button" onClick={resetArtistForm}>Hủy</button> : null}
            </form>
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
