import { pool } from '../config/dbpg.js';
import { ensureUserRoleColumn } from '../middlewares/AdminAuthMiddleware.js';

const VALID_USER_ROLES = ['user', 'admin', 'super_admin'];

function normalizeId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function normalizeArtistIds(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.map(normalizeId).filter(Boolean))];
}

function requireText(value, fieldName) {
  const text = String(value || '').trim();
  if (!text) {
    const error = new Error(`${fieldName} không được để trống.`);
    error.status = 400;
    throw error;
  }
  return text;
}

async function replaceSongArtists(client, songId, artistIds) {
  await client.query('DELETE FROM artist_song WHERE song_id = $1', [songId]);

  for (const artistId of artistIds) {
    await client.query(
      'INSERT INTO artist_song (song_id, artist_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [songId, artistId]
    );
  }
}

async function syncAlbumSong(client, songId, albumId) {
  await client.query('DELETE FROM album_song WHERE song_id = $1', [songId]);

  if (albumId) {
    await client.query(
      'INSERT INTO album_song (album_id, song_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [albumId, songId]
    );
  }
}

export async function getOverview() {
  await ensureUserRoleColumn();

  const [songs, albums, artists, users] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS count FROM song'),
    pool.query('SELECT COUNT(*)::int AS count FROM album'),
    pool.query('SELECT COUNT(*)::int AS count FROM artist'),
    pool.query('SELECT COUNT(*)::int AS count FROM "user"'),
  ]);

  return {
    songs: songs.rows[0].count,
    albums: albums.rows[0].count,
    artists: artists.rows[0].count,
    users: users.rows[0].count,
  };
}

export async function getSongs() {
  const result = await pool.query(`
    SELECT
      s.*,
      al.title AS album_title,
      COALESCE(
        json_agg(DISTINCT jsonb_build_object('id', ar.id, 'name', ar.name))
          FILTER (WHERE ar.id IS NOT NULL),
        '[]'
      ) AS artists
    FROM song s
    LEFT JOIN album al ON al.id = s.album_id
    LEFT JOIN artist_song ars ON ars.song_id = s.id
    LEFT JOIN artist ar ON ar.id = ars.artist_id
    GROUP BY s.id, al.title
    ORDER BY s.id DESC
  `);

  return result.rows;
}

export async function createSong(data) {
  const title = requireText(data.title, 'Tên bài hát');
  const albumId = normalizeId(data.album_id);
  const artistIds = normalizeArtistIds(data.artist_ids);
  const lyrics = data.lyrics ?? data.lyric ?? null;
  const durationSeconds = data.duration_seconds ? Number(data.duration_seconds) : null;
  const trackNumber = data.track_number ? Number(data.track_number) : null;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO song (title, image, audio, lyrics, duration_seconds, album_id, track_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title, data.image || null, data.audio || null, lyrics || null, durationSeconds, albumId, trackNumber]
    );
    const song = result.rows[0];

    await replaceSongArtists(client, song.id, artistIds);
    await syncAlbumSong(client, song.id, albumId);
    await client.query('COMMIT');

    return song;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateSong(songId, data) {
  const id = normalizeId(songId);
  if (!id) {
    const error = new Error('ID bài hát không hợp lệ.');
    error.status = 400;
    throw error;
  }

  const title = requireText(data.title, 'Tên bài hát');
  const albumId = normalizeId(data.album_id);
  const artistIds = normalizeArtistIds(data.artist_ids);
  const lyrics = data.lyrics ?? data.lyric ?? null;
  const durationSeconds = data.duration_seconds ? Number(data.duration_seconds) : null;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE song
       SET title = $1, image = $2, audio = $3, lyrics = $4, duration_seconds = $5, album_id = $6, release_date = CURRENT_DATE
       WHERE id = $7
       RETURNING *`,
      [title, data.image || null, data.audio || null, lyrics || null, durationSeconds, albumId, id]
    );

    if (!result.rows[0]) {
      const error = new Error('Không tìm thấy bài hát.');
      error.status = 404;
      throw error;
    }

    await replaceSongArtists(client, id, artistIds);
    await syncAlbumSong(client, id, albumId);
    await client.query('COMMIT');

    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
//pg coi câu lệnh có tham số
//  là một prepared statement và không cho phép nhiều 
// câu SQL trong một statement.
export async function deleteSong(songId) {
  const id = normalizeId(songId);
  if (!id) {
    const error = new Error('ID bài hát không hợp lệ.');
    error.status = 400;
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM artist_song WHERE song_id = $1', [id]);
    await client.query('DELETE FROM album_song WHERE song_id = $1', [id]);
    await client.query('DELETE FROM song_playlist WHERE song_id = $1', [id]);
    const result = await client.query('DELETE FROM song WHERE id = $1 RETURNING id', [id]);
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getAlbums() {
  const result = await pool.query(`
    SELECT
      al.*,
      al.title AS name,
      ar.name AS artist_name,
      COUNT(DISTINCT s.id)::int AS song_count
    FROM album al
    LEFT JOIN artist ar ON ar.id = al.artist_id
    LEFT JOIN song s ON s.album_id = al.id
    GROUP BY al.id, ar.name
    ORDER BY al.id DESC
  `);

  return result.rows;
}

export async function createAlbum(data) {
  const title = requireText(data.title || data.name, 'Tên album');
  const artistId = normalizeId(data.artist_id);
  if (!artistId) {
    const error = new Error('Vui lòng chọn nghệ sĩ cho album.');
    error.status = 400;
    throw error;
  }

  const result = await pool.query(
    `INSERT INTO album (title, image, release_date, artist_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [title, data.image || null, data.release_date || null, artistId]
  );

  return result.rows[0];
}

