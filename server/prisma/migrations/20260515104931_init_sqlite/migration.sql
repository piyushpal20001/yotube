-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GoogleToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiryDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GoogleToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GoogleAdsAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "descriptiveName" TEXT,
    "isManager" BOOLEAN NOT NULL DEFAULT false,
    "managerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GoogleAdsAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "googleCampaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "budgetMicros" BIGINT NOT NULL,
    "accountId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Campaign_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "GoogleAdsAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "googleAdGroupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdGroup_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Keyword" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "googleKeywordId" TEXT,
    "text" TEXT NOT NULL,
    "matchType" TEXT NOT NULL,
    "adGroupId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Keyword_adGroupId_fkey" FOREIGN KEY ("adGroupId") REFERENCES "AdGroup" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ad" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "googleAdId" TEXT,
    "headline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "adGroupId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Ad_adGroupId_fkey" FOREIGN KEY ("adGroupId") REFERENCES "AdGroup" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleToken_userId_key" ON "GoogleToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleAdsAccount_customerId_key" ON "GoogleAdsAccount"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_googleCampaignId_key" ON "Campaign"("googleCampaignId");

-- CreateIndex
CREATE UNIQUE INDEX "AdGroup_googleAdGroupId_key" ON "AdGroup"("googleAdGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "Keyword_googleKeywordId_key" ON "Keyword"("googleKeywordId");

-- CreateIndex
CREATE UNIQUE INDEX "Ad_googleAdId_key" ON "Ad"("googleAdId");
