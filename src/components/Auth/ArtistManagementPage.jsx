import { UpdateArtist } from './UpdateArtist.jsx';
import './ArtistManagementPage.css';

export function ArtistManagementPage({
  active,
  artistForm,
  artistFormOpen,
  artists,
  editingArtistId,
  errors,
  onBioChange,
  onCloseForm,
  onDeleteArtist,
  onEditArtist,
  onFormChange,
  onImageChange,
  onOpenCreateForm,
  onSubmitArtist,
  uploading,
}) {
  if (!active) {
    return null;
  }

  if (artistFormOpen) {
    return (
      <UpdateArtist
        artistForm={artistForm}
        errors={errors}
        editingArtistId={editingArtistId}
        uploading={uploading}
        onClose={onCloseForm}
        onFormChange={onFormChange}
        onBioChange={onBioChange}
        onImageChange={onImageChange}
        onSubmit={onSubmitArtist}
      />
    );
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel__header">
        <div>
          <h3>Quản lý nghệ sĩ</h3>
        </div>
        <button type="button" className="admin-save-btn" onClick={onOpenCreateForm}>Thêm nghệ sĩ</button>
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
                  <button type="button" onClick={() => onEditArtist(artist)}>
                    Sửa
                  </button>
                  <button type="button" className="is-danger" onClick={() => onDeleteArtist('artists', artist.id)}>
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
