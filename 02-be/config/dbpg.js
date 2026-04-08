import pg from 'pg';
const {Pool} = pg;
export const pool = new Pool({
  host: "localhost",
  user:"postgres",
  port: 5432,
  password: "minh1200",
  database: "music_db"
});


