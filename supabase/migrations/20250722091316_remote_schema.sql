drop policy "Service role can manage cron job logs" on "public"."cron_job_logs";

revoke delete on table "public"."cron_job_logs" from "anon";

revoke insert on table "public"."cron_job_logs" from "anon";

revoke references on table "public"."cron_job_logs" from "anon";

revoke select on table "public"."cron_job_logs" from "anon";

revoke trigger on table "public"."cron_job_logs" from "anon";

revoke truncate on table "public"."cron_job_logs" from "anon";

revoke update on table "public"."cron_job_logs" from "anon";

revoke delete on table "public"."cron_job_logs" from "authenticated";

revoke insert on table "public"."cron_job_logs" from "authenticated";

revoke references on table "public"."cron_job_logs" from "authenticated";

revoke select on table "public"."cron_job_logs" from "authenticated";

revoke trigger on table "public"."cron_job_logs" from "authenticated";

revoke truncate on table "public"."cron_job_logs" from "authenticated";

revoke update on table "public"."cron_job_logs" from "authenticated";

revoke delete on table "public"."cron_job_logs" from "service_role";

revoke insert on table "public"."cron_job_logs" from "service_role";

revoke references on table "public"."cron_job_logs" from "service_role";

revoke select on table "public"."cron_job_logs" from "service_role";

revoke trigger on table "public"."cron_job_logs" from "service_role";

revoke truncate on table "public"."cron_job_logs" from "service_role";

revoke update on table "public"."cron_job_logs" from "service_role";

drop function if exists "public"."get_cron_job_status"(job_name_filter text);

drop function if exists "public"."process_overdue_checkins_cron"();

drop function if exists "public"."trigger_overdue_processing"();

alter table "public"."cron_job_logs" drop constraint "cron_job_logs_pkey";

drop index if exists "public"."cron_job_logs_pkey";

drop index if exists "public"."idx_cron_job_logs_executed_at";

drop index if exists "public"."idx_cron_job_logs_job_name";

drop table "public"."cron_job_logs";

drop sequence if exists "public"."cron_job_logs_id_seq";


