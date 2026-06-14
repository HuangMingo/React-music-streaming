export function UpdateAlbum({
  albumForm,
  errors = {},
  artists,
  editingAlbumId,
  uploading,
  onClose,
  onFormChange,
  onImageChange,
  onSubmit,
}) {
  const albumActionLabel = editingAlbumId ? 'Sửa album' : 'Thêm album';

  return (
    <section className="admin-song-editor admin-album-manager">
      <div className="admin-song-editor__topline">
        <button className="admin-breadcrumb" type="button" onClick={onClose}>Quản lý album</button>
        <span>&gt;</span>
        <strong>{albumActionLabel}</strong>
      </div>

      <div className="admin-song-editor__header">
        <div className="admin-song-editor__title">
          <button type="button" className="admin-back-btn" onClick={onClose}><i class="bi bi-arrow-left"></i></button>
          <div>
            <h2>{albumActionLabel}</h2>
            <p>{editingAlbumId ? 'Cập nhật thông tin album' : 'Tạo album mới cho thư viện nhạc'}</p>
          </div>
        </div>
      </div>

      <div className="admin-song-editor__grid">
        <form className="admin-song-card" onSubmit={onSubmit}>
          <label>Tên album <span>*</span></label>
          <input maxLength={255} placeholder="Nhập tên album" value={albumForm.title} onChange={(e) => onFormChange({ ...albumForm, title: e.target.value }, 'title')} />
          {errors.title ? <p className="admin-field-error">{errors.title}</p> : null}

          <label>Nghệ sĩ <span>*</span></label>
          <select value={albumForm.artist_id} onChange={(e) => onFormChange({ ...albumForm, artist_id: e.target.value }, 'artist_id')}>
            <option value="">Chọn nghệ sĩ</option>
            {artists.map((artist) => <option key={artist.id} value={artist.id}>{artist.name}</option>)}
          </select>
          {errors.artist_id ? <p className="admin-field-error">{errors.artist_id}</p> : null}

          <label>Ảnh album <span>*</span></label>
          <input id="admin-album-image-upload" hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onImageChange(e.target.files?.[0])} />
          <div className="admin-cover-upload">
            {albumForm.image ? <div className="admin-cover-preview">
              <img src={albumForm.image} alt="Preview ảnh album" />
              <button type="button" onClick={() => onImageChange(null)}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div> : null}
            <label className="admin-cover-drop" htmlFor="admin-album-image-upload">
              <strong>Upload ảnh album</strong>
            </label>
          </div>
          {albumForm.image ? (
            <p className="admin-cloudinary-link">
              <span>Đường dẫn Cloudinary ảnh album</span>
              <a href={albumForm.image} target="_blank" rel="noreferrer" title={albumForm.image}>{albumForm.image}</a>
            </p>
          ) : null}
          {uploading.album ? <p className="admin-song-hint">{uploading.album}</p> : null}
          {errors.image ? <p className="admin-field-error">{errors.image}</p> : null}
          <p className="admin-song-hint">Định dạng: JPG, PNG, WEBP</p>

          <div className="admin-song-editor__actions">
            {editingAlbumId ? <button type="button" className="admin-cancel-btn" onClick={onClose}>Hủy</button> : null}
            <button type="submit" className="admin-save-btn" disabled={uploading.album === 'Đang upload...'}>Lưu album</button>
          </div>
          {errors.form ? <p className="admin-field-error">{errors.form}</p> : null}
        </form>
      </div>
    </section>
  );
}
