-- CreateEnum
CREATE TYPE "VehicleDataSource" AS ENUM ('MANUAL', 'NHTSA', 'CARQUERY', 'FUEL_ECONOMY', 'BLENDED');

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "dataSource" "VehicleDataSource" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "fuelEconomyCombined" INTEGER,
ADD COLUMN     "imageAttribution" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "recallCount" INTEGER,
ADD COLUMN     "safetyNhtsaFrontal" INTEGER,
ADD COLUMN     "safetyNhtsaRollover" INTEGER,
ADD COLUMN     "safetyNhtsaSide" INTEGER;
