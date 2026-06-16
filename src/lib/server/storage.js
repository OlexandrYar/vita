import path from 'path';

export const DATA_FILE = path.resolve(process.env.DATA_DIR ?? 'data', 'plants.json');
export const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR ?? 'uploads');
