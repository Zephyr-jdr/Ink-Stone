-- =====================================================================
-- Ink & Stone — Sauvegarde AVANT migration (gratuit, sans plan payant)
-- =====================================================================
-- À coller dans Supabase → SQL Editor → Run, AVANT
-- `supabase-security-migration.sql`.
--
-- Copie l'intégralité des tables dans un schéma `backup_premigration`.
-- Ce schéma n'est PAS exposé par l'API : la clé publique ne peut pas le
-- lire. C'est juste un filet de sécurité interne à la base.
-- Idempotent : relancer écrase la sauvegarde précédente.
-- =====================================================================

create schema if not exists backup_premigration;

drop table if exists backup_premigration.spaces;
drop table if exists backup_premigration.characters;
drop table if exists backup_premigration.relations;
drop table if exists backup_premigration.locations;
drop table if exists backup_premigration.timelines;

create table backup_premigration.spaces      as select * from public.spaces;
create table backup_premigration.characters  as select * from public.characters;
create table backup_premigration.relations   as select * from public.relations;
create table backup_premigration.locations   as select * from public.locations;
create table backup_premigration.timelines   as select * from public.timelines;

-- Vérification : nombre de lignes sauvegardées
select 'spaces'     as table_name, count(*) from backup_premigration.spaces
union all select 'characters', count(*) from backup_premigration.characters
union all select 'relations',  count(*) from backup_premigration.relations
union all select 'locations',  count(*) from backup_premigration.locations
union all select 'timelines',  count(*) from backup_premigration.timelines;

-- =====================================================================
-- RESTAURATION (uniquement si quelque chose tourne mal) — décommenter :
--
-- begin;
--   delete from public.relations;
--   delete from public.characters;
--   delete from public.locations;
--   delete from public.timelines;
--   delete from public.spaces;
--   insert into public.spaces     select * from backup_premigration.spaces;
--   insert into public.locations  select * from backup_premigration.locations;
--   insert into public.characters select * from backup_premigration.characters;
--   insert into public.relations  select * from backup_premigration.relations;
--   insert into public.timelines  select * from backup_premigration.timelines;
-- commit;
--
-- Une fois sûr que tout va bien, tu peux supprimer la sauvegarde :
--   drop schema backup_premigration cascade;
-- =====================================================================
