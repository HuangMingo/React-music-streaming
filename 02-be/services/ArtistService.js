import { pool } from '../config/dbpg.js';

function createArtistSlug(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\u0111/g, 'd')
        .replace(/\u0110/g, 'D')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

async function findArtistBySlug(slug) {
    const result = await pool.query(`
        SELECT *
        FROM artist
        ORDER BY follower_count DESC NULLS LAST, name ASC
    `);

    return result.rows.find((artist) => createArtistSlug(artist.name) === slug) ?? null;
}

const getArtistBySlug = async (slug) => {
    return findArtistBySlug(slug);
};

async function optionalArtistQuery(label, query, params) {
    try {
        const result = await pool.query(query, params);
        return result.rows;
    } catch (error) {
        console.error(`Load artist ${label} failed:`, error.message);
        return [];
    }
}

async function ensureArtistFollowUnique() {
    // Đảm bảo mỗi user chỉ follow một artist một lần, đồng thời hỗ trợ ON CONFLICT.
    await pool.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS artist_follow_user_artist_unique
        ON artist_follow (user_id, artist_id)
    `);
}
//Lấy toàn bộ thông tin nghệ sĩ, bao gồm bài hát, 
// album, playlist và nghệ sĩ liên quan
const getArtistDetailBySlug = async (slug, userId = null) => {
    const artist = await findArtistBySlug(slug);
    if (!artist) {
        return null;
    }

    const [songs, albums, playlists, relatedArtists] = await Promise.all([
        // Lấy bài hát có sự tham gia của nghệ sĩ
        optionalArtistQuery(
            'songs',
            `
            SELECT 
                s.*,
                json_agg(art.name ORDER BY art.name) AS artist_names
            FROM song s
            JOIN artist_song ars ON ars.song_id = s.id
            JOIN artist art ON art.id = ars.artist_id
            WHERE EXISTS (
                SELECT 1
                FROM artist_song target_ars
                WHERE target_ars.song_id = s.id
                    AND target_ars.artist_id = $1
            )
            GROUP BY s.id
            ORDER BY s.play_count DESC NULLS LAST, s.id ASC
            `,
            [artist.id]
        ),
    //Lấy album của nghệ sĩ
        optionalArtistQuery(
            'albums',
            `
            SELECT
                al.*,
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
                            'artist_names', ARRAY[$2::text]
                        )
                        ORDER BY s.track_number NULLS LAST, s.id ASC
                    ) FILTER (WHERE s.id IS NOT NULL),
                    '[]'::json
                ) AS songs
            FROM album al
            LEFT JOIN song s ON s.album_id = al.id
            WHERE al.artist_id = $1
            GROUP BY al.id
            ORDER BY al.release_date DESC NULLS LAST, al.id DESC
            `,
            [artist.id, artist.name]
        ),
        //Lấy playlist có chứa bài hát của nghệ sĩ (chỉ playlist công khai)
        optionalArtistQuery(
            'playlists',
            `
            WITH song_artists AS (
                SELECT 
                    ars.song_id,
                    json_agg(art.name ORDER BY art.name) AS artist_names
                FROM artist_song ars
                JOIN artist art ON art.id = ars.artist_id
                GROUP BY ars.song_id
            )
            SELECT
                p.id,
                p.name AS playlist_name,
                p.creator_id,
                u.username,
                p.image AS playlist_image,
                p.isdefault,
                p.ispublic,
                COUNT(DISTINCT s.id)::int AS song_count,
                COALESCE(
                    json_agg(
                        DISTINCT jsonb_build_object(
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
                    ) FILTER (WHERE s.id IS NOT NULL),
                    '[]'::json
                ) AS songs
            FROM playlist p
            JOIN "user" u ON u.id = p.creator_id
            JOIN song_playlist sp ON sp.playlist_id = p.id
            JOIN song s ON s.id = sp.song_id
            JOIN artist_song ars ON ars.song_id = s.id
            LEFT JOIN song_artists sa ON sa.song_id = s.id
            WHERE p.ispublic = TRUE and exists(
                SELECT 1
                FROM artist_song ars2 join song_playlist sp2 on sp2.song_id = ars2.song_id
                WHERE ars2.artist_id = $1 AND sp2.playlist_id = p.id
            )
            GROUP BY p.id, p.name, p.creator_id, u.username, p.image, p.isdefault, p.ispublic
            ORDER BY song_count DESC, p.id DESC
            LIMIT 12
            `,
            [artist.id]
        ),
        optionalArtistQuery(
            'related artists',
            `
            SELECT 
                related.*,
                COUNT(DISTINCT shared.song_id)::int AS shared_song_count,
                COUNT(DISTINCT af.user_id)::int AS "followersCount"
            FROM artist_song base
            JOIN artist_song shared ON shared.song_id = base.song_id
                AND shared.artist_id <> base.artist_id
            JOIN artist related ON related.id = shared.artist_id
            LEFT JOIN artist_follow af ON af.artist_id = related.id
            WHERE base.artist_id = $1
            GROUP BY related.id
            ORDER BY shared_song_count DESC, "followersCount" DESC, related.name ASC
            LIMIT 12
            `,
            [artist.id]
        ),
    ]);

    // Trả kèm trạng thái follow và số follower để frontend không phải tự suy đoán.
    const [isFollowing, followersCount] = await Promise.all([
        userId ? isFollowingArtist(userId, artist.id) : false,
        getArtistFollowersCount(artist.id),
    ]);

    return {
        ...artist,
        followersCount,
        isFollowing,
        songs,
        albums,
        playlists,
        relatedArtists,
    };
};

const followArtist = async (userId, artistId) => {
    await ensureArtistFollowUnique();
    // ON CONFLICT giúp bấm follow nhiều lần không tạo dữ liệu trùng.
    await pool.query(`
        INSERT INTO artist_follow (user_id, artist_id, created_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (user_id, artist_id) DO NOTHING
    `, [userId, artistId]);
    await pool.query(`
        UPDATE artist
        SET follower_count = follower_count + 1
        WHERE id = $1
    `, [artistId]);
    return {
        isFollowing: true,
        followersCount: await getArtistFollowersCount(artistId),
    };
};

const unfollowArtist = async (userId, artistId) => {
    await ensureArtistFollowUnique();
    // Xóa bản ghi follow nếu tồn tại; không có bản ghi thì DELETE không gây lỗi.
    await pool.query(`
        DELETE FROM artist_follow
        WHERE user_id = $1 AND artist_id = $2
    `, [userId, artistId]);
    await pool.query(`
        UPDATE artist
        SET follower_count = GREATEST(follower_count - 1, 0)
        WHERE id = $1
    `, [artistId]);
    return {
        isFollowing: false,
        followersCount: await getArtistFollowersCount(artistId),
    };
};

const isFollowingArtist = async (userId, artistId) => {
    await ensureArtistFollowUnique();
    // Chỉ cần kiểm tra tồn tại nên SELECT 1 và LIMIT 1 là đủ.
    const result = await pool.query(`
        SELECT 1
        FROM artist_follow
        WHERE user_id = $1 AND artist_id = $2
        LIMIT 1
    `, [userId, artistId]);

    return result.rows.length > 0;
};

const getArtistFollowersCount = async (artistId) => {
    await ensureArtistFollowUnique();
    // Count luôn lấy từ artist_follow để đồng bộ với dữ liệu follow thật.
    const result = await pool.query(`
        SELECT COUNT(*)::int AS followers_count
        FROM artist_follow
        WHERE artist_id = $1
    `, [artistId]);

    return Number(result.rows[0]?.followers_count) || 0;
};

const toggleFollowArtist = async (userId, artistId) => {
    // Tái sử dụng follow/unfollow để mọi nhánh đều trả về cùng shape dữ liệu.
    const isFollowing = await isFollowingArtist(userId, artistId);
    return isFollowing
        ? unfollowArtist(userId, artistId)
        : followArtist(userId, artistId);
};
//Lấy danh sách nghệ sĩ đã follow
const getFollowedArtistsByUserId = async (userId) => {
    const result = await pool.query(`
        SELECT a.*
        FROM artist a
        JOIN artist_follow af ON af.artist_id = a.id
        WHERE af.user_id = $1
        ORDER BY a.follower_count DESC NULLS LAST, a.name ASC
    `, [userId]);

    return result.rows;
};
export const artistService = {
    getArtistBySlug,
    getArtistDetailBySlug,
    followArtist,
    unfollowArtist,
    isFollowingArtist,
    getArtistFollowersCount,
    toggleFollowArtist,
    getFollowedArtistsByUserId,
};
