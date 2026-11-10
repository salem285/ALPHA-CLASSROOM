import { Injectable, Logger } from '@nestjs/common';
import { google, type drive_v3 } from 'googleapis';
import { Readable } from 'node:stream';
import { existsSync, unlinkSync, createReadStream } from 'node:fs';

export interface DriveUploadResult {
  fileId: string;
  webViewLink: string;
  webContentLink: string;
  previewUrl: string;
  sizeBytes: number;
}

@Injectable()
export class GoogleDriveService {
  private readonly logger = new Logger(GoogleDriveService.name);
  private drive: drive_v3.Drive | null = null;
  private rootFolderId: string | null = null;
  private readonly folderCache = new Map<string, string>();
  private readonly configured: boolean = false;

  constructor() {
    const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID?.trim();
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET?.trim();
    const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN?.trim();
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID?.trim();

    if (clientId && clientSecret && refreshToken && folderId) {
      try {
        const oauth2Client = new google.auth.OAuth2(
          clientId,
          clientSecret,
          'https://developers.google.com/oauthplayground',
        );
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        this.drive = google.drive({ version: 'v3', auth: oauth2Client });
        this.rootFolderId = folderId;
        this.configured = true;
        this.logger.log(`Google Drive 5TB Storage successfully initialized with root folder: ${folderId}`);
      } catch (err) {
        this.logger.warn(`Failed to initialize Google Drive client: ${err}`);
      }
    } else {
      this.logger.log('Google Drive credentials not set. Falling back to local disk storage.');
    }
  }

  isConfigured(): boolean {
    return this.configured && this.drive !== null;
  }

  async getOrCreateSubfolder(subfolderName: string): Promise<string> {
    if (!this.isConfigured() || !this.drive || !this.rootFolderId) {
      throw new Error('Google Drive service is not configured');
    }

    if (this.folderCache.has(subfolderName)) {
      return this.folderCache.get(subfolderName)!;
    }

    try {
      const q = `'${this.rootFolderId}' in parents and name = '${subfolderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      const res = await this.drive.files.list({
        q,
        fields: 'files(id, name)',
        spaces: 'drive',
      });

      if (res.data.files && res.data.files.length > 0 && res.data.files[0].id) {
        const existingId = res.data.files[0].id;
        this.folderCache.set(subfolderName, existingId);
        return existingId;
      }

      const createRes = await this.drive.files.create({
        requestBody: {
          name: subfolderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [this.rootFolderId],
        },
        fields: 'id',
      });

      const newId = createRes.data.id;
      if (!newId) {
        throw new Error(`Failed to create subfolder ${subfolderName} on Google Drive`);
      }
      this.folderCache.set(subfolderName, newId);
      return newId;
    } catch (err) {
      this.logger.warn(`Error resolving Google Drive subfolder ${subfolderName}, using root folder:`, err);
      return this.rootFolderId;
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    subfolderName?: string,
  ): Promise<DriveUploadResult> {
    if (!this.isConfigured() || !this.drive) {
      throw new Error('Google Drive service is not configured');
    }

    let targetFolderId = this.rootFolderId;
    if (subfolderName) {
      targetFolderId = await this.getOrCreateSubfolder(subfolderName);
    }

    let fileStream: any;
    if (file.path && existsSync(file.path)) {
      fileStream = createReadStream(file.path);
      fileStream.on('error', (streamErr: any) => {
        this.logger.warn(`Stream read notice for ${file.path}: ${streamErr?.message || streamErr}`);
      });
    } else if (file.buffer) {
      fileStream = Readable.from(file.buffer);
    } else {
      throw new Error('No valid file stream or buffer provided for upload');
    }

    const driveFileName = file.filename || file.originalname || `upload-${Date.now()}`;

    const createRes = await this.drive.files.create({
      requestBody: {
        name: driveFileName,
        parents: targetFolderId ? [targetFolderId] : undefined,
      },
      media: {
        mimeType: file.mimetype || 'application/octet-stream',
        body: fileStream,
      },
      fields: 'id, name, webViewLink, webContentLink, size',
    });

    const fileId = createRes.data.id;
    if (!fileId) {
      throw new Error('Failed to obtain Google Drive file ID after upload');
    }

    // Set permission to anyone with link can view
    try {
      await this.drive.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
    } catch (permErr) {
      this.logger.warn(`Failed to set public reader permission on Drive file ${fileId}:`, permErr);
    }

    // Clean up local temp Multer file if it was on disk
    if (file.path && existsSync(file.path)) {
      try {
        unlinkSync(file.path);
      } catch (unlinkErr) {
        this.logger.warn(`Failed to unlink local Multer file ${file.path}:`, unlinkErr);
      }
    }

    const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
    const webViewLink = createRes.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;
    const webContentLink =
      createRes.data.webContentLink || `https://drive.google.com/uc?id=${fileId}&export=download`;
    const sizeBytes = Number(createRes.data.size || file.size || 0);

    return {
      fileId,
      webViewLink,
      webContentLink,
      previewUrl,
      sizeBytes,
    };
  }

  async deleteFile(fileId: string): Promise<boolean> {
    if (!this.isConfigured() || !this.drive || !fileId) {
      return false;
    }

    try {
      await this.drive.files.delete({ fileId });
      this.logger.log(`Google Drive file ${fileId} deleted successfully.`);
      return true;
    } catch (err: any) {
      this.logger.warn(`Failed to delete Google Drive file ${fileId}: ${err?.message || err}`);
      return false;
    }
  }
}
