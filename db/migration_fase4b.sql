-- Fase 4b: gem koordinater fra Nominatim
alter table listings add column if not exists lat double precision;
alter table listings add column if not exists lon double precision;