export async function updateAlbum(albumId, data) {
  const id = normalizeId(albumId);
  const title = requireText(data.title || data.name, 'Tên album');
  const artistId = normalizeId(data.artist_id);

  if (!id || !artistId) {
    const error = new Error('Dữ liệu album không hợp lệ.');
    error.status = 400;
    throw error;
  }

  const result = await pool.query(
    `UPDATE album
     SET title = $1, image = $2, release_date = $3, artist_id = $4
     WHERE id = $5
     RETURNING *`,
    [title, data.image || null, data.release_date || null, artistId, id]
  );

  return result.rows[0];
}

export async function deleteAlbum(albumId) {
  const id = normalizeId(albumId);
  if (!id) {
    const error = new Error('ID album không hợp lệ.');
    error.status = 400;
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM favourite_album WHERE album_id = $1', [id]);
    await client.query('DELETE FROM album_song WHERE album_id = $1', [id]);
    await client.query('UPDATE song SET album_id = NULL WHERE album_id = $1', [id]);
    const result = await client.query('DELETE FROM album WHERE id = $1 RETURNING id', [id]);
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getArtists() {
  const result = await pool.query(`
    SELECT
      ar.*,
      ar.image AS avatar,
      ar.follower_count AS followers_count,
      COUNT(DISTINCT ars.song_id)::int AS song_count
    FROM artist ar
    LEFT JOIN artist_song ars ON ars.artist_id = ar.id
    GROUP BY ar.id
    ORDER BY ar.id DESC
  `);

  return result.rows;
}

export async function createArtist(data) {
  const name = requireText(data.name, 'Tên nghệ sĩ');
  const image = data.image || data.avatar || data.cover_image || data.backgroundImage || null;
  const followerCount = data.follower_count ? Number(data.follower_count) : 0;

  const result = await pool.query(
    `INSERT INTO artist (name, image, bio, follower_count)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [name, image || '/assets/img/artists/artist-avatar.png', data.bio || data.introduction || null, followerCount]
  );

  return result.rows[0];
}

export async function updateArtist(artistId, data) {
  const id = normalizeId(artistId);
  const name = requireText(data.name, 'Tên nghệ sĩ');
  const image = data.image || data.avatar || data.cover_image || data.backgroundImage || null;
  const followerCount = data.follower_count ? Number(data.follower_count) : 0;

  if (!id) {
    const error = new Error('ID nghệ sĩ không hợp lệ.');
    error.status = 400;
    throw error;
  }

  const result = await pool.query(
    `UPDATE artist
     SET name = $1, image = $2, bio = $3, follower_count = $4
     WHERE id = $5
     RETURNING *`,
    [name, image, data.bio || data.introduction || null, followerCount, id]
  );

  return result.rows[0];
}

export async function deleteArtist(artistId) {
  const id = normalizeId(artistId);
  if (!id) {
    const error = new Error('ID nghệ sĩ không hợp lệ.');
    error.status = 400;
    throw error;
  }

  const albumResult = await pool.query('SELECT id FROM album WHERE artist_id = $1 LIMIT 1', [id]);
  if (albumResult.rows[0]) {
    const error = new Error('Không thể xóa nghệ sĩ đang có album. Vui lòng xóa hoặc chuyển album trước.');
    error.status = 400;
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM artist_song WHERE artist_id = $1', [id]);
    await client.query('DELETE FROM artist_follow WHERE artist_id = $1', [id]);
    const result = await client.query('DELETE FROM artist WHERE id = $1 RETURNING id', [id]);
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getUsers() {
  await ensureUserRoleColumn();

  const emailColumn = await pool.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user'
      AND column_name = 'email'
  `);
  const emailSelect = emailColumn.rows[0] ? 'email' : 'NULL::text AS email';

  const result = await pool.query(`
    SELECT id, username, ${emailSelect}, role
    FROM "user"
    ORDER BY id DESC
  `);

  return result.rows;
}

export async function updateUserRole(actorUserId, targetUserId, nextRole) {
  await ensureUserRoleColumn();

  const targetId = normalizeId(targetUserId);
  const actorId = normalizeId(actorUserId);

  if (!targetId || !VALID_USER_ROLES.includes(nextRole)) {
    const error = new Error('Dữ liệu phân quyền không hợp lệ.');
    error.status = 400;
    throw error;
  }

  const targetResult = await pool.query('SELECT id, role FROM "user" WHERE id = $1', [targetId]);
  const targetUser = targetResult.rows[0];

  if (!targetUser) {
    const error = new Error('Không tìm thấy user.');
    error.status = 404;
    throw error;
  }

  if (targetUser.role === 'super_admin') {
    const error = new Error('Không được thay đổi quyền tài khoản super_admin.');
    error.status = 403;
    throw error;
  }

  if (actorId === targetId) {
    const error = new Error('Không được tự thay đổi quyền của chính mình.');
    error.status = 403;
    throw error;
  }

  const result = await pool.query(
    'UPDATE "user" SET role = $1 WHERE id = $2 RETURNING id, username, NULL::text AS email, role',
    [nextRole, targetId]
  );

  return result.rows[0];
}
