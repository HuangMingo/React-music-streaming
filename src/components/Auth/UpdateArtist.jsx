export function UpdateArtist({
  artistForm,
  errors = {},
  editingArtistId,
  uploading,
  onBioChange,
  onClose,
  onFormChange,
  onImageChange,
  onSubmit,
}) {
  const artistActionLabel = editingArtistId ? 'Sửa nghệ sĩ' : 'Thêm nghệ sĩ';
  const bioFileName = artistForm.bio ? getFileNameFromUrl(artistForm.bio) : '';

  return (
    <section className="admin-song-editor admin-artist-manager">
      <div className="admin-song-editor__topline">
        <button className="admin-breadcrumb" type="button" onClick={onClose}>Quản lý nghệ sĩ</button>
        <span>&gt;</span>
        <strong>{artistActionLabel}</strong>
      </div>

      <div className="admin-song-editor__header">
        <div className="admin-song-editor__title">
          <button type="button" className="admin-back-btn" onClick={onClose}>←</button>
          <div>
            <h2>{artistActionLabel}</h2>
            <p>{editingArtistId ? 'Cập nhật thông tin nghệ sĩ' : 'Tạo nghệ sĩ mới cho thư viện nhạc'}</p>
          </div>
        </div>
      </div>

      <div className="admin-song-editor__grid">
        <form className="admin-song-card" onSubmit={onSubmit}>
          <label>Tên nghệ sĩ <span>*</span></label>
          <input maxLength={255} placeholder="Nhập tên nghệ sĩ" value={artistForm.name} onChange={(e) => onFormChange({ ...artistForm, name: e.target.value }, 'name')} />
          {errors.name ? <p className="admin-field-error">{errors.name}</p> : null}

          <label>Ảnh nghệ sĩ</label>
          <input id="admin-artist-image-upload" hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onImageChange(e.target.files?.[0])} />
          <div className="admin-cover-upload">
            {artistForm.image ? <div className="admin-cover-preview">
              <img src={artistForm.image} alt="Preview ảnh nghệ sĩ" />
              <button type="button" onClick={() => onImageChange(null)}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div> : null}
            <label className="admin-cover-drop" htmlFor="admin-artist-image-upload">
              <strong>Upload ảnh nghệ sĩ</strong>
            </label>
          </div>
          {artistForm.image ? (
            <p className="admin-cloudinary-link">
              <span>Đường dẫn Cloudinary ảnh nghệ sĩ</span>
              <a href={artistForm.image} target="_blank" rel="noreferrer" title={artistForm.image}>{artistForm.image}</a>
            </p>
          ) : null}
          {uploading.artist ? <p className="admin-song-hint">{uploading.artist}</p> : null}
          {errors.image ? <p className="admin-field-error">{errors.image}</p> : null}
          <p className="admin-song-hint">Định dạng: JPG, PNG, WEBP</p>

          <label>Giới thiệu</label>
          <input id="admin-artist-bio-upload" hidden type="file" accept=".txt,text/plain" onChange={(e) => onBioChange(e.target.files?.[0])} />
          <div className="admin-file-box">
            <div className="admin-file-box__icon">TXT</div>
            <div><strong>{artistForm.bio ? 'Đã có file giới thiệu' : 'Chưa chọn file giới thiệu'}</strong><p>{bioFileName || 'Định dạng: TXT'}</p></div>
            <label className="admin-file-btn" htmlFor="admin-artist-bio-upload">Chọn file</label>
            {artistForm.bio ? <button type="button" className="admin-remove-btn" onClick={() => onBioChange(null)}>Xóa</button> : null}
          </div>
          {artistForm.bio ? (
            <p className="admin-cloudinary-link">
              <span>Đường dẫn Cloudinary giới thiệu</span>
              <a href={artistForm.bio} target="_blank" rel="noreferrer" title={artistForm.bio}>{artistForm.bio}</a>
            </p>
          ) : null}
          {errors.bio ? <p className="admin-field-error">{errors.bio}</p> : null}
          <p className="admin-song-hint">Định dạng: TXT</p>

          <div className="admin-song-editor__actions">
            {editingArtistId ? <button type="button" className="admin-cancel-btn" onClick={onClose}>Hủy</button> : null}
            <button type="submit" className="admin-save-btn" disabled={uploading.artist === 'Đang upload...'}>Lưu nghệ sĩ</button>
          </div>
          {errors.form ? <p className="admin-field-error">{errors.form}</p> : null}
        </form>
      </div>
    </section>
  );
}

function getFileNameFromUrl(url) {
  try {
    const { pathname } = new URL(url);
    return decodeURIComponent(pathname.split('/').pop() || url);
  } catch (error) {
    return url;
  }
}
