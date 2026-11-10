-- AlterTable
ALTER TABLE "course_materials" ADD COLUMN     "driveFileId" TEXT;

-- AlterTable
ALTER TABLE "recordings" ADD COLUMN     "driveFileId" TEXT,
ADD COLUMN     "previewUrl" TEXT;
