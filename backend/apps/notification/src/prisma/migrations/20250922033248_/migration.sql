-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('System', 'Chat');

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
