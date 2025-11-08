-- CreateEnum
CREATE TYPE "BodyStyle" AS ENUM ('SEDAN', 'SUV', 'CROSSOVER', 'HATCHBACK', 'PICKUP');

-- CreateEnum
CREATE TYPE "Drivetrain" AS ENUM ('FWD', 'RWD', 'AWD');

-- CreateEnum
CREATE TYPE "InsuranceTier" AS ENUM ('LOW', 'MODERATE', 'HIGH');

-- CreateEnum
CREATE TYPE "FitTag" AS ENUM ('DAILY_COMMUTE', 'SHARED_FAMILY', 'WEEKEND_ADVENTURE', 'ECO_CONSCIOUS');

-- CreateEnum
CREATE TYPE "ExtrasTag" AS ENUM ('AMERICAN_MADE', 'BRIGHT_COLOR', 'ECO_CONSCIOUS', 'HIGHER_SEATING');

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "trim" TEXT,
    "years" INTEGER[],
    "bodyStyle" "BodyStyle" NOT NULL,
    "drivetrain" "Drivetrain" NOT NULL,
    "msrpMin" INTEGER NOT NULL,
    "msrpMax" INTEGER NOT NULL,
    "insuranceTier" "InsuranceTier" NOT NULL,
    "fuelEconomyCity" INTEGER NOT NULL,
    "fuelEconomyHighway" INTEGER NOT NULL,
    "safetyIihsTopSafetyPick" BOOLEAN NOT NULL,
    "safetyNhtsaOverall" INTEGER,
    "safetyNotableFeatures" TEXT[],
    "techHighlights" TEXT[],
    "teenFriendlyFactors" TEXT[],
    "maintenanceNotes" TEXT[],
    "fitTags" "FitTag"[],
    "extrasTags" "ExtrasTag"[],
    "lastReviewed" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleSource" (
    "id" SERIAL NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "VehicleSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VehicleSource_vehicleId_idx" ON "VehicleSource"("vehicleId");

-- AddForeignKey
ALTER TABLE "VehicleSource" ADD CONSTRAINT "VehicleSource_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
