import { UpdateAlbum } from './UpdateAlbum.jsx';
import './AlbumManagementPage.css';

export function AlbumManagementPage({
  active,
  albumForm,
  albumFormOpen,
  albums,
  artists,
  editingAlbumId,
  errors,
  onCloseForm,
  onDeleteAlbum,
  onEditAlbum,
  onFormChange,
  onImageChange,
  onOpenCreateForm,
  onSubmitAlbum,
  toDateInput,
  uploading,
}) {
  if (!active) {
    return null;
  }

  if (albumFormOpen) {
    return (
      <UpdateAlbum
        albumForm={albumForm}
        errors={errors}
        artists={artists}
        editingAlbumId={editingAlbumId}
        uploading={uploading}
        onClose={onCloseForm}
        onFormChange={onFormChange}
        onImageChange={onImageChange}
        onSubmit={onSubmitAlbum}
      />
    );
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel__header">
        <div>
          <h3>Quản lý album</h3>
        </div>
        <button type="button" className="admin-save-btn" onClick={onOpenCreateForm}>Thêm album</button>
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
                  <button type="button" onClick={() => onEditAlbum(album)}>
                    Sửa
                  </button>
                  <button type="button" className="is-danger" onClick={() => onDeleteAlbum('albums', album.id)}>
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
