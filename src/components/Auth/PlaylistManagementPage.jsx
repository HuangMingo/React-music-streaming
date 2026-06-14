import './PlaylistManagementPage.css';

export function PlaylistManagementPage({
  active,
  editingPlaylistId,
  errors,
  onClearSongs,
  onCloseForm,
  onDeletePlaylist,
  onEditPlaylist,
  onFormChange,
  onImageChange,
  onOpenCreateForm,
  onSubmitPlaylist,
  playlistDropdownOpen,
  playlistForm,
  playlistFormOpen,
  selectedPlaylistSongIds,
  selectedPlaylistSongs,
  setPlaylistDropdownOpen,
  songs,
  systemPlaylists,
  togglePlaylistSong,
  uploading,
}) {
  if (!active) {
    return null;
  }

  if (playlistFormOpen) {
    return (
      <section className="admin-song-editor admin-playlist-manager">
        <div className="admin-song-editor__topline">
          <button className="admin-breadcrumb" type="button" onClick={onCloseForm}>Quản lý playlist</button>
          <span>&gt;</span>
          <strong>{editingPlaylistId ? 'Sửa playlist hệ thống' : 'Thêm playlist hệ thống'}</strong>
        </div>

        <div className="admin-song-editor__header">
          <div className="admin-song-editor__title">
            <button type="button" className="admin-back-btn" onClick={onCloseForm}>←</button>
            <div>
              <h2>{editingPlaylistId ? 'Sửa playlist hệ thống' : 'Thêm playlist hệ thống'}</h2>
              <p>{editingPlaylistId ? 'Cập nhật tên, ảnh bìa và danh sách bài hát' : 'Tạo playlist hệ thống mới cho trang khám phá'}</p>
            </div>
          </div>
        </div>

        <div className="admin-song-editor__grid">
          <form className="admin-song-card" onSubmit={onSubmitPlaylist}>
            <label>Tên playlist <span>*</span></label>
            <input maxLength={255} placeholder="Nhập tên playlist" value={playlistForm.name} onChange={(e) => onFormChange({ ...playlistForm, name: e.target.value }, 'name')} />
            {errors?.name ? <p className="admin-field-error">{errors.name}</p> : null}

            <label>Ảnh bìa playlist</label>
            <input id="admin-playlist-image-upload" hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onImageChange(e.target.files?.[0])} />
            <div className="admin-cover-upload">
              {playlistForm.image ? <div className="admin-cover-preview">
                <img src={playlistForm.image} alt="Preview ảnh playlist" />
                <button type="button" onClick={() => onImageChange(null)}>
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
            {errors?.image ? <p className="admin-field-error">{errors.image}</p> : null}
            <p className="admin-song-hint">Định dạng: JPG, PNG, WEBP</p>

            <div className="admin-song-editor__actions">
              <button type="button" className="admin-cancel-btn" onClick={onCloseForm}>Hủy</button>
              <button type="submit" className="admin-save-btn" disabled={uploading.playlist === 'Đang upload...'}>Lưu playlist</button>
            </div>
            {errors?.form ? <p className="admin-field-error">{errors.form}</p> : null}
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
                  onClick={onClearSongs}
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
    );
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel__header">
        <div>
          <h3>Quản lý playlist hệ thống</h3>
        </div>
        <button type="button" className="admin-save-btn" onClick={onOpenCreateForm}>Thêm playlist</button>
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
                  <button type="button" onClick={() => onEditPlaylist(playlist)}>
                    Sửa
                  </button>
                  <button type="button" className="is-danger" onClick={() => onDeletePlaylist('playlists', playlist.id)}>
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
