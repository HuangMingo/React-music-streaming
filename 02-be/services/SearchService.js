import { pool } from '../config/dbpg.js';

const EMPTY_RESULT = {
    songs: [],
    artists: [],
    playlists: [],
    albums: [],
};

const songSelectWithArtists = `
    SELECT 
            s.*,
            json_agg(art.name) AS artist_names
        FROM artist_song ars
            JOIN artist art ON art.id = ars.artist_id
            RIGHT JOIN song s ON ars.song_id = s.id
`;

async function searchSongs(like, limit) {
    const result = await pool.query(
        `
        ${songSelectWithArtists}
        WHERE unaccent(s.title) ILIKE unaccent($1)
        GROUP BY s.id
        ORDER BY s.play_count DESC NULLS LAST, s.title ASC
        LIMIT $2
        `,
        [like, limit]
    );

    return result.rows;
}

async function searchArtists(like, limit) {
    const result = await pool.query(
        `
        SELECT
            artist.*,
            -- Trả count từ artist_follow để SearchResults dùng cùng dữ liệu với ArtistDetail.
            (
                SELECT COUNT(*)::int
                FROM artist_follow af
                WHERE af.artist_id = artist.id
            ) AS "followersCount"
        FROM artist
        WHERE unaccent(name) ILIKE unaccent($1)
        ORDER BY name ASC
        LIMIT $2
        `,
        [like, limit]
    );

    return result.rows;
}
//----------TÌM KIẾM PLAYLIST CÔNG KHAI----------------
async function searchPlaylists(like, limit, userId) {
    const result = await pool.query(
        `
        SELECT p.*, u.username
        FROM playlist p join "user"  u on p.creator_id = u.id
        WHERE unaccent(name) ILIKE unaccent($1) and ispublic = TRUE
             issystem = TRUE
        ORDER BY name ASC
        LIMIT $2
        `,
        [like, limit, userId ?? null]
    );

    return result.rows;
}
// ------------------TÌM KIẾM THEO TỪ KHÓA----------------
async function searchAlbums(like, limit) {
    const result = await pool.query(
        `
        WITH song_artists AS (
            SELECT 
                ars.song_id,
                json_agg(art.name) AS artist_names
            FROM artist_song ars
            JOIN artist art ON art.id = ars.artist_id
            GROUP BY ars.song_id
        )
        SELECT
            al.id,
            al.title,
            al.image,
            al.release_date,
            al.artist_id,
            art.name AS artist_name,
            COUNT(s.id)::int AS song_count,
            COALESCE(
                json_agg(
                    json_build_object(
                        'id', s.id,
                        'title', s.title,
                        'album_id', s.album_id,
                        'duration_seconds', s.duration_seconds,
                        'track_number', s.track_number,
                        'release_date', s.release_date,
                        'lyrics', s.lyrics,
                        'audio', s.audio,
                        'image', s.image,
                        'artist_names', sa.artist_names
                    )
                    ORDER BY s.track_number NULLS LAST, s.id
                ) FILTER (WHERE s.id IS NOT NULL), '[]'::json
            ) AS songs
        FROM album al
        LEFT JOIN artist art ON art.id = al.artist_id
        LEFT JOIN song s ON s.album_id = al.id
        LEFT JOIN song_artists sa ON sa.song_id = s.id
        WHERE unaccent(al.title) ILIKE unaccent($1)
        GROUP BY al.id, art.name
        ORDER BY al.title ASC
        LIMIT $2
        `,
        [like, limit]
    );

    return result.rows;
}

async function searchByKeyword(q, limits, userId) {
    const keyword = q?.trim();

    if (!keyword) {
        return EMPTY_RESULT;
    }

    const like = `%${keyword}%`;

    const [songs, artists, playlists, albums] = await Promise.all([
        searchSongs(like, limits.songs),
        searchArtists(like, limits.artists),
        searchPlaylists(like, limits.playlists, userId),
        searchAlbums(like, limits.albums),
    ]);
    return {
        songs,
        artists,
        playlists,
        albums,
    };
}
//------------------GỢI Ý TỪ KHÓA----------------
const suggest = async (q, userId) => {
    return searchByKeyword(q, {
        songs: 5,
        artists: 3,
        playlists: 3,
        albums: 3,
    }, userId);
};

const searchAll = async (q, userId) => {
    return searchByKeyword(q, {
        songs: 50,
        artists: 50,
        playlists: 50,
        albums: 50,
    }, userId);
};

export const searchService = {
    suggest,
    searchAll,
};
