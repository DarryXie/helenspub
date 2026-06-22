import { join, resolve } from 'node:path';

const DEFAULT_UPLOAD_DIR = join(process.cwd(), '..', '..', 'storage', 'uploads');
const DEFAULT_UPLOAD_BASE_URL = '/uploads';

export function getUploadRoot() {
  return resolve(process.env.UPLOAD_DIR || DEFAULT_UPLOAD_DIR);
}

export function getUploadBaseUrl() {
  const configured = process.env.UPLOAD_BASE_URL?.trim();

  if (!configured) {
    return DEFAULT_UPLOAD_BASE_URL;
  }

  return configured.startsWith('/') ? configured : `/${configured}`;
}
