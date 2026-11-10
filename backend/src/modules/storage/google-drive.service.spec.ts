import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GoogleDriveService } from './google-drive.service.js';

describe('GoogleDriveService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('should initialize as not configured if credentials are missing', () => {
    delete process.env.GOOGLE_DRIVE_CLIENT_ID;
    delete process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    delete process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
    delete process.env.GOOGLE_DRIVE_FOLDER_ID;

    const service = new GoogleDriveService();
    expect(service.isConfigured()).toBe(false);
  });

  it('should reject upload when not configured', async () => {
    delete process.env.GOOGLE_DRIVE_CLIENT_ID;
    const service = new GoogleDriveService();

    const mockFile: any = {
      filename: 'sample.mp4',
      size: 1024,
      mimetype: 'video/mp4',
      buffer: Buffer.from('test video content'),
    };

    await expect(service.uploadFile(mockFile)).rejects.toThrow(
      'Google Drive service is not configured',
    );
  });

  it('should return false when deleting without configuration', async () => {
    delete process.env.GOOGLE_DRIVE_CLIENT_ID;
    const service = new GoogleDriveService();

    const result = await service.deleteFile('some-id');
    expect(result).toBe(false);
  });

  it('should handle configured uploadFile with buffer and permissions creation', async () => {
    process.env.GOOGLE_DRIVE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_DRIVE_CLIENT_SECRET = 'test-client-secret';
    process.env.GOOGLE_DRIVE_REFRESH_TOKEN = 'test-refresh-token';
    process.env.GOOGLE_DRIVE_FOLDER_ID = 'test-folder-id';

    const service = new GoogleDriveService();

    const mockFilesCreate = vi.fn().mockResolvedValue({
      data: {
        id: 'new-drive-file-123',
        name: 'sample.mp4',
        webViewLink: 'https://drive.google.com/file/d/new-drive-file-123/view',
        webContentLink: 'https://drive.google.com/uc?id=new-drive-file-123&export=download',
        size: '1024',
      },
    });

    const mockFilesList = vi.fn().mockResolvedValue({
      data: {
        files: [{ id: 'subfolder-id-777', name: 'Recordings' }],
      },
    });

    const mockPermissionsCreate = vi.fn().mockResolvedValue({
      data: { id: 'perm-id-1' },
    });

    // Inject mock drive client directly
    (service as any).drive = {
      files: {
        create: mockFilesCreate,
        list: mockFilesList,
        delete: vi.fn().mockResolvedValue({}),
      },
      permissions: {
        create: mockPermissionsCreate,
      },
    };
    (service as any).configured = true;

    const mockFile: any = {
      filename: 'sample.mp4',
      size: 1024,
      mimetype: 'video/mp4',
      buffer: Buffer.from('test video content'),
    };

    const result = await service.uploadFile(mockFile, 'Recordings');

    expect(result).toBeDefined();
    expect(result.fileId).toBe('new-drive-file-123');
    expect(result.previewUrl).toBe('https://drive.google.com/file/d/new-drive-file-123/preview');
    expect(result.webViewLink).toContain('new-drive-file-123');
    expect(result.sizeBytes).toBe(1024);
    expect(mockPermissionsCreate).toHaveBeenCalledWith({
      fileId: 'new-drive-file-123',
      requestBody: { role: 'reader', type: 'anyone' },
    });
  });

  it('should delete file successfully when drive is configured', async () => {
    process.env.GOOGLE_DRIVE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_DRIVE_CLIENT_SECRET = 'test-client-secret';
    process.env.GOOGLE_DRIVE_REFRESH_TOKEN = 'test-refresh-token';
    process.env.GOOGLE_DRIVE_FOLDER_ID = 'test-folder-id';

    const service = new GoogleDriveService();

    const mockFilesDelete = vi.fn().mockResolvedValue({});
    (service as any).drive = {
      files: {
        delete: mockFilesDelete,
      },
    };
    (service as any).configured = true;

    const success = await service.deleteFile('file-to-delete-456');
    expect(success).toBe(true);
    expect(mockFilesDelete).toHaveBeenCalledWith({ fileId: 'file-to-delete-456' });
  });
});
