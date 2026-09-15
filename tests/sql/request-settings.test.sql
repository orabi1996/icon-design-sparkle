-- DISPOSABLE CI DATABASE ONLY. These assertions are rolled back.
BEGIN;
CREATE FUNCTION pg_temp.assert_true(ok boolean, label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'Failed: %', label; END IF;
END $$;
CREATE FUNCTION pg_temp.assert_raises(statement text, expected_state text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    EXECUTE statement;
  EXCEPTION WHEN OTHERS THEN
    IF SQLSTATE = expected_state THEN RETURN; END IF;
    RAISE;
  END;
  RAISE EXCEPTION 'Expected SQLSTATE %', expected_state;
END $$;

-- Migration must preserve the existing payload byte-for-byte.
SELECT pg_temp.assert_true(value = '[{"id":"req-seeded","code":"REQ-SEED","name":"طلب اختبار","category":"إدارية","approval_chain":["مدير النظام"],"max_sla_hours":24,"requires_attachment":false,"allow_cancel":true,"status":"نشط"}]', 'migration preserves existing data')
FROM public.app_settings WHERE section='request_types' AND key='configs';
SELECT value AS original FROM public.app_settings WHERE section='request_types' AND key='configs'
\gset

SET LOCAL ROLE anon;
SELECT pg_temp.assert_true((SELECT count(*) FROM public.app_settings WHERE section='request_types') = 0, 'anonymous cannot read');
SELECT pg_temp.assert_raises('SELECT public.get_request_type_settings()', '42501');
SELECT pg_temp.assert_raises('SELECT public.save_request_type_settings(''[]'', NULL)', '42501');
SELECT pg_temp.assert_raises('INSERT INTO public.app_settings(section,key,value) VALUES (''request_types'',''other'',''bad'')', '42501');
SELECT pg_temp.assert_raises('UPDATE public.app_settings SET section=''request_types'' WHERE section=''unrelated_test''', '42501');
SELECT pg_temp.assert_raises('TRUNCATE public.app_settings', '42501');
UPDATE public.app_settings SET section='escaped' WHERE section='request_types';
DELETE FROM public.app_settings WHERE section='request_types';
SELECT pg_temp.assert_true((SELECT value FROM public.app_settings WHERE section='unrelated_test') = 'unchanged', 'unrelated section unchanged');
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
SELECT pg_temp.assert_true((SELECT count(*) FROM public.app_settings WHERE section='request_types') = 0, 'employee cannot read directly');
SELECT pg_temp.assert_raises('SELECT public.get_request_type_settings()', '42501');
SELECT pg_temp.assert_raises(format('SELECT public.save_request_type_settings(%L::jsonb,%L)', :'original', :'original'), '42501');
SELECT pg_temp.assert_raises('INSERT INTO public.app_settings(section,key,value) VALUES (''request_types'',''configs'',''bad'') ON CONFLICT(section,key) DO UPDATE SET value=EXCLUDED.value', '42501');
SELECT pg_temp.assert_raises('UPDATE public.app_settings SET section=''request_types'' WHERE section=''unrelated_test''', '42501');
UPDATE public.app_settings SET value='bad' WHERE section='request_types';
DELETE FROM public.app_settings WHERE section='request_types';

SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
SELECT pg_temp.assert_true((SELECT count(*) FROM public.app_settings WHERE section='request_types') = 0, 'admin must also use RPC');
SELECT pg_temp.assert_raises('INSERT INTO public.app_settings(section,key,value) VALUES (''request_types'',''configs'',''bad'') ON CONFLICT(section,key) DO UPDATE SET value=EXCLUDED.value', '42501');
SELECT pg_temp.assert_true(public.get_request_type_settings()->>'value' = :'original', 'blocked direct writes preserved payload');
SELECT pg_temp.assert_raises('SELECT public.save_request_type_settings(''[]'', NULL)', '22023');
SELECT pg_temp.assert_raises('SELECT public.save_request_type_settings(''{}'', NULL)', '22023');
SELECT pg_temp.assert_raises(format('SELECT public.save_request_type_settings(%L::jsonb,NULL)', jsonb_set(:'original'::jsonb, '{0,max_sla_hours}', '0')), '22023');
SELECT pg_temp.assert_raises(format('SELECT public.save_request_type_settings(%L::jsonb,NULL)', jsonb_set(:'original'::jsonb, '{0,max_sla_hours}', '2.5')), '22023');
SELECT pg_temp.assert_raises(format('SELECT public.save_request_type_settings(%L::jsonb,NULL)', jsonb_set(:'original'::jsonb, '{0,requires_attachment}', '"false"')), '22023');
SELECT pg_temp.assert_raises(format('SELECT public.save_request_type_settings(%L::jsonb,NULL)', jsonb_set(:'original'::jsonb, '{0,approval_chain}', '[]')), '22023');
SELECT pg_temp.assert_raises(format('SELECT public.save_request_type_settings(%L::jsonb,NULL)', jsonb_set(:'original'::jsonb, '{0,extra}', 'true')), '22023');
SELECT pg_temp.assert_raises(format('SELECT public.save_request_type_settings(%L::jsonb,NULL)', :'original'::jsonb || :'original'::jsonb), '22023');
SELECT pg_temp.assert_raises(format('SELECT public.save_request_type_settings(%L::jsonb,NULL)', (:'original'::jsonb)->0 - 'status'), '22023');
SELECT public.save_request_type_settings(jsonb_set(:'original'::jsonb, '{0,max_sla_hours}', '48'), :'original') AS saved
\gset
SELECT pg_temp.assert_true((:'saved'::jsonb->>'exists')::boolean, 'admin save receipt');
SELECT pg_temp.assert_true(((public.get_request_type_settings()->>'value')::jsonb #>> '{0,max_sla_hours}') = '48', 'saved value reloaded');
-- A second admin holding the old snapshot may not overwrite the first admin.
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',true);
SELECT pg_temp.assert_raises(format('SELECT public.save_request_type_settings(%L::jsonb,%L)', :'original', :'original'), '40001');
SELECT pg_temp.assert_true(((public.get_request_type_settings()->>'value')::jsonb #>> '{0,max_sla_hours}') = '48', 'conflict leaves winner intact');
RESET ROLE;

-- Missing row: one initial save allowed; repeating a stale NULL snapshot conflicts.
DELETE FROM public.app_settings WHERE section='request_types';
SET LOCAL ROLE authenticated;
SELECT pg_temp.assert_true(public.get_request_type_settings() = '{"exists":false,"value":null}'::jsonb, 'confirmed absence');
SELECT public.save_request_type_settings(:'original'::jsonb, NULL);
SELECT pg_temp.assert_raises(format('SELECT public.save_request_type_settings(%L::jsonb,NULL)', :'original'), '40001');
RESET ROLE;
SELECT pg_temp.assert_true((SELECT count(*) FROM public.app_settings WHERE section='request_types' AND key='configs') = 1, 'single config row');
SELECT pg_temp.assert_true((SELECT value FROM public.app_settings WHERE section='unrelated_test') = 'unchanged', 'unrelated data preserved');
ROLLBACK;
