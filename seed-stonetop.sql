-- =====================================================================
-- Seed: Chroniques de Stonetop
-- =====================================================================
-- Cible      : grimoire avec invite_code = 'sc-pwf'
-- Ajoute     : 6 lieux + 2 PJs (Yshan, Alvar) + 40 PNJs + ~78 relations
-- À exécuter : Supabase Dashboard → SQL Editor → New query → coller → Run
-- Idempotent : NON. Re-exécuter dupliquera les données.
--              Pour réinitialiser, voir le DELETE commenté en bas du fichier.
-- =====================================================================

DO $$
DECLARE
  v_space_id UUID;

  -- Locations (6)
  v_loc_stonetop     UUID;
  v_loc_steplands    UUID;
  v_loc_delve        UUID;
  v_loc_marshedge    UUID;
  v_loc_pass         UUID;
  v_loc_other        UUID;

  -- PJs (2)
  v_yshan UUID;
  v_alvar UUID;

  -- PNJs Stonetop (20)
  v_bryn UUID; v_marged UUID; v_hywel UUID; v_eluned UUID; v_cadoc UUID;
  v_ceridwyn UUID; v_gethin UUID; v_dilwen UUID; v_iorwerth UUID; v_sioned UUID;
  v_padrig UUID; v_enfys UUID; v_emrys UUID; v_rhosyn UUID; v_owain UUID;
  v_talfryn UUID; v_gaenor UUID; v_bedwyr UUID; v_aeronwen UUID; v_caron UUID;

  -- PNJs Hillfolk (5)
  v_davth UUID; v_elst UUID; v_gwilm UUID; v_nolwn UUID; v_reegn_hill UUID;

  -- PNJs Gordin's Delve (4)
  v_marika UUID; v_iasos UUID; v_iona UUID; v_ailen UUID;

  -- PNJs Marshedge (5)
  v_katlin UUID; v_mathuin UUID; v_finnen UUID; v_isbeal UUID; v_seann UUID;

  -- PNJs Barrier Pass (5)
  v_quent UUID; v_reegn_gate UUID; v_loic UUID; v_nanzl UUID; v_yanz UUID;

  -- PNJ autre (1)
  v_cerrn UUID;
