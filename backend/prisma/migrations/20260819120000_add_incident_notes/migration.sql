CREATE TABLE "IncidentNote" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncidentNote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IncidentNote_incidentId_key" ON "IncidentNote"("incidentId");

ALTER TABLE "IncidentNote" ADD CONSTRAINT "IncidentNote_incidentId_fkey"
  FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
