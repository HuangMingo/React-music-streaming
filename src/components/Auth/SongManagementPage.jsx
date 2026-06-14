import { InsertSong } from './InsertSong.jsx';
import './SongManagementPage.css';

export function SongManagementPage({
  active,
  albums,
  artists,
  editingSongId,
  errors,
  formatDuration,
  onCloseForm,
  onDeleteSong,
  onEditSong,
  onFileChange,
  onFormChange,
  onOpenCreateForm,
  onSubmitSong,
  songFiles,
  songForm,
  songMode,
  songSubmitting,
  songs,
  uploading,
}) {
  if (!active) {
    return null;
  }

  if (songMode === 'create') {
    return (
      <InsertSong
        albums={albums}
        artists={artists}
        songFiles={songFiles}
        songForm={songForm}
        errors={errors}
        songSubmitting={songSubmitting}
        editingSongId={editingSongId}
        uploading={uploading}
        onClose={onCloseForm}
        onFileChange={onFileChange}
        onFormChange={onFormChange}
        onSubmit={onSubmitSong}
      />
    );
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel__header">
        <h3>Quản lý bài hát</h3>
        <button type="button" className="admin-save-btn" onClick={onOpenCreateForm}>
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
                  <button type="button" onClick={() => onEditSong(song)}>
                    Sửa
                  </button>
                  <button type="button" className="is-danger" onClick={() => onDeleteSong('songs', song.id)}>
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
