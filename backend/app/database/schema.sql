-- Ejecutar en Supabase SQL Editor. Compatible con el SQL entregado en la conversación.
-- No borra tablas ni registros existentes. Las funciones se actualizan en una transacción.
BEGIN;
CREATE TABLE IF NOT EXISTS public.perfiles (
 id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 nombre text NOT NULL, rol text NOT NULL DEFAULT 'operador'
 CHECK (rol IN ('administrador','operador','consulta')), activo boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.personas (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nombre text NOT NULL, email text,
 activo boolean NOT NULL DEFAULT true, registrado_por uuid REFERENCES public.perfiles(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.consentimientos (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), persona_id uuid NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
 finalidad text NOT NULL, version_aviso text NOT NULL, evidencia_referencia text NOT NULL,
 otorgado_at timestamptz NOT NULL, vence_at timestamptz, revocado_at timestamptz,
 registrado_por uuid REFERENCES public.perfiles(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(id,persona_id),
 CHECK (vence_at IS NULL OR vence_at > otorgado_at),
 CHECK (revocado_at IS NULL OR revocado_at >= otorgado_at)
);
CREATE TABLE IF NOT EXISTS public.face_embeddings (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), persona_id uuid NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
 consentimiento_id uuid NOT NULL, modelo text NOT NULL, version_modelo text NOT NULL,
 dimension integer NOT NULL CHECK(dimension>0), embedding double precision[] NOT NULL,
 calidad_imagen double precision CHECK(calidad_imagen BETWEEN 0 AND 1), activo boolean NOT NULL DEFAULT true,
 eliminar_despues_de timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(consentimiento_id,persona_id) REFERENCES public.consentimientos(id,persona_id),
 CHECK(cardinality(embedding)=dimension), CHECK(array_ndims(embedding)=1),
 CHECK(array_position(embedding,NULL) IS NULL), CHECK(eliminar_despues_de>created_at)
);
CREATE TABLE IF NOT EXISTS public.ml_models (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nombre text NOT NULL, version text NOT NULL,
 algoritmo text NOT NULL, modelo_facial text NOT NULL, version_modelo_facial text NOT NULL,
 calibrado boolean NOT NULL DEFAULT false, metodo_calibracion text,
 parametros jsonb NOT NULL DEFAULT '{}', dataset_referencia text, artefacto_referencia text,
 precision_score double precision CHECK(precision_score BETWEEN 0 AND 1),
 recall_score double precision CHECK(recall_score BETWEEN 0 AND 1), f1_score double precision CHECK(f1_score BETWEEN 0 AND 1),
 tasa_falsos_positivos double precision CHECK(tasa_falsos_positivos BETWEEN 0 AND 1),
 tasa_falsos_negativos double precision CHECK(tasa_falsos_negativos BETWEEN 0 AND 1),
 matriz_confusion jsonb, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(nombre,version),
 CHECK(NOT calibrado OR metodo_calibracion IS NOT NULL)
);
CREATE TABLE IF NOT EXISTS public.recognition_logs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), persona_id uuid REFERENCES public.personas(id) ON DELETE SET NULL,
 ejecutado_por uuid REFERENCES public.perfiles(id) ON DELETE SET NULL,
 origen text NOT NULL CHECK(origen IN ('camara','archivo')),
 estado text NOT NULL CHECK(estado IN ('comparado','sin_rostro','baja_calidad','sin_registros','error')),
 modelo_facial text NOT NULL, version_modelo_facial text NOT NULL,
 similitud double precision CHECK(similitud BETWEEN -1 AND 1),
 distancia double precision CHECK(distancia>=0 AND distancia<'Infinity'::double precision), metrica_distancia text,
 umbral double precision CHECK(umbral BETWEEN -1 AND 1), coincide boolean,
 probabilidad_calibrada double precision CHECK(probabilidad_calibrada BETWEEN 0 AND 1),
 ml_model_id uuid REFERENCES public.ml_models(id), calidad_imagen double precision CHECK(calidad_imagen BETWEEN 0 AND 1),
 iluminacion double precision CHECK(iluminacion BETWEEN 0 AND 1), duracion_ms integer CHECK(duracion_ms>=0),
 eliminar_despues_de timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(probabilidad_calibrada IS NULL OR ml_model_id IS NOT NULL),
 CHECK(eliminar_despues_de>created_at)
);
CREATE TABLE IF NOT EXISTS public.ml_training_records (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), recognition_log_id uuid REFERENCES public.recognition_logs(id) ON DELETE SET NULL,
 modelo_facial text NOT NULL, version_modelo_facial text NOT NULL,
 similitud double precision NOT NULL CHECK(similitud BETWEEN -1 AND 1),
 distancia double precision CHECK(distancia>=0 AND distancia<'Infinity'::double precision), metrica_distancia text,
 calidad_imagen double precision NOT NULL CHECK(calidad_imagen BETWEEN 0 AND 1),
 iluminacion double precision NOT NULL CHECK(iluminacion BETWEEN 0 AND 1), resultado_real boolean NOT NULL,
 fuente_validacion text NOT NULL, validado_por uuid REFERENCES public.perfiles(id) ON DELETE SET NULL,
 validado_at timestamptz NOT NULL, particion text NOT NULL DEFAULT 'pendiente',
 grupo_validacion text, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ml_training_records ADD COLUMN IF NOT EXISTS grupo_validacion text;
