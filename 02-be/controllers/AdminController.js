import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import * as adminService from '../services/AdminService.js';

const uploadsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'uploads', 'admin');

function sendSuccess(res, data, message = 'Thành công.') {
  res.json({ success: true, message, data });
}

function sendError(res, error) {
  console.error('Admin API error:', error);
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Đã xảy ra lỗi khi xử lý yêu cầu.',
  });
}

function parseMultipartBody(req) {
  const contentType = req.headers['content-type'] || '';
  const boundary = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/)?.[1]
    || contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/)?.[2];

  if (!boundary || !Buffer.isBuffer(req.body)) {
    return { fields: req.body || {}, files: {} };
  }

  const fields = {};
  const files = {};
  const parts = req.body.toString('latin1').split(`--${boundary}`);

  for (const part of parts) {
    if (!part || part === '--\r\n' || part === '--') {
      continue;
    }

    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) {
      continue;
    }

    const header = part.slice(0, headerEnd);
    let content = part.slice(headerEnd + 4);
    if (content.endsWith('\r\n')) {
      content = content.slice(0, -2);
    }

    const name = header.match(/name="([^"]+)"/)?.[1];
    const filename = header.match(/filename="([^"]*)"/)?.[1];
    const mimeType = header.match(/Content-Type:\s*([^\r\n]+)/i)?.[1] || 'application/octet-stream';

    if (!name) {
      continue;
    }

    if (filename) {
      files[name] = {
        filename,
        mimeType,
        buffer: Buffer.from(content, 'latin1'),
      };
    } else {
      fields[name] = Buffer.from(content, 'latin1').toString('utf8');
    }
  }

  return { fields, files };
}

async function uploadToCloudinary(file, resourceType) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'music-admin';
  const signature = crypto
    .createHash('sha1')
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest('hex');
  const formData = new FormData();

  formData.append('file', new Blob([file.buffer], { type: file.mimeType }), file.filename);
  formData.append('api_key', apiKey);
  formData.append('timestamp', String(timestamp));
  formData.append('folder', folder);
  formData.append('signature', signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
    method: 'POST',
    body: formData,
  });
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error?.message || 'Không thể upload file lên Cloudinary.');
    error.status = 500;
    throw error;
  }

  return data.secure_url;
}

async function storeUploadedFile(req, file, resourceType) {
  if (!file) {
    return null;
  }

  const cloudinaryUrl = await uploadToCloudinary(file, resourceType);
  if (cloudinaryUrl) {
    return cloudinaryUrl;
  }

  await fs.mkdir(uploadsDir, { recursive: true });
  const safeName = file.filename.replace(/[^a-zA-Z0-9._-]/g, '-');
  const filename = `${Date.now()}-${crypto.randomUUID()}-${safeName}`;
  const filepath = path.join(uploadsDir, filename);
  await fs.writeFile(filepath, file.buffer);

  return `${req.protocol}://${req.get('host')}/uploads/admin/${filename}`;
}

function getMp3DurationSeconds(buffer) {
  let offset = 0;

  if (buffer.slice(0, 3).toString('utf8') === 'ID3' && buffer.length > 10) {
    const size = ((buffer[6] & 0x7f) << 21) | ((buffer[7] & 0x7f) << 14) | ((buffer[8] & 0x7f) << 7) | (buffer[9] & 0x7f);
    offset = size + 10;
  }

  const bitrates = {
    1: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
    2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
  };
  const sampleRates = {
    0: [44100, 48000, 32000],
    2: [22050, 24000, 16000],
    3: [11025, 12000, 8000],
  };
  let seconds = 0;

  while (offset + 4 < buffer.length) {
    if (buffer[offset] !== 0xff || (buffer[offset + 1] & 0xe0) !== 0xe0) {
      offset += 1;
      continue;
    }

    const versionBits = (buffer[offset + 1] >> 3) & 0x03;
    const layerBits = (buffer[offset + 1] >> 1) & 0x03;
    const bitrateIndex = (buffer[offset + 2] >> 4) & 0x0f;
    const sampleRateIndex = (buffer[offset + 2] >> 2) & 0x03;
    const padding = (buffer[offset + 2] >> 1) & 0x01;

    if (versionBits === 1 || layerBits !== 1 || bitrateIndex === 0 || bitrateIndex === 15 || sampleRateIndex === 3) {
      offset += 1;
      continue;
    }

    const isMpeg1 = versionBits === 3;
    const bitrate = (bitrates[isMpeg1 ? 1 : 2][bitrateIndex] || 0) * 1000;
    const sampleRate = sampleRates[versionBits]?.[sampleRateIndex] || 0;

    if (!bitrate || !sampleRate) {
      offset += 1;
      continue;
    }

    const samplesPerFrame = isMpeg1 ? 1152 : 576;
    const frameLength = Math.floor(((isMpeg1 ? 144 : 72) * bitrate) / sampleRate + padding);
    seconds += samplesPerFrame / sampleRate;
    offset += Math.max(frameLength, 1);
  }

  return seconds > 0 ? Math.round(seconds) : null;
}

