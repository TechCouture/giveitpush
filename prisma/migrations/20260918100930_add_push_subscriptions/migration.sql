-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "PushSubscription_shop_idx" ON "PushSubscription"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_shop_endpoint_key" ON "PushSubscription"("shop", "endpoint");
