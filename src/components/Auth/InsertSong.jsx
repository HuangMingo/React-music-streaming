import { useEffect, useState } from 'react';

function formatFileSize(file) {
  if (!file) {
    return '';
  }

  if (file.size < 1024 * 1024) {
    return `${(file.size / 1024).toFixed(1)} KB`;
  }

  return `${(file.size / 1024 / 1024).toFixed(2)} MB`;
}

function getCloudinaryFileName(url) {
  if (!url) {
    return '';
  }

  try {
    const { pathname } = new URL(url);
    return decodeURIComponent(pathname.split('/').pop() || url);
  } catch (error) {
    return url;
  }
}

function CloudinaryFileLink({ label, url }) {
  if (!url) {
    return null;
  }

}

export function InsertSong({
  albums,
  artists,
  genres = [],
  songFiles,
  songForm,
  errors = {},
  songSubmitting,
  editingSongId,
  uploading,
  onClose,
  onFileChange,
  onFormChange,
  onSubmit,
}) {
  const [imagePreview, setImagePreview] = useState('');
  const [artistDropdownOpen, setArtistDropdownOpen] = useState(false);
  const [genreDropdownOpen, setGenreDropdownOpen] = useState(false);
  const songActionLabel = editingSongId ? 'Sửa bài hát' : 'Thêm bài hát';
  const audioFileLabel = songFiles.audio?.name || (songForm.audio ? 'Đã có file audio' : 'Chưa chọn file audio');
  const audioFileMeta = songFiles.audio ? formatFileSize(songFiles.audio) : (songForm.audio ? getCloudinaryFileName(songForm.audio) : 'Định dạng: MP3');
  const lyricsFileLabel = songFiles.lyrics?.name || (songForm.lyrics ? 'Đã có file lyrics' : 'Chưa chọn file lyrics');
  const lyricsFileMeta = songFiles.lyrics ? formatFileSize(songFiles.lyrics) : (songForm.lyrics ? getCloudinaryFileName(songForm.lyrics) : 'Định dạng: TXT, LRC hoặc SRT');

  const selectedArtistIds = songForm.artist_ids || [];
  const selectedArtists = artists.filter((artist) => selectedArtistIds.includes(artist.id));
  const selectedGenreIds = songForm.genre_ids || [];
  const selectedGenres = genres.filter((genre) => selectedGenreIds.includes(genre.id));

  function updateArtistIds(nextArtistIds) {
    onFormChange({ ...songForm, artist_ids: nextArtistIds }, 'artist_ids');
  }

  function toggleArtist(artistId) {;
    if (selectedArtistIds.includes(artistId)) {
      updateArtistIds(selectedArtistIds.filter((id) => id !== artistId));
      return;
    }

    updateArtistIds([...selectedArtistIds, artistId]);
  }

  function updateGenreIds(nextGenreIds) {
    onFormChange({ ...songForm, genre_ids: nextGenreIds }, 'genre_ids');
  }

  function toggleGenre(genreId) {
    if (selectedGenreIds.includes(genreId)) {
      updateGenreIds(selectedGenreIds.filter((id) => id !== genreId));
      return;
    }

    updateGenreIds([...selectedGenreIds, genreId]);
  }

  useEffect(() => {
    if (!songFiles.image) {
      setImagePreview(songForm.image || '');
      return undefined;
    }

    const previewUrl = URL.createObjectURL(songFiles.image);
    setImagePreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [songFiles.image, songForm.image]);

  return (
    <form className="admin-song-editor" onSubmit={onSubmit}>
      <div className="admin-song-editor__topline">
        <button className="admin-breadcrumb" type="button" onClick={onClose}>Quản lý bài hát</button>
        <span>
          <i class="bi bi-chevron-right"></i>
        </span>
        <strong>{songActionLabel}</strong>
      </div>

      <div className="admin-song-editor__header">
        <div className="admin-song-editor__title">
          <button type="button" className="admin-back-btn" onClick={onClose}><i class="bi bi-arrow-left"></i></button>
          <div>
            <h2>{songActionLabel}</h2>
          </div>
        </div>

      </div>

      <div className="admin-song-editor__grid">
        <section className="admin-song-card">
          <label>Tiêu đề bài hát <span>*</span></label>
          <input maxLength={255} placeholder="Nhập tiêu đề bài hát" value={songForm.title} onChange={(event) => onFormChange({ ...songForm, title: event.target.value }, 'title')} />
          {errors.title ? <p className="admin-field-error">{errors.title}</p> : null}

          <label>Album</label>
          <select value={songForm.album_id} onChange={(event) => onFormChange({ ...songForm, album_id: event.target.value }, 'album_id')}>
            <option value="">Chọn album</option>
            {albums.map((album) => <option key={album.id} value={album.id}>{album.title || album.name}</option>)}
          </select>
          <p className="admin-song-hint">Chọn album chứa bài hát nếu có.</p>

          <label>Số thứ tự trong album</label>
          <input type="number" min="1" placeholder="Ví dụ: 1, 2, 3..." value={songForm.track_number} onChange={(event) => onFormChange({ ...songForm, track_number: event.target.value }, 'track_number')} />
          {errors.track_number ? <p className="admin-field-error">{errors.track_number}</p> : null}
          <p className="admin-song-hint">Ví dụ: 1, 2, 3...</p>

          <label>Nghệ sĩ</label>
          <div className={`admin-multi-select${artistDropdownOpen ? ' is-open' : ''}`}>
            <div className="admin-multi-select__control">
              <div className="admin-multi-select__values">
                {
                  selectedArtists.length ? selectedArtists.map((artist) => (
                    <span className="admin-multi-select__tag" key={artist.id}>
                      {artist.name}
                      <button type="button" onClick={() => toggleArtist(artist.id)}><i class="fa-solid fa-x"></i></button>
                    </span>
                  )) : <span className="admin-multi-select__placeholder">Chọn nghệ sĩ</span>
                }
              </div>
              <button
                className="admin-multi-select__clear"
                disabled={!selectedArtists.length}
                type="button"
                onClick={() => updateArtistIds([])}
              >
                <i class="bi bi-x-lg"></i>
              </button>
              <span className="admin-multi-select__divider"></span>
              <button
                className="admin-multi-select__arrow"
                type="button"
                onClick={() => setArtistDropdownOpen((current) => !current)}
              >
                <i class="bi bi-caret-down-fill"></i>
              </button>
            </div>
            {artistDropdownOpen ? (
              <div className="admin-multi-select__menu">
                {artists.map((artist) => (
                  <label className="admin-multi-select__option" key={artist.id}>
                    <input
                      checked={selectedArtistIds.includes(artist.id)}
                      type="checkbox"
                      onChange={() => toggleArtist(artist.id)}
                    />
                    <span>{artist.name}</span>
                  </label>
                ))}
              </div>
            ) : null}
          </div>
          {errors.artist_ids ? <p className="admin-field-error">{errors.artist_ids}</p> : null}

          <label>Thể loại</label>
          <div className={`admin-multi-select${genreDropdownOpen ? ' is-open' : ''}`}>
            <div className="admin-multi-select__control">
              <div className="admin-multi-select__values">
                {selectedGenres.length ? selectedGenres.map((genre) => (
                  <span className="admin-multi-select__tag" key={genre.id}>
                    {genre.name}
                    <button type="button" onClick={() => toggleGenre(genre.id)}><i className="fa-solid fa-x"></i></button>
                  </span>
                )) : <span className="admin-multi-select__placeholder">Chọn thể loại cho bài hát</span>}
              </div>
              <button
                className="admin-multi-select__clear"
                disabled={!selectedGenres.length}
                type="button"
                onClick={() => updateGenreIds([])}
              >
                <i className="bi bi-x-lg"></i>
              </button>
              <span className="admin-multi-select__divider"></span>
              <button
                className="admin-multi-select__arrow"
                type="button"
                onClick={() => setGenreDropdownOpen((current) => !current)}
              >
                <i className="bi bi-caret-down-fill"></i>
              </button>
            </div>
            {genreDropdownOpen ? (
              <div className="admin-multi-select__menu">
                {genres.map((genre) => (
                  <label className="admin-multi-select__option" key={genre.id}>
                    <input
                      checked={selectedGenreIds.includes(genre.id)}
                      type="checkbox"
                      onChange={() => toggleGenre(genre.id)}
                    />
                    <span>{genre.name}</span>
                  </label>
                ))}
              </div>
            ) : null}
          </div>
          {errors.genre_ids ? <p className="admin-field-error">{errors.genre_ids}</p> : null}

          <label>File audio (MP3) <span>*</span></label>
          <input id="admin-audio-upload" hidden name="audio" type="file" accept="audio/mpeg,.mp3" onChange={(event) => onFileChange('audio', event.target.files?.[0])} />
          <div className="admin-file-box">
            <div className="admin-file-box__icon">♪</div>
            <div><strong>{audioFileLabel}</strong><p>{audioFileMeta}</p></div>
            <label className="admin-file-btn" htmlFor="admin-audio-upload">Chọn file</label>
            {songFiles.audio || songForm.audio ? <button type="button" className="admin-remove-btn" onClick={() => onFileChange('audio', null)}>Xóa</button> : null}
          </div>
          <CloudinaryFileLink label="Đường dẫn Cloudinary audio" url={songForm.audio} />
          {uploading?.audio ? <p className="admin-song-hint">{uploading.audio}</p> : null}
          {errors.audio ? <p className="admin-field-error">{errors.audio}</p> : null}
          <p className="admin-song-hint">Định dạng: MP3</p>
        </section>

        <section className="admin-song-card">


          <label>Ảnh bìa <span>*</span></label>
          <input id="admin-image-upload" hidden name="image" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => onFileChange('image', event.target.files?.[0])} />
          <div className="admin-cover-upload">
            {imagePreview ? <div className="admin-cover-preview">
              <img src={imagePreview} alt="Preview ảnh bìa" />
              <button type="button" onClick={() => onFileChange('image', null)}>
                <i class="bi bi-x-lg"></i>
              </button>
            </div> : null}
            <label className="admin-cover-drop" htmlFor="admin-image-upload">
              <strong>Upload ảnh bìa</strong>
            </label>
          </div>
          <CloudinaryFileLink label="Đường dẫn Cloudinary ảnh bìa" url={songForm.image} />
          {uploading?.image ? <p className="admin-song-hint">{uploading.image}</p> : null}
          {errors.image ? <p className="admin-field-error">{errors.image}</p> : null}
          <p className="admin-song-hint">Định dạng: JPG, PNG, WEBP</p>

          <label>Lyrics</label>
          <input id="admin-lyrics-upload" hidden name="lyrics" type="file" accept=".txt,.lrc,.srt,text/plain" onChange={(event) => onFileChange('lyrics', event.target.files?.[0])} />
          <div className="admin-file-box">
            <div className="admin-file-box__icon">TXT</div>
            <div><strong>{lyricsFileLabel}</strong><p>{lyricsFileMeta}</p></div>
            <label className="admin-file-btn" htmlFor="admin-lyrics-upload">Chọn file</label>
            {songFiles.lyrics || songForm.lyrics ? <button type="button" className="admin-remove-btn" onClick={() => onFileChange('lyrics', null)}>Xóa</button> : null}
          </div>
          <CloudinaryFileLink label="Đường dẫn Cloudinary lyrics" url={songForm.lyrics} />
          {uploading?.lyrics ? <p className="admin-song-hint">{uploading.lyrics}</p> : null}
          {errors.lyrics ? <p className="admin-field-error">{errors.lyrics}</p> : null}

          <label>Thời lượng bài hát</label>
          <div className="admin-readonly-field">Tự động</div>
          <p className="admin-song-hint">Thời lượng sẽ được tự động lấy từ file audio sau khi lưu.</p>
          <div className="admin-song-editor__actions">
            <button type="button" className="admin-cancel-btn" onClick={onClose}>Hủy</button>
            <button type="submit" className="admin-save-btn" disabled={songSubmitting || Object.values(uploading || {}).some((status) => status === 'Đang upload...')}>{songSubmitting ? 'Đang lưu...' : 'Lưu bài hát'}</button>
          </div>
          {errors.form ? <p className="admin-field-error">{errors.form}</p> : null}
        </section>
      </div>

    </form>
  );
}