BEGIN
  -- ---------------------------------------------------------------
  -- 0. Récupérer le space cible
  -- ---------------------------------------------------------------
  SELECT id INTO v_space_id FROM spaces WHERE invite_code = 'sc-pwf';
  IF v_space_id IS NULL THEN
    RAISE EXCEPTION 'Grimoire avec invite_code "sc-pwf" introuvable.';
  END IF;
  RAISE NOTICE 'Space: %', v_space_id;

  -- ---------------------------------------------------------------
  -- 1. Locations
  -- ---------------------------------------------------------------
  INSERT INTO locations (space_id, name, color) VALUES
    (v_space_id, 'Stonetop',        '#7AA177') RETURNING id INTO v_loc_stonetop;
  INSERT INTO locations (space_id, name, color) VALUES
    (v_space_id, 'Steplands',       '#C97C6B') RETURNING id INTO v_loc_steplands;
  INSERT INTO locations (space_id, name, color) VALUES
    (v_space_id, 'Gordin''s Delve', '#C8945C') RETURNING id INTO v_loc_delve;
  INSERT INTO locations (space_id, name, color) VALUES
    (v_space_id, 'Marshedge',       '#7DA1B0') RETURNING id INTO v_loc_marshedge;
  INSERT INTO locations (space_id, name, color) VALUES
    (v_space_id, 'Barrier Pass',    '#8E6BAA') RETURNING id INTO v_loc_pass;
  INSERT INTO locations (space_id, name, color) VALUES
    (v_space_id, 'Other',           '#9C9385') RETURNING id INTO v_loc_other;

  -- ---------------------------------------------------------------
  -- 2. PJs (2)
  -- ---------------------------------------------------------------
  INSERT INTO characters (space_id, name, role, type, location, notes, traits, tags) VALUES
    (v_space_id, 'Yshan', 'Hunter', 'PJ', v_loc_stonetop,
     'Jeune chasseur de Stonetop. Formé par Eluned (la traqueuse) et Gethin (le capitaine). Connaît la Wood et les Flats comme sa poche, et brûle de voir les terres au-delà du village.',
     '[{"label":"eagle-eye","checked":true},{"label":"has a way with animals","checked":true},{"label":"curious","checked":true}]'::jsonb,
     ARRAY['village','military','hunter']
    ) RETURNING id INTO v_yshan;

  INSERT INTO characters (space_id, name, role, type, location, notes, traits, tags) VALUES
    (v_space_id, 'Alvar', 'Trader / Caravan Master', 'PJ', v_loc_stonetop,
     'Marchand itinérant basé à Stonetop. Excellents contacts à Barrier Pass (Quent, Reegn of the Gate, Nanzl). En conflit ouvert avec la guilde de voleurs de Marshedge (Katlin Greymantle, Finnen Dusk) qui bénéficie de la protection tacite de la ville. Plusieurs villageois partagent son inimitié envers Marshedge (Sioned, Iorwerth).',
     '[{"label":"well-traveled","checked":true},{"label":"has a beef with Marshedge","checked":true},{"label":"gets the best deals","checked":true}]'::jsonb,
     ARRAY['village','trade','commerce']
    ) RETURNING id INTO v_alvar;

  -- ---------------------------------------------------------------
  -- 3. PNJs Stonetop (20)
  -- ---------------------------------------------------------------
  INSERT INTO characters (space_id, name, role, type, location, notes, traits, tags) VALUES
    (v_space_id, 'Bryn Kettler', 'Publican', 'PNJ', v_loc_stonetop,
     'Keeps a ledger of every debt in town.',
     '[{"label":"cheery","checked":true},{"label":"knows all the gossip","checked":true}]'::jsonb,
     ARRAY['village','commerce']) RETURNING id INTO v_bryn;

  INSERT INTO characters (space_id, name, role, type, location, notes, traits, tags) VALUES
    (v_space_id, 'Marged Kettler', 'Midwife', 'PNJ', v_loc_stonetop,
     'Delivered half the village.',
     '[{"label":"tender-hearted","checked":true},{"label":"has terrible nightmares","checked":true}]'::jsonb,
     ARRAY['village','healer']) RETURNING id INTO v_marged;

  INSERT INTO characters (space_id, name, role, type, location, notes, traits, tags) VALUES
    (v_space_id, 'Hywel Croft', 'Smith', 'PNJ', v_loc_stonetop,
     'Dreams of forging a blade worthy of a hero.',
     '[{"label":"stubborn","checked":true},{"label":"ambitious","checked":true}]'::jsonb,
     ARRAY['village','craftsman']) RETURNING id INTO v_hywel;

  INSERT INTO characters (space_id, name, role, type, location, notes, traits, tags) VALUES
    (v_space_id, 'Eluned Vann', 'Tanner', 'PNJ', v_loc_stonetop,
     'Knows every beast''s hide by smell alone.',
     '[{"label":"stoic","checked":true},{"label":"eagle-eye","checked":true}]'::jsonb,
     ARRAY['village','craftsman']) RETURNING id INTO v_eluned;

  INSERT INTO characters (space_id, name, role, type, location, notes, traits, tags) VALUES
    (v_space_id, 'Cadoc Ffin', 'Elder / Village Leader', 'PNJ', v_loc_stonetop,
     'Slow to decide; refuses to be rushed.',
     '[{"label":"cautious","checked":true},{"label":"gods-fearing","checked":true}]'::jsonb,
     ARRAY['village','authority']) RETURNING id INTO v_cadoc;

  INSERT INTO characters (space_id, name, role, type, location, notes, traits, tags) VALUES
    (v_space_id, 'Ceridwyn Ash', 'Potter', 'PNJ', v_loc_stonetop,
     'Hides Fae tokens in her kiln.',
     '[{"label":"curious","checked":true},{"label":"gifted storyteller","checked":true}]'::jsonb,
     ARRAY['village','craftsman']) RETURNING id INTO v_ceridwyn;

  INSERT INTO characters (space_id, name, role, type, location, notes, traits, tags) VALUES
    (v_space_id, 'Gethin Holt', 'Hunter / Militia Captain', 'PNJ', v_loc_stonetop,
     'Yshan''s de facto hunting superior.',
     '[{"label":"fearless","checked":true},{"label":"has a lot of backbone","checked":true}]'::jsonb,
     ARRAY['village','military']) RETURNING id INTO v_gethin;

  INSERT INTO characters (space_id, name, role, type, location, notes, traits, tags) VALUES
    (v_space_id, 'Dilwen Sparr', 'Farmer', 'PNJ', v_loc_stonetop,
     'Always blames last season''s weather.',
     '[{"label":"overprotective","checked":true},{"label":"doesn''t pull their weight","checked":true}]'::jsonb,
     ARRAY['village','farming']) RETURNING id INTO v_dilwen;

  INSERT INTO characters (space_id, name, role, type, location, notes, traits, tags) VALUES
    (v_space_id, 'Iorwerth Bach', 'Distiller', 'PNJ', v_loc_stonetop,
     'His whisky is Alvar''s best trade good.',
     '[{"label":"drunkard","checked":true},{"label":"gets the best deals","checked":true}]'::jsonb,
     ARRAY['village','commerce']) RETURNING id INTO v_iorwerth;

  INSERT INTO characters (space_id, name, role, type, location, notes, traits, tags) VALUES
    (v_space_id, 'Sioned Wren', 'Weaver', 'PNJ', v_loc_stonetop,
     'Lost a profitable contract to a Marshedge guild.',
     '[{"label":"ambitious","checked":true},{"label":"has a beef with Marshedge","checked":true}]'::jsonb,
     ARRAY['village','craftsman']) RETURNING id INTO v_sioned;

  INSERT INTO characters (space_id, name, role, type, location, notes, traits, tags) VALUES
    (v_space_id, 'Padrig Stone', 'Grain Keeper', 'PNJ', v_loc_stonetop,
     'Counts every oat, twice.',
     '[{"label":"jealous","checked":true},{"label":"immaculate appearance","checked":true}]'::jsonb,
     ARRAY['village','authority']) RETURNING id INTO v_padrig;

  INSERT INTO characters (space_id, name, role, type, location, notes, traits, tags) VALUES
    (v_space_id, 'Enfys Daw', 'Herbalist', 'PNJ', v_loc_stonetop,
     'Speaks to plants — most say she''s harmless.',
     '[{"label":"gathers herbs from the Wood","checked":true},{"label":"touched","checked":true}]'::jsonb,
     ARRAY['village','healer']) RETURNING id INTO v_enfys;

  INSERT INTO characters (space_id, name, role, type, location, notes, traits, tags) VALUES
    (v_space_id, 'Emrys Tal', 'Shepherd / Scout', 'PNJ', v_loc_stonetop,
     'Came back from the Ruined Tower wrong.',
     '[{"label":"has lost their nerve","checked":true},{"label":"reckless","checked":true}]'::jsonb,
     ARRAY['village','military']) RETURNING id INTO v_emrys;

  INSERT INTO characters (space_id, name, role, type, location, notes, traits, tags) VALUES
    (v_space_id, 'Rhosyn Carr', 'Innkeeper', 'PNJ', v_loc_stonetop,
     'Was a trader in Lygos before settling here.',
     '[{"label":"beloved by everyone","checked":true},{"label":"well-traveled","checked":true}]'::jsonb,
     ARRAY['village','commerce']) RETURNING id INTO v_rhosyn;

  INSERT INTO characters (space_id, name, role, type, location, notes, traits, tags) VALUES
    (v_space_id, 'Owain Fenn', 'Carter / Teamster', 'PNJ', v_loc_stonetop,
     'Knows every rut between here and Gordin''s Delve.',
     '[{"label":"happy-go-lucky","checked":true},{"label":"will eat anything","checked":true}]'::jsonb,
     ARRAY['village','trade']) RETURNING id INTO v_owain;

  INSERT INTO characters (space_id, name, role, type, location, notes, traits, tags) VALUES
    (v_space_id, 'Talfryn Moss', 'Militia Spearman', 'PNJ', v_loc_stonetop,
     'Excellent at looking brave from a distance.',
     '[{"label":"cowardly","checked":true},{"label":"sensitive","checked":true}]'::jsonb,
     ARRAY['village','military']) RETURNING id INTO v_talfryn;

  INSERT INTO characters (space_id, name, role, type, location, notes, traits, tags) VALUES
    (v_space_id, 'Gaenor Wick', 'Chandler', 'PNJ', v_loc_stonetop,
     'Sells tallow candles and information equally.',
     '[{"label":"best cook","checked":true},{"label":"curious","checked":true}]'::jsonb,
     ARRAY['village','craftsman']) RETURNING id INTO v_gaenor;

  INSERT INTO characters (space_id, name, role, type, location, notes, traits, tags) VALUES
    (v_space_id, 'Bedwyr Cloch', 'Stonecutter', 'PNJ', v_loc_stonetop,
     'Knows the Old Wall better than anyone alive.',
     '[{"label":"very strong","checked":true},{"label":"simpleton","checked":true}]'::jsonb,
     ARRAY['village','craftsman']) RETURNING id INTO v_bedwyr;

  INSERT INTO characters (space_id, name, role, type, location, notes, traits, tags) VALUES
    (v_space_id, 'Aeronwen Glas', 'Keeper of the Pavilion', 'PNJ', v_loc_stonetop,
     'Never lies; always cryptic.',
     '[{"label":"tends the Gods'' Pavilion","checked":true},{"label":"hears voices","checked":true}]'::jsonb,
     ARRAY['village','religious']) RETURNING id INTO v_aeronwen;

  INSERT INTO characters (space_id, name, role, type, location, notes, traits, tags) VALUES
    (v_space_id, 'Caron Tyn', 'Farmer / Surplus Hoarder', 'PNJ', v_loc_stonetop,
     'Buries grain every autumn, just in case.',
     '[{"label":"prideful","checked":true},{"label":"distrustful","checked":true}]'::jsonb,
     ARRAY['village','farming']) RETURNING id INTO v_caron;

  -- ---------------------------------------------------------------
  -- 4. PNJs Hillfolk (5)
  -- ---------------------------------------------------------------
  INSERT INTO characters (space_id, name, role, type, location, notes, traits, tags) VALUES
    (v_space_id, 'Davth Ironshoulder', 'Hunter-chief', 'PNJ', v_loc_steplands,
     'Tests visitors with impossible requests.',
     '[{"label":"stoic","checked":true},{"label":"tests strangers","checked":true}]'::jsonb,
     ARRAY['hillfolk','military']) RETURNING id INTO v_davth;

  INSERT INTO characters (space_id, name, role, type, location, notes, traits, tags) VALUES
    (v_space_id, 'Elst Two-Spears', 'Warrior', 'PNJ', v_loc_steplands,
     'Has a scar for every crinwin she''s slain.',
     '[{"label":"fearless","checked":true},{"label":"reckless","checked":true}]'::jsonb,
     ARRAY['hillfolk','military']) RETURNING id INTO v_elst;

  INSERT INTO characters (space_id, name, role, type, location, notes, traits, tags) VALUES
    (v_space_id, 'Gwilm the Old', 'Elder / Lorekeeper', 'PNJ', v_loc_steplands,
     'Remembers names of things the village has forgotten.',
     '[{"label":"well-read","checked":true},{"label":"swears they met the Pale Hunter","checked":true}]'::jsonb,
     ARRAY['hillfolk','religious']) RETURNING id INTO v_gwilm;

  INSERT INTO characters (space_id, name, role, type, location, notes, traits, tags) VALUES
    (v_space_id, 'Nolwn Driftfoot', 'Outrider', 'PNJ', v_loc_steplands,
     'Scouts aurochs herds and sells the intel.',
     '[{"label":"moved here recently","checked":true},{"label":"curious","checked":true}]'::jsonb,
     ARRAY['hillfolk','trade']) RETURNING id INTO v_nolwn;

  INSERT INTO characters (space_id, name, role, type, location, notes, traits, tags) VALUES
    (v_space_id, 'Reegn Ashhand', 'Shaman', 'PNJ', v_loc_steplands,
     'Blames Stonetop for something old.',
     '[{"label":"dallied with the Fae years ago","checked":true},{"label":"humorless","checked":true}]'::jsonb,
     ARRAY['hillfolk','religious']) RETURNING id INTO v_reegn_hill;

  -- ---------------------------------------------------------------
  -- 5. PNJs Gordin's Delve (4)
  -- ---------------------------------------------------------------
  INSERT INTO characters (space_id, name, role, type, location, notes, traits, tags) VALUES
    (v_space_id, 'Marika Dolvar', 'Mine Foreman', 'PNJ', v_loc_delve,
     'Wants a trade route Alvar can help open.',
     '[{"label":"ambitious","checked":true},{"label":"craves recognition","checked":true}]'::jsonb,
     ARRAY['delve','authority']) RETURNING id INTO v_marika;

  INSERT INTO characters (space_id, name, role, type, location, notes, traits, tags) VALUES
    (v_space_id, 'Iasos Tuck', 'Metal Merchant', 'PNJ', v_loc_delve,
     'Controls the iron Stonetop needs.',
     '[{"label":"gets the best deals","checked":true},{"label":"jealous","checked":true}]'::jsonb,
     ARRAY['delve','trade']) RETURNING id INTO v_iasos;

  INSERT INTO characters (space_id, name, role, type, location, notes, traits, tags) VALUES
    (v_space_id, 'Iona Darkseam', 'Smuggler', 'PNJ', v_loc_delve,
     'Knows the thieves'' guild in Marshedge personally.',
     '[{"label":"keeps to themselves","checked":true},{"label":"lame","checked":true}]'::jsonb,
     ARRAY['delve','criminal']) RETURNING id INTO v_iona;

  INSERT INTO characters (space_id, name, role, type, location, notes, traits, tags) VALUES
    (v_space_id, 'Ailen Roughcut', 'Miner / Informant', 'PNJ', v_loc_delve,
     'Sells gossip as freely as ore.',
     '[{"label":"foundling","checked":true},{"label":"tells the best jokes","checked":true}]'::jsonb,
     ARRAY['delve','trade']) RETURNING id INTO v_ailen;

  -- ---------------------------------------------------------------
  -- 6. PNJs Marshedge (5)
  -- ---------------------------------------------------------------
  INSERT INTO characters (space_id, name, role, type, location, notes, traits, tags) VALUES
    (v_space_id, 'Katlin Greymantle', 'Guild Enforcer', 'PNJ', v_loc_marshedge,
     'The guild''s fist in a silk glove.',
     '[{"label":"likes to hurt things","checked":true},{"label":"immaculate appearance","checked":true}]'::jsonb,
     ARRAY['marshedge','criminal']) RETURNING id INTO v_katlin;

  INSERT INTO characters (space_id, name, role, type, location, notes, traits, tags) VALUES
    (v_space_id, 'Mathuin Tallow', 'Merchant', 'PNJ', v_loc_marshedge,
     'Pays the guild for protection he pretends not to need.',
     '[{"label":"cowardly","checked":true},{"label":"has a wandering eye","checked":true}]'::jsonb,
     ARRAY['marshedge','trade']) RETURNING id INTO v_mathuin;

  INSERT INTO characters (space_id, name, role, type, location, notes, traits, tags) VALUES
    (v_space_id, 'Finnen Dusk', 'Guild Spymaster', 'PNJ', v_loc_marshedge,
     'Knows Alvar''s name, face, and route.',
     '[{"label":"well-traveled","checked":true},{"label":"humorless","checked":true}]'::jsonb,
     ARRAY['marshedge','criminal']) RETURNING id INTO v_finnen;

  INSERT INTO characters (space_id, name, role, type, location, notes, traits, tags) VALUES
    (v_space_id, 'Isbeal Marsh', 'Herbalist / Fence', 'PNJ', v_loc_marshedge,
     'Fences stolen goods in medicinal jars.',
     '[{"label":"good with children","checked":true},{"label":"keeps to themselves","checked":true}]'::jsonb,
     ARRAY['marshedge','criminal','healer']) RETURNING id INTO v_isbeal;

  INSERT INTO characters (space_id, name, role, type, location, notes, traits, tags) VALUES
    (v_space_id, 'Seann Tidewatcher', 'River Guard', 'PNJ', v_loc_marshedge,
     'Looks the other way for the right coin.',
     '[{"label":"not afraid of deep water","checked":true},{"label":"loyal friend","checked":true}]'::jsonb,
     ARRAY['marshedge','military']) RETURNING id INTO v_seann;

  -- ---------------------------------------------------------------
  -- 7. PNJs Barrier Pass (5)
  -- ---------------------------------------------------------------
  INSERT INTO characters (space_id, name, role, type, location, notes, traits, tags) VALUES
    (v_space_id, 'Quent Farlander', 'Merchant', 'PNJ', v_loc_pass,
     'Alvar''s main contact beyond the mountains.',
     '[{"label":"well-traveled","checked":true},{"label":"happy-go-lucky","checked":true}]'::jsonb,
     ARRAY['pass','trade']) RETURNING id INTO v_quent;

  INSERT INTO characters (space_id, name, role, type, location, notes, traits, tags) VALUES
    (v_space_id, 'Reegn of the Gate', 'Gatekeeper', 'PNJ', v_loc_pass,
     'Writes down every name that passes through.',
     '[{"label":"gods-fearing","checked":true},{"label":"cautious","checked":true}]'::jsonb,
     ARRAY['pass','authority']) RETURNING id INTO v_reegn_gate;

  INSERT INTO characters (space_id, name, role, type, location, notes, traits, tags) VALUES
    (v_space_id, 'Loic Gravel', 'Smuggler / Guide', 'PNJ', v_loc_pass,
     'Knows three paths the gate doesn''t.',
     '[{"label":"reckless","checked":true},{"label":"runs everywhere","checked":true}]'::jsonb,
     ARRAY['pass','criminal','trade']) RETURNING id INTO v_loic;

  INSERT INTO characters (space_id, name, role, type, location, notes, traits, tags) VALUES
    (v_space_id, 'Nanzl the Broker', 'Information Broker', 'PNJ', v_loc_pass,
     'Sells futures, not just news.',
     '[{"label":"gifted storyteller","checked":true},{"label":"craves recognition","checked":true}]'::jsonb,
     ARRAY['pass','trade']) RETURNING id INTO v_nanzl;

  INSERT INTO characters (space_id, name, role, type, location, notes, traits, tags) VALUES
    (v_space_id, 'Yanz Coldfoot', 'Mercenary Guard', 'PNJ', v_loc_pass,
     'Available for hire; expensive; worth it.',
     '[{"label":"stoic","checked":true},{"label":"slew many crinwin","checked":true}]'::jsonb,
     ARRAY['pass','military']) RETURNING id INTO v_yanz;

  -- ---------------------------------------------------------------
  -- 8. PNJ Other (1)
  -- ---------------------------------------------------------------
  INSERT INTO characters (space_id, name, role, type, location, notes, traits, tags) VALUES
    (v_space_id, 'Cerrn the Unmapped', 'Cartographer', 'PNJ', v_loc_other,
     'Claims to have mapped the Pale Hunter''s territory.',
     '[{"label":"has their head in the clouds","checked":true},{"label":"well-read","checked":true}]'::jsonb,
     ARRAY['other','trade']) RETURNING id INTO v_cerrn;

  -- ---------------------------------------------------------------
  -- 9. Relations (~78, dédupliquées)
  -- ---------------------------------------------------------------
  INSERT INTO relations (space_id, from_character_id, to_character_id, relation_type, relation_detail) VALUES
    -- Alvar / Stonetop
    (v_space_id, v_alvar, v_bryn,        'connaissance', 'supplier'),
    (v_space_id, v_alvar, v_hywel,       'rival',        'rival'),
    (v_space_id, v_alvar, v_cadoc,       'ami',          'reluctant ally'),
    (v_space_id, v_alvar, v_ceridwyn,    'connaissance', 'customer'),
    (v_space_id, v_alvar, v_iorwerth,    'compagnon',    'business partner'),
    (v_space_id, v_alvar, v_sioned,      'ami',          'shared enemy of Marshedge guild'),
    (v_space_id, v_alvar, v_rhosyn,      'ami',          'old road companion'),
    (v_space_id, v_alvar, v_owain,       'connaissance', 'regular hire'),
    (v_space_id, v_alvar, v_gaenor,      'connaissance', 'informant'),
    -- Yshan / Stonetop
    (v_space_id, v_yshan, v_marged,      'ami',          'childhood friend'),
    (v_space_id, v_yshan, v_hywel,       'compagnon',    'hunting buddy'),
    (v_space_id, v_yshan, v_eluned,      'mentor',       'mentor'),
    (v_space_id, v_yshan, v_gethin,      'mentor',       'mentor'),
    (v_space_id, v_yshan, v_enfys,       'connaissance', 'trade partner'),
    (v_space_id, v_yshan, v_emrys,       'compagnon',    'fellow hunter'),
    (v_space_id, v_yshan, v_bedwyr,      'connaissance', 'respects Yshan'),
    -- Inner Stonetop
    (v_space_id, v_bryn, v_marged,       'famille',      'sister'),
    (v_space_id, v_eluned, v_marged,     'connaissance', 'neighbour'),
    (v_space_id, v_cadoc, v_ceridwyn,    'romance',      'old flame'),
    (v_space_id, v_gethin, v_hywel,      'compagnon',    'drinking companion'),
    (v_space_id, v_dilwen, v_gethin,     'famille',      'cousin'),
    (v_space_id, v_dilwen, v_marged,     'autre',        'owes her a favour'),
    (v_space_id, v_bryn, v_iorwerth,     'connaissance', 'supplier'),
    (v_space_id, v_eluned, v_sioned,     'ami',          'friend'),
    (v_space_id, v_cadoc, v_padrig,      'autre',        'Padrig reports to Cadoc'),
    (v_space_id, v_dilwen, v_padrig,     'rival',        'distrusts'),
    (v_space_id, v_enfys, v_marged,      'mentor',       'apprentice'),
    (v_space_id, v_emrys, v_gethin,      'rival',        'Gethin distrusts him'),
    (v_space_id, v_bryn, v_rhosyn,       'rival',        'innkeeper rival'),
    (v_space_id, v_iorwerth, v_owain,    'famille',      'cousin'),
    (v_space_id, v_gethin, v_talfryn,    'autre',        'commander'),
    (v_space_id, v_emrys, v_talfryn,     'rival',        'rival'),
    (v_space_id, v_bryn, v_gaenor,       'ami',          'gossip partner'),
    (v_space_id, v_bedwyr, v_hywel,      'compagnon',    'work partner'),
    (v_space_id, v_aeronwen, v_cadoc,    'mentor',       'spiritual advisor'),
    (v_space_id, v_aeronwen, v_enfys,    'ami',          'ally'),
    (v_space_id, v_caron, v_padrig,      'ennemi',       'enemy'),
    (v_space_id, v_caron, v_dilwen,      'connaissance', 'neighbour'),

    -- Hillfolk
    (v_space_id, v_davth, v_yshan,       'rival',        'wary respect'),
    (v_space_id, v_davth, v_gethin,      'rival',        'rival'),
    (v_space_id, v_elst, v_yshan,        'compagnon',    'blood-oath ally'),
    (v_space_id, v_davth, v_elst,        'autre',        'Elst is Davth''s lieutenant'),
    (v_space_id, v_aeronwen, v_gwilm,    'connaissance', 'mutual respect'),
    (v_space_id, v_gwilm, v_yshan,       'mentor',       'teaches'),
    (v_space_id, v_alvar, v_nolwn,       'connaissance', 'occasional source'),
    (v_space_id, v_nolwn, v_yshan,       'connaissance', 'hunting contact'),
    (v_space_id, v_gwilm, v_reegn_hill,  'rival',        'rival shamans'),
    (v_space_id, v_aeronwen, v_reegn_hill,'connaissance','correspondent'),

    -- Gordin's Delve
    (v_space_id, v_alvar, v_marika,      'connaissance', 'business interest'),
    (v_space_id, v_cadoc, v_marika,      'connaissance', 'potential ally'),
    (v_space_id, v_alvar, v_iasos,       'connaissance', 'iron supplier'),
    (v_space_id, v_hywel, v_iasos,       'connaissance', 'corresponds about iron'),
    (v_space_id, v_alvar, v_iona,        'ennemi',       'sworn enemy by proxy'),
    (v_space_id, v_gaenor, v_iona,       'connaissance', 'secret contact'),
    (v_space_id, v_alvar, v_ailen,       'connaissance', 'paid informant'),
    (v_space_id, v_ailen, v_iona,        'ennemi',       'fears her'),

    -- Marshedge
    (v_space_id, v_alvar, v_katlin,      'ennemi',       'sworn enemy'),
    (v_space_id, v_katlin, v_sioned,     'ennemi',       'ruined Sioned''s contract'),
    (v_space_id, v_alvar, v_mathuin,     'connaissance', 'uneasy contact'),
    (v_space_id, v_iorwerth, v_mathuin,  'connaissance', 'old customer'),
    (v_space_id, v_alvar, v_finnen,      'ennemi',       'nemesis'),
    (v_space_id, v_finnen, v_iona,       'autre',        'handler relationship'),
    (v_space_id, v_enfys, v_isbeal,      'rival',        'trade rival herbalists'),
    (v_space_id, v_alvar, v_isbeal,      'connaissance', 'reluctant source'),
    (v_space_id, v_alvar, v_seann,       'connaissance', 'bribed contact'),
    (v_space_id, v_katlin, v_seann,      'autre',        'reports to Katlin'),

    -- Barrier Pass
    (v_space_id, v_alvar, v_quent,       'ami',          'old friend'),
    (v_space_id, v_marika, v_quent,      'rival',        'business rival'),
    (v_space_id, v_alvar, v_reegn_gate,  'connaissance', 'knows him by name'),
    (v_space_id, v_quent, v_reegn_gate,  'connaissance', 'respects'),
    (v_space_id, v_alvar, v_loic,        'connaissance', 'emergency contact'),
    (v_space_id, v_finnen, v_loic,       'ennemi',       'hunted by Finnen'),
    (v_space_id, v_alvar, v_nanzl,       'connaissance', 'pays regularly'),
    (v_space_id, v_nanzl, v_quent,       'rival',        'distrusts'),
    (v_space_id, v_alvar, v_yanz,        'connaissance', 'hired before'),
    (v_space_id, v_elst, v_yanz,         'ennemi',       'blood-enemies'),

    -- Cerrn
    (v_space_id, v_cerrn, v_yshan,       'autre',        'fascinated by Yshan''s stories'),
    (v_space_id, v_cerrn, v_gwilm,       'connaissance', 'correspondent');

  RAISE NOTICE 'Seed Stonetop complet : 6 lieux, 2 PJs, 40 PNJs, ~78 relations.';
END $$;

-- =====================================================================
-- Pour TOUT EFFACER de ce grimoire (utile pour ré-exécuter le seed)
-- Décommenter le bloc ci-dessous et exécuter SEUL :
-- =====================================================================
-- DELETE FROM relations  WHERE space_id = (SELECT id FROM spaces WHERE invite_code = 'sc-pwf');
-- DELETE FROM characters WHERE space_id = (SELECT id FROM spaces WHERE invite_code = 'sc-pwf');
-- DELETE FROM locations  WHERE space_id = (SELECT id FROM spaces WHERE invite_code = 'sc-pwf');