export async function getOverview(req, res) {
  try {
    sendSuccess(res, await adminService.getOverview());
  } catch (error) {
    sendError(res, error);
  }
}

export async function getSongs(req, res) {
  try {
    sendSuccess(res, await adminService.getSongs());
  } catch (error) {
    sendError(res, error);
  }
}

export async function createSong(req, res) {
  try {
    const { fields, files } = parseMultipartBody(req);
    const data = { ...fields };

    if (files.audio) {
      data.audio = await storeUploadedFile(req, files.audio, 'video');
      data.duration_seconds = getMp3DurationSeconds(files.audio.buffer);
    }
    if (files.image) {
      data.image = await storeUploadedFile(req, files.image, 'image');
    }
    if (files.lyrics) {
      data.lyrics = await storeUploadedFile(req, files.lyrics, 'raw');
    }

    sendSuccess(res, await adminService.createSong(data), 'Đã thêm bài hát.');
  } catch (error) {
    sendError(res, error);
  }
}

export async function updateSong(req, res) {
  try {
    sendSuccess(res, await adminService.updateSong(req.params.id, req.body), 'Đã cập nhật bài hát.');
  } catch (error) {
    sendError(res, error);
  }
}

export async function deleteSong(req, res) {
  try {
    sendSuccess(res, await adminService.deleteSong(req.params.id), 'Đã xóa bài hát.');
  } catch (error) {
    sendError(res, error);
  }
}

export async function getAlbums(req, res) {
  try {
    sendSuccess(res, await adminService.getAlbums());
  } catch (error) {
    sendError(res, error);
  }
}

export async function createAlbum(req, res) {
  try {
    sendSuccess(res, await adminService.createAlbum(req.body), 'Đã thêm album.');
  } catch (error) {
    sendError(res, error);
  }
}

export async function updateAlbum(req, res) {
  try {
    sendSuccess(res, await adminService.updateAlbum(req.params.id, req.body), 'Đã cập nhật album.');
  } catch (error) {
    sendError(res, error);
  }
}

export async function deleteAlbum(req, res) {
  try {
    sendSuccess(res, await adminService.deleteAlbum(req.params.id), 'Đã xóa album.');
  } catch (error) {
    sendError(res, error);
  }
}

export async function getArtists(req, res) {
  try {
    sendSuccess(res, await adminService.getArtists());
  } catch (error) {
    sendError(res, error);
  }
}

export async function createArtist(req, res) {
  try {
    sendSuccess(res, await adminService.createArtist(req.body), 'Đã thêm nghệ sĩ.');
  } catch (error) {
    sendError(res, error);
  }
}

export async function updateArtist(req, res) {
  try {
    sendSuccess(res, await adminService.updateArtist(req.params.id, req.body), 'Đã cập nhật nghệ sĩ.');
  } catch (error) {
    sendError(res, error);
  }
}

export async function deleteArtist(req, res) {
  try {
    sendSuccess(res, await adminService.deleteArtist(req.params.id), 'Đã xóa nghệ sĩ.');
  } catch (error) {
    sendError(res, error);
  }
}

export async function getSystemPlaylists(req, res) {
  try {
    sendSuccess(res, await adminService.getSystemPlaylists());
  } catch (error) {
    sendError(res, error);
  }
}

export async function createSystemPlaylist(req, res) {
  try {
    sendSuccess(res, await adminService.createSystemPlaylist(req.body, req.authUser.id), 'Đã thêm playlist hệ thống.');
  } catch (error) {
    sendError(res, error);
  }
}

export async function updateSystemPlaylist(req, res) {
  try {
    sendSuccess(res, await adminService.updateSystemPlaylist(req.params.id, req.body), 'Đã cập nhật playlist hệ thống.');
  } catch (error) {
    sendError(res, error);
  }
}

export async function deleteSystemPlaylist(req, res) {
  try {
    sendSuccess(res, await adminService.deleteSystemPlaylist(req.params.id), 'Đã xóa playlist hệ thống.');
  } catch (error) {
    sendError(res, error);
  }
}

export async function getUsers(req, res) {
  try {
    sendSuccess(res, await adminService.getUsers());
  } catch (error) {
    sendError(res, error);
  }
}

export async function updateUserRole(req, res) {
  try {
    sendSuccess(
      res,
      await adminService.updateUserRole(req.authUser.id, req.params.id, req.body.role),
      'Đã cập nhật quyền user.'
    );
  } catch (error) {
    sendError(res, error);
  }
}
