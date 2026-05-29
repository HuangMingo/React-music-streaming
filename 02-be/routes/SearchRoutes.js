import express from 'express';
import { SearchController } from './../controllers/SearchController.js';

const router = express.Router();

// Suggest realtime khi user đang gõ
router.get('/suggest', SearchController.suggest);

// Full search result page
router.get('/all', SearchController.searchAll);

export default router;