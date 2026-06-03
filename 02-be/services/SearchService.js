import { pool } from '../config/dbpg.js';

const EMPTY_RESULT = {
    songs: [],
    artists: [],
    playlists: [],
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
            AND ($3::int IS NULL OR p.creator_id != $3)
        ORDER BY name ASC
        LIMIT $2
        `,
        [like, limit, userId ?? null]
    );

    return result.rows;
}
// ------------------TÌM KIẾM THEO TỪ KHÓA----------------
async function searchByKeyword(q, limits, userId) {
    const keyword = q?.trim();

    if (!keyword) {
        return EMPTY_RESULT;
    }

    const like = `%${keyword}%`;

    const [songs, artists, playlists] = await Promise.all([
        searchSongs(like, limits.songs),
        searchArtists(like, limits.artists),
        searchPlaylists(like, limits.playlists, userId)
    ]);
    return {
        songs,
        artists,
        playlists,
    };
}

const suggest = async (q, userId) => {
    return searchByKeyword(q, {
        songs: 5,
        artists: 3,
        playlists: 3,
    }, userId);
};

const searchAll = async (q, userId) => {
    return searchByKeyword(q, {
        songs: 50,
        artists: 50,
        playlists: 50,
    }, userId);
};

export const searchService = {
    suggest,
    searchAll,
};
