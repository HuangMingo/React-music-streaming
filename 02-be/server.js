import express from 'express';
import { executeQuery } from './config/db.js';

const app = express();
const PORT = process.env.BE_PORT || 4000;

app.get('/', (req, res) => {
	res.send('02-be server is running');
});

app.get('/api/db-test', async (req, res) => {
	try {
		const result = await executeQuery("select 123 as numberValue, 'hello world' as message");
		res.json({
			success: true,
			rowCount: result.rowCount,
			rows: result.rows
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			error: error.message
		});
	}
});

app.listen(PORT, () => {
	console.log(`Backend running at http://localhost:${PORT}`);
});
