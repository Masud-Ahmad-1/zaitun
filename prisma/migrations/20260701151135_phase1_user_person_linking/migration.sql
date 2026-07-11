-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'member',
    "locale" TEXT NOT NULL DEFAULT 'en',
    "birthDate" TEXT,
    "gender" TEXT,
    "bio" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FamilyTree" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "inviteCode" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FamilyTree_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FamilyTreeMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "treeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FamilyTreeMember_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "FamilyTree" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FamilyTreeMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "treeId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "gender" TEXT,
    "birthDate" TEXT,
    "deathDate" TEXT,
    "photo" TEXT,
    "bio" TEXT,
    "occupation" TEXT,
    "isDeceased" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT,
    "contributedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Person_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "FamilyTree" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Person_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Relationship" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "treeId" TEXT NOT NULL,
    "person1Id" TEXT NOT NULL,
    "person2Id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Relationship_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "FamilyTree" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Relationship_person1Id_fkey" FOREIGN KEY ("person1Id") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Relationship_person2Id_fkey" FOREIGN KEY ("person2Id") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DiaryEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "treeId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "privacy" TEXT NOT NULL DEFAULT 'family',
    "tags" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DiaryEntry_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "FamilyTree" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DiaryEntry_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProfileClaim" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personId" TEXT NOT NULL,
    "treeId" TEXT NOT NULL,
    "claimantId" TEXT NOT NULL,
    "relationship" TEXT,
    "evidence" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewerId" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProfileClaim_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProfileClaim_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "FamilyTree" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProfileClaim_claimantId_fkey" FOREIGN KEY ("claimantId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProfileClaim_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProfileClaimWitness" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "claimId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProfileClaimWitness_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "ProfileClaim" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProfileClaimWitness_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyTree_inviteCode_key" ON "FamilyTree"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyTreeMember_treeId_userId_key" ON "FamilyTreeMember"("treeId", "userId");

-- CreateIndex
CREATE INDEX "Person_treeId_idx" ON "Person"("treeId");

-- CreateIndex
CREATE INDEX "Person_userId_idx" ON "Person"("userId");

-- CreateIndex
CREATE INDEX "Relationship_treeId_idx" ON "Relationship"("treeId");

-- CreateIndex
CREATE UNIQUE INDEX "Relationship_person1Id_person2Id_type_key" ON "Relationship"("person1Id", "person2Id", "type");

-- CreateIndex
CREATE INDEX "DiaryEntry_treeId_personId_idx" ON "DiaryEntry"("treeId", "personId");

-- CreateIndex
CREATE INDEX "DiaryEntry_treeId_date_idx" ON "DiaryEntry"("treeId", "date");

-- CreateIndex
CREATE INDEX "ProfileClaim_personId_idx" ON "ProfileClaim"("personId");

-- CreateIndex
CREATE INDEX "ProfileClaim_claimantId_idx" ON "ProfileClaim"("claimantId");

-- CreateIndex
CREATE INDEX "ProfileClaim_status_idx" ON "ProfileClaim"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileClaimWitness_claimId_userId_key" ON "ProfileClaimWitness"("claimId", "userId");
