import { PrismaClient } from '@prisma/client';
import { GoogleDriveService } from './dist/modules/storage/google-drive.service.js';
import { existsSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const prisma = new PrismaClient();

async function runStorageVerification() {
  console.log('--- Starting Storage & Google Drive Integration Verification ---');

  // Test 1: Service Fallback Behavior (Without credentials)
  console.log('1. Testing GoogleDriveService default unconfigured state...');
  const driveService = new GoogleDriveService();
  if (driveService.isConfigured()) {
    console.warn('  ⚠️ Unexpected: driveService is configured without env vars');
  } else {
    console.log('  ✅ GoogleDriveService correctly reports isConfigured() === false');
  }

  const deleteRes = await driveService.deleteFile('dummy-id');
  if (deleteRes === false) {
    console.log('  ✅ deleteFile correctly returns false without crashing when unconfigured');
  } else {
    throw new Error('deleteFile did not return false when unconfigured');
  }

  // Test 2: Service Configured Behavior (Mocked Drive Client)
  console.log('2. Testing GoogleDriveService upload with mocked drive client...');
  let permCreated = false;
  let fileCreated = false;

  const mockService = new GoogleDriveService();
  mockService.rootFolderId = 'mock-root-folder';
  mockService.configured = true;
  mockService.drive = {
    files: {
      create: async ({ requestBody, media }) => {
        fileCreated = true;
        return {
          data: {
            id: 'gdrive-test-12345',
            name: requestBody.name,
            webViewLink: 'https://drive.google.com/file/d/gdrive-test-12345/view',
            webContentLink: 'https://drive.google.com/uc?id=gdrive-test-12345&export=download',
            size: '5242880',
          },
        };
      },
      list: async () => ({
        data: { files: [{ id: 'mock-subfolder-rec', name: 'Recordings' }] },
      }),
      delete: async () => ({}),
    },
    permissions: {
      create: async ({ fileId, requestBody }) => {
        if (fileId === 'gdrive-test-12345' && requestBody.role === 'reader' && requestBody.type === 'anyone') {
          permCreated = true;
        }
        return { data: { id: 'perm-999' } };
      },
    },
  };

  // Create a temporary test file on disk
  const tempPath = join(process.cwd(), 'temp-test-upload.mp4');
  writeFileSync(tempPath, 'dummy video binary content');

  const mockMulterFile = {
    filename: 'temp-test-upload.mp4',
    originalname: 'temp-test-upload.mp4',
    path: tempPath,
    size: 27,
    mimetype: 'video/mp4',
  };

  const uploadResult = await mockService.uploadFile(mockMulterFile, 'Recordings');
  console.log('  Upload result:', uploadResult);

  if (uploadResult.fileId !== 'gdrive-test-12345') {
    throw new Error(`Expected fileId gdrive-test-12345, got ${uploadResult.fileId}`);
  }
  if (!uploadResult.previewUrl.includes('gdrive-test-12345/preview')) {
    throw new Error(`Invalid previewUrl: ${uploadResult.previewUrl}`);
  }
  if (!permCreated) {
    throw new Error('Public reader permission was not set');
  }
  if (existsSync(tempPath)) {
    throw new Error('Local temp file was not cleaned up after Drive upload');
  }
  console.log('  ✅ Mock Drive upload successfully set permissions, generated previewUrl, and cleaned up disk file');

  // Test 3: Database Schema & Migration Verification for Recording
  console.log('3. Verifying Prisma database schema and migrations...');
  const testCourse = await prisma.course.findFirst();
  if (!testCourse) {
    console.log('  ⚠️ No courses in DB to test DB insertion, creating dummy course...');
  }

  const courseId = testCourse ? testCourse.id : (await prisma.course.create({
    data: {
      title: 'Storage Test Course',
      code: 'TEST-STR-' + Date.now(),
      instructorId: (await prisma.user.findFirst({ where: { role: 'INSTRUCTOR' } })).id,
    },
  })).id;

  const testRec = await prisma.recording.create({
    data: {
      courseId,
      title: 'Drive Verification Recording',
      fileName: 'drive-rec.mp4',
      fileUrl: uploadResult.webViewLink,
      durationSeconds: 300,
      sizeBytes: BigInt(5242880),
      driveFileId: uploadResult.fileId,
      previewUrl: uploadResult.previewUrl,
    },
  });

  if (testRec.driveFileId !== 'gdrive-test-12345' || !testRec.previewUrl.includes('/preview')) {
    throw new Error('Recording model fields driveFileId or previewUrl were not persisted correctly');
  }
  console.log('  ✅ Recording model successfully persisted driveFileId and previewUrl');

  // Test 4: Database Schema & Migration Verification for CourseMaterial
  const testMat = await prisma.courseMaterial.create({
    data: {
      courseId,
      title: 'Drive Verification Material',
      fileName: 'drive-mat.pdf',
      fileUrl: uploadResult.webContentLink,
      fileType: 'PDF',
      sizeBytes: BigInt(1024),
      driveFileId: 'drive-mat-pdf-555',
    },
  });

  if (testMat.driveFileId !== 'drive-mat-pdf-555') {
    throw new Error('CourseMaterial model driveFileId was not persisted correctly');
  }
  console.log('  ✅ CourseMaterial model successfully persisted driveFileId');

  // Clean up DB test entries
  await prisma.recording.delete({ where: { id: testRec.id } });
  await prisma.courseMaterial.delete({ where: { id: testMat.id } });
  console.log('  ✅ Database cleanup complete');

  console.log('--- ALL STORAGE INTEGRATION VERIFICATIONS PASSED SUCCESSFULLY ---');
}

runStorageVerification()
  .catch((err) => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
