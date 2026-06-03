import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Navigate } from 'react-router-dom';
import { API_URL } from '../../api.js';
import { useAuthContext } from '../../context/AuthContext';
import { showNotificationToast } from '../../toast.js';

const EMPTY_SONG_FORM = {
  title: '',
  album_id: '',
  track_number: '',
  release_date: '',
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

function toDateInput(value) {
  return value ? String(value).slice(0, 10) : '';
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

function formatFileSize(file) {
  if (!file) {
    return '';
  }

  if (file.size < 1024 * 1024) {
    return `${(file.size / 1024).toFixed(1)} KB`;
  }

  return `${(file.size / 1024 / 1024).toFixed(2)} MB`;
}

export function AdminDashboardPage() {
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
  const [editingAlbumId, setEditingAlbumId] = useState(null);
  const [editingArtistId, setEditingArtistId] = useState(null);
  const [songForm, setSongForm] = useState(EMPTY_SONG_FORM);
  const [songFiles, setSongFiles] = useState(EMPTY_SONG_FILES);
  const [imagePreview, setImagePreview] = useState('');
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

  useEffect(() => {
    if (!songFiles.image) {
      setImagePreview('');
      return undefined;
    }

    const previewUrl = URL.createObjectURL(songFiles.image);
    setImagePreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [songFiles.image]);

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  function openCreateSongForm() {
    setSongMode('create');
    setSongForm(EMPTY_SONG_FORM);
    setSongFiles(EMPTY_SONG_FILES);
    setMessage('');
  }

  function closeCreateSongForm() {
    setSongMode('list');
    setSongForm(EMPTY_SONG_FORM);
    setSongFiles(EMPTY_SONG_FILES);
  }

  function resetAlbumForm() {
    setEditingAlbumId(null);
    setAlbumForm(EMPTY_ALBUM_FORM);
  }

  function resetArtistForm() {
    setEditingArtistId(null);
    setArtistForm(EMPTY_ARTIST_FORM);
  }

  function updateSongFile(field, file) {
    setSongFiles((current) => ({ ...current, [field]: file || null }));
  }

  async function submitSong(event) {
    event.preventDefault();

    if (!songForm.title.trim()) {
      setMessage('Vui lòng nhập tiêu đề bài hát.');
      return;
    }

    if (!songFiles.audio) {
      setMessage('Vui lòng chọn file audio MP3.');
      return;
    }

    if (!songFiles.image) {
      setMessage('Vui lòng chọn ảnh bìa.');
      return;
    }

    const formData = new FormData();
    formData.append('title', songForm.title.trim());
    formData.append('album_id', songForm.album_id);
    formData.append('track_number', songForm.track_number);
    formData.append('release_date', songForm.release_date);
    formData.append('audio', songFiles.audio);
    formData.append('image', songFiles.image);

    if (songFiles.lyrics) {
      formData.append('lyrics', songFiles.lyrics);
    }

    setSongSubmitting(true);
    try {
      await axios.post(`${API_URL}/api/admin/songs`, formData, { headers: adminHeaders });
      setNotice('Đã thêm bài hát.');
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
    setActiveTab('albums');
  }

  function editArtist(artist) {
    setEditingArtistId(artist.id);
    setArtistForm({
      name: artist.name || '',
      image: artist.image || artist.avatar || '',
      bio: artist.bio || '',
      follower_count: artist.follower_count || artist.followers_count || '',
    });
    setActiveTab('artists');
  }

  return (
    <div className="admin-dashboard-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand__icon">♪</span>
          <div>
            <h1>Music Admin</h1>
            <p>{currentUser?.role === 'super_admin' ? 'Super Admin' : 'Admin Panel'}</p>
          </div>
        </div>

        <nav className="admin-nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? 'is-active' : ''}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
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
                <h2>Tổng quan</h2>
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
          <form className="admin-song-editor" onSubmit={submitSong}>
            <div className="admin-song-editor__topline">
              <button className="admin-breadcrumb" type="button" onClick={closeCreateSongForm}>Quản lý bài hát</button>
              <span>&gt;</span>
              <strong>Thêm bài hát</strong>
            </div>

            <div className="admin-song-editor__header">
              <div className="admin-song-editor__title">
                <button type="button" className="admin-back-btn" onClick={closeCreateSongForm}>←</button>
                <div>
                  <h2>Thêm bài hát</h2>
                  <p>Nhập thông tin và upload file bài hát</p>
                </div>
              </div>
              <div className="admin-song-editor__actions">
                <button type="button" className="admin-cancel-btn" onClick={closeCreateSongForm}>Hủy</button>
                <button type="submit" className="admin-save-btn" disabled={songSubmitting}>{songSubmitting ? 'Đang lưu...' : 'Lưu bài hát'}</button>
              </div>
            </div>

            <div className="admin-song-editor__grid">
              <section className="admin-song-card">
                <label>Tiêu đề bài hát <span>*</span></label>
                <input maxLength={255} placeholder="Nhập tiêu đề bài hát" value={songForm.title} onChange={(event) => setSongForm({ ...songForm, title: event.target.value })} />

                <label>Album</label>
                <select value={songForm.album_id} onChange={(event) => setSongForm({ ...songForm, album_id: event.target.value })}>
                  <option value="">Chọn album</option>
                  {albums.map((album) => <option key={album.id} value={album.id}>{album.title || album.name}</option>)}
                </select>
                <p className="admin-song-hint">Chọn album chứa bài hát nếu có.</p>

                <label>Số thứ tự trong album</label>
                <input type="number" min="1" placeholder="Ví dụ: 1, 2, 3..." value={songForm.track_number} onChange={(event) => setSongForm({ ...songForm, track_number: event.target.value })} />
                <p className="admin-song-hint">Ví dụ: 1, 2, 3...</p>

                <label>Nghệ sĩ</label>
                <input type="text" placeholder="Nhập tên nghệ sĩ" value={songForm.artist} onChange={(event) => setSongForm({ ...songForm, artist: event.target.value })} />
              </section>

              <section className="admin-song-card">
                <label>File audio (MP3) <span>*</span></label>
                <input id="admin-audio-upload" hidden name="audio" type="file" accept="audio/mpeg,.mp3" onChange={(event) => updateSongFile('audio', event.target.files?.[0])} />
                <div className="admin-file-box">
                  <div className="admin-file-box__icon">♪</div>
                  <div><strong>{songFiles.audio?.name || 'Chưa chọn file audio'}</strong><p>{songFiles.audio ? formatFileSize(songFiles.audio) : 'Định dạng: MP3'}</p></div>
                  <label className="admin-file-btn" htmlFor="admin-audio-upload">Chọn file</label>
                  {songFiles.audio ? <button type="button" className="admin-remove-btn" onClick={() => updateSongFile('audio', null)}>Xóa</button> : null}
                </div>
                <p className="admin-song-hint">Định dạng: MP3</p>

                <label>Ảnh bìa <span>*</span></label>
                <input id="admin-image-upload" hidden name="image" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => updateSongFile('image', event.target.files?.[0])} />
                <div className="admin-cover-upload">
                  {imagePreview ? <div className="admin-cover-preview"><img src={imagePreview} alt="Preview ảnh bìa" /><button type="button" onClick={() => updateSongFile('image', null)}>×</button></div> : null}
                  <label className="admin-cover-drop" htmlFor="admin-image-upload"><span>Upload</span><strong>Chọn file ảnh</strong></label>
                </div>
                <p className="admin-song-hint">Định dạng: JPG, PNG, WEBP</p>

                <label>Lyrics</label>
                <input id="admin-lyrics-upload" hidden name="lyrics" type="file" accept=".txt,.lrc,.srt,text/plain" onChange={(event) => updateSongFile('lyrics', event.target.files?.[0])} />
                <div className="admin-file-box">
                  <div className="admin-file-box__icon">TXT</div>
                  <div><strong>{songFiles.lyrics?.name || 'Chưa chọn file lyrics'}</strong><p>{songFiles.lyrics ? formatFileSize(songFiles.lyrics) : 'Định dạng: TXT, LRC hoặc SRT'}</p></div>
                  <label className="admin-file-btn" htmlFor="admin-lyrics-upload">Chọn file</label>
                  {songFiles.lyrics ? <button type="button" className="admin-remove-btn" onClick={() => updateSongFile('lyrics', null)}>Xóa</button> : null}
                </div>

                <label>Thời lượng bài hát</label>
                <div className="admin-readonly-field">Tự động</div>
                <p className="admin-song-hint">Thời lượng sẽ được tự động lấy từ file audio sau khi lưu.</p>
              </section>
            </div>
          </form>
        ) : null}

        {activeTab === 'songs' && songMode === 'list' ? (
          <section className="admin-panel">
            <div className="admin-panel__header"><div><h3>Quản lý bài hát</h3><p>Thêm, sửa, xóa và quản lý bài hát</p></div><button type="button" className="admin-save-btn" onClick={openCreateSongForm}>+ Thêm bài hát</button></div>
            <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>#</th><th>Ảnh</th><th>Tên bài hát</th><th>Nghệ sĩ</th><th>Album</th><th>Thời lượng</th><th>Thao tác</th></tr></thead><tbody>{songs.map((song, index) => <tr key={song.id}><td>{index + 1}</td><td>{song.image ? <img src={song.image} alt="" /> : null}</td><td>{song.title}</td><td>{song.artists?.map((artist) => artist.name).join(', ') || '--'}</td><td>{song.album_title || '--'}</td><td>{formatDuration(song.duration_seconds)}</td><td><button type="button" className="is-danger" onClick={() => removeItem('songs', song.id)}>Xóa</button></td></tr>)}</tbody></table></div>
          </section>
        ) : null}

        {activeTab === 'albums' ? <section className="admin-panel"><div className="admin-panel__header"><div><h3>Quản lý album</h3><p>Thêm, sửa, xóa album</p></div></div><form className="admin-form" onSubmit={submitAlbum}><input placeholder="Tên album" value={albumForm.title} onChange={(e) => setAlbumForm({ ...albumForm, title: e.target.value })} /><input placeholder="Ảnh" value={albumForm.image} onChange={(e) => setAlbumForm({ ...albumForm, image: e.target.value })} /><input type="date" value={albumForm.release_date} onChange={(e) => setAlbumForm({ ...albumForm, release_date: e.target.value })} /><select value={albumForm.artist_id} onChange={(e) => setAlbumForm({ ...albumForm, artist_id: e.target.value })}><option value="">Chọn nghệ sĩ</option>{artists.map((artist) => <option key={artist.id} value={artist.id}>{artist.name}</option>)}</select><button type="submit">{editingAlbumId ? 'Lưu album' : 'Thêm album'}</button>{editingAlbumId ? <button type="button" onClick={resetAlbumForm}>Hủy</button> : null}</form><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>#</th><th>Ảnh</th><th>Tên album</th><th>Nghệ sĩ</th><th>Ngày phát hành</th><th>Số bài hát</th><th>Thao tác</th></tr></thead><tbody>{albums.map((album, index) => <tr key={album.id}><td>{index + 1}</td><td>{album.image ? <img src={album.image} alt="" /> : null}</td><td>{album.title || album.name}</td><td>{album.artist_name || '--'}</td><td>{toDateInput(album.release_date) || '--'}</td><td>{album.song_count || 0}</td><td><button type="button" onClick={() => editAlbum(album)}>Sửa</button><button type="button" className="is-danger" onClick={() => removeItem('albums', album.id)}>Xóa</button></td></tr>)}</tbody></table></div></section> : null}

        {activeTab === 'artists' ? <section className="admin-panel"><div className="admin-panel__header"><div><h3>Quản lý nghệ sĩ</h3><p>Thêm, sửa, xóa nghệ sĩ</p></div></div><form className="admin-form" onSubmit={submitArtist}><input placeholder="Tên nghệ sĩ" value={artistForm.name} onChange={(e) => setArtistForm({ ...artistForm, name: e.target.value })} /><input placeholder="Ảnh" value={artistForm.image} onChange={(e) => setArtistForm({ ...artistForm, image: e.target.value })} /><input placeholder="Giới thiệu" value={artistForm.bio} onChange={(e) => setArtistForm({ ...artistForm, bio: e.target.value })} /><input placeholder="Số follower" type="number" value={artistForm.follower_count} onChange={(e) => setArtistForm({ ...artistForm, follower_count: e.target.value })} /><button type="submit">{editingArtistId ? 'Lưu nghệ sĩ' : 'Thêm nghệ sĩ'}</button>{editingArtistId ? <button type="button" onClick={resetArtistForm}>Hủy</button> : null}</form><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>#</th><th>Ảnh</th><th>Tên nghệ sĩ</th><th>Bio</th><th>Bài hát</th><th>Follower</th><th>Thao tác</th></tr></thead><tbody>{artists.map((artist, index) => <tr key={artist.id}><td>{index + 1}</td><td>{artist.image ? <img src={artist.image} alt="" /> : null}</td><td>{artist.name}</td><td>{artist.bio || '--'}</td><td>{artist.song_count || 0}</td><td>{artist.follower_count || artist.followers_count || 0}</td><td><button type="button" onClick={() => editArtist(artist)}>Sửa</button><button type="button" className="is-danger" onClick={() => removeItem('artists', artist.id)}>Xóa</button></td></tr>)}</tbody></table></div></section> : null}

        {activeTab === 'users' && isSuperAdmin ? <section className="admin-panel"><div className="admin-panel__header"><div><h3>Quản lý user</h3><p>Nâng hoặc hạ quyền tài khoản</p></div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Thao tác</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td>{user.id}</td><td>{user.username}</td><td>{user.email || '--'}</td><td><span className="admin-role">{user.role}</span></td><td>{user.role === 'user' ? <button type="button" onClick={() => updateRole(user.id, 'admin')}>Nâng admin</button> : null}{user.role === 'user' || user.role === 'admin' ? <button type="button" onClick={() => updateRole(user.id, 'super_admin')}>Nâng super admin</button> : null}{user.role === 'admin' ? <button type="button" onClick={() => updateRole(user.id, 'user')}>Hạ user</button> : null}{user.role === 'super_admin' ? <span>Không đổi</span> : null}</td></tr>)}</tbody></table></div></section> : null}
      </main>
    </div>
  );
}
