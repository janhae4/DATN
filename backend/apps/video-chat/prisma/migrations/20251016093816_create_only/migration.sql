/*
  Warnings:

  - Added the required column `roomId` to the `Call` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Call" ADD COLUMN     "roomId" TEXT NOT NULL;