CREATE TABLE IF NOT EXISTS public.audit_logs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_id uuid REFERENCES public.perfiles(id) ON DELETE SET NULL,
 accion text NOT NULL, entidad text NOT NULL, registro_id uuid,
 resultado text NOT NULL CHECK(resultado IN ('exito','denegado','error')),
 detalle jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_embeddings_persona ON public.face_embeddings(persona_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_consentimiento ON public.face_embeddings(consentimiento_id,persona_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_retencion ON public.face_embeddings(eliminar_despues_de);
CREATE INDEX IF NOT EXISTS idx_consentimientos_persona ON public.consentimientos(persona_id);
CREATE INDEX IF NOT EXISTS idx_recognition_fecha ON public.recognition_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recognition_persona ON public.recognition_logs(persona_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_training_recognition ON public.ml_training_records(recognition_log_id);
CREATE INDEX IF NOT EXISTS idx_audit_fecha ON public.audit_logs(created_at DESC);

DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['perfiles','personas','consentimientos','face_embeddings','ml_models','recognition_logs','ml_training_records','audit_logs'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC,anon,authenticated',t);
  EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE public.%I TO service_role',t);
 END LOOP;
END $$;
REVOKE UPDATE,DELETE ON public.audit_logs FROM service_role;

CREATE OR REPLACE FUNCTION public.registrar_persona(p_nombre text,p_email text,p_actor uuid,p_version text,p_evidencia text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE p public.personas;
BEGIN
 INSERT INTO public.personas(nombre,email,registrado_por) VALUES(p_nombre,p_email,p_actor) RETURNING * INTO p;
 INSERT INTO public.consentimientos(persona_id,finalidad,version_aviso,evidencia_referencia,otorgado_at,registrado_por)
 VALUES(p.id,'Registro y reconocimiento facial',p_version,p_evidencia,now(),p_actor);
 INSERT INTO public.audit_logs(actor_id,accion,entidad,registro_id,resultado) VALUES(p_actor,'registrar','personas',p.id,'exito');
 RETURN to_jsonb(p);
END $$;

CREATE OR REPLACE FUNCTION public.registrar_embedding(p_persona uuid,p_actor uuid,p_embedding double precision[],p_modelo text,p_version text,p_calidad double precision,p_expira timestamptz)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE c uuid; eid uuid;
BEGIN
 PERFORM 1 FROM public.personas WHERE id=p_persona AND activo FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Persona inactiva o inexistente'; END IF;
 SELECT id INTO c FROM public.consentimientos WHERE persona_id=p_persona AND revocado_at IS NULL
 AND (vence_at IS NULL OR vence_at>now()) ORDER BY otorgado_at DESC LIMIT 1 FOR UPDATE;
 IF c IS NULL THEN RAISE EXCEPTION 'Falta consentimiento vigente'; END IF;
 IF EXISTS(SELECT 1 FROM unnest(p_embedding) v WHERE v IS NULL OR v='NaN'::double precision OR abs(v)='Infinity'::double precision)
 OR NOT EXISTS(SELECT 1 FROM unnest(p_embedding) v WHERE abs(v)>0) THEN RAISE EXCEPTION 'Embedding invalido'; END IF;
 INSERT INTO public.face_embeddings(persona_id,consentimiento_id,modelo,version_modelo,dimension,embedding,calidad_imagen,eliminar_despues_de)
 VALUES(p_persona,c,p_modelo,p_version,cardinality(p_embedding),p_embedding,p_calidad,p_expira) RETURNING id INTO eid;
 INSERT INTO public.audit_logs(actor_id,accion,entidad,registro_id,resultado) VALUES(p_actor,'registrar_rostro','personas',p_persona,'exito');
 RETURN jsonb_build_object('id',eid,'persona_id',p_persona);
END $$;

CREATE OR REPLACE FUNCTION public.revocar_persona(p_persona uuid,p_actor uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
 PERFORM 1 FROM public.personas WHERE id=p_persona FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Persona inexistente'; END IF;
 UPDATE public.personas SET activo=false WHERE id=p_persona;
 UPDATE public.consentimientos SET revocado_at=now() WHERE persona_id=p_persona AND revocado_at IS NULL;
 DELETE FROM public.face_embeddings WHERE persona_id=p_persona;
 -- Disable calibrated artifacts trained with comparisons being revoked.
 UPDATE public.ml_models m SET calibrado=false WHERE EXISTS (
 SELECT 1 FROM public.ml_training_records r JOIN public.recognition_logs l ON l.id=r.recognition_log_id
 WHERE l.persona_id=p_persona AND ((m.parametros->'train_ids') ? r.id::text
 OR (m.parametros->'calibration_ids') ? r.id::text OR (m.parametros->'test_ids') ? r.id::text));
 DELETE FROM public.ml_training_records WHERE recognition_log_id IN (SELECT id FROM public.recognition_logs WHERE persona_id=p_persona);
 DELETE FROM public.recognition_logs WHERE persona_id=p_persona;
 INSERT INTO public.audit_logs(actor_id,accion,entidad,registro_id,resultado) VALUES(p_actor,'revocar','personas',p_persona,'exito');
 RETURN jsonb_build_object('revocado',true);
END $$;

CREATE OR REPLACE FUNCTION public.eliminar_persona(p_persona uuid,p_actor uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
 PERFORM public.revocar_persona(p_persona,p_actor);
 DELETE FROM public.personas WHERE id=p_persona;
 INSERT INTO public.audit_logs(actor_id,accion,entidad,registro_id,resultado) VALUES(p_actor,'eliminar','personas',p_persona,'exito');
 RETURN jsonb_build_object('eliminado',true);
END $$;

CREATE OR REPLACE FUNCTION public.aplicar_retencion(p_actor uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE embeddings_count integer; logs_count integer;
BEGIN
 DELETE FROM public.face_embeddings f WHERE eliminar_despues_de<=now() OR EXISTS(
 SELECT 1 FROM public.consentimientos c WHERE c.id=f.consentimiento_id AND (c.revocado_at IS NOT NULL OR c.vence_at<=now()));
 GET DIAGNOSTICS embeddings_count=ROW_COUNT;
 UPDATE public.ml_models m SET calibrado=false WHERE EXISTS (
 SELECT 1 FROM public.ml_training_records r JOIN public.recognition_logs l ON l.id=r.recognition_log_id
 WHERE l.eliminar_despues_de<=now() AND ((m.parametros->'train_ids') ? r.id::text
 OR (m.parametros->'calibration_ids') ? r.id::text OR (m.parametros->'test_ids') ? r.id::text));
 DELETE FROM public.ml_training_records WHERE recognition_log_id IN (SELECT id FROM public.recognition_logs WHERE eliminar_despues_de<=now());
 DELETE FROM public.recognition_logs WHERE eliminar_despues_de<=now();
 GET DIAGNOSTICS logs_count=ROW_COUNT;
 INSERT INTO public.audit_logs(actor_id,accion,entidad,resultado,detalle) VALUES(p_actor,'retencion','sistema','exito',
 jsonb_build_object('embeddings',embeddings_count,'historial',logs_count));
 RETURN jsonb_build_object('embeddings_eliminados',embeddings_count,'historial_eliminado',logs_count);
END $$;

CREATE OR REPLACE FUNCTION public.resumen_dashboard()
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
 SELECT jsonb_build_object(
 'personas',(SELECT count(*) FROM public.personas),
 'activas',(SELECT count(*) FROM public.personas WHERE activo),
 'reconocimientos',(SELECT count(*) FROM public.recognition_logs),
 'coincidencias',(SELECT count(*) FROM public.recognition_logs WHERE coincide),
 'serie',COALESCE((SELECT jsonb_agg(t ORDER BY t.dia) FROM (
 SELECT to_char(created_at AT TIME ZONE 'UTC','YYYY-MM-DD') AS dia,count(*) AS intentos,
 count(*) FILTER(WHERE coincide) AS coincidencias FROM public.recognition_logs
 WHERE created_at>=now()-interval '14 days' GROUP BY 1) t),'[]'::jsonb));
$$;

-- No public RPC execution; roles are checked by FastAPI before service access.
REVOKE ALL ON FUNCTION public.registrar_persona(text,text,uuid,text,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.registrar_embedding(uuid,uuid,double precision[],text,text,double precision,timestamptz) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.revocar_persona(uuid,uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.eliminar_persona(uuid,uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.aplicar_retencion(uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.resumen_dashboard() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_persona(text,text,uuid,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.registrar_embedding(uuid,uuid,double precision[],text,text,double precision,timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.revocar_persona(uuid,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.eliminar_persona(uuid,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.aplicar_retencion(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.resumen_dashboard() TO service_role;
COMMIT;
