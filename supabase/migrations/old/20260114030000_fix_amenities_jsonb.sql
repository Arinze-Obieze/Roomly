-- Ensure amenities is jsonb to support containment operators (@>)
ALTER TABLE "public"."properties" ALTER COLUMN "amenities" TYPE jsonb USING "amenities"::jsonb;
