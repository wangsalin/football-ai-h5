ALTER TABLE "User" ADD COLUMN "username" TEXT;
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
