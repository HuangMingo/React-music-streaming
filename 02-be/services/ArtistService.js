import { pool } from '../config/dbpg.js';

const getArtistBySlug = async (slug) => {
    const result = await pool.query(
        `
        SELECT *
        FROM artist
        WHERE slug = $1
        `,
        [slug]
    );

    return result.rows[0];
};

const getArtistDetailBySlug = async (slug, userId) => {
    const result = await pool.query(
        `
        SELECT 
            a.*,
            COUNT(af.user_id)::int AS "followersCount",
            EXISTS (
                SELECT 1
                FROM artist_follow af2
                WHERE af2.artist_id = a.id
                    AND af2.user_id = $2
            ) AS "isFollowing"
        FROM artist a
        LEFT JOIN artist_follow af ON af.artist_id = a.id
        WHERE a.slug = $1
        GROUP BY a.id
        `,
        [slug, userId ?? null]
    );

    return result.rows[0];
};

export const artistService = {
    getArtistBySlug,
    getArtistDetailBySlug,
};
