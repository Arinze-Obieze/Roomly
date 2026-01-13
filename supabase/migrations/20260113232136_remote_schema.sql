drop policy "Allow insert for authenticated users" on "public"."properties";

drop policy "Allow insert for authenticated users" on "public"."property_media";

drop policy "Allow insert via service role" on "public"."users";

drop policy "Users can update own data" on "public"."users";

drop policy "Users can view own data" on "public"."users";

CREATE INDEX idx_properties_active_created ON public.properties USING btree (is_active, created_at DESC);


  create policy "Allow authenticated users to insert properties"
  on "public"."properties"
  as permissive
  for insert
  to authenticated
with check ((listed_by_user_id = auth.uid()));



  create policy "Allow public to view active properties"
  on "public"."properties"
  as permissive
  for select
  to public
using ((is_active = true));



  create policy "Allow users to delete own properties"
  on "public"."properties"
  as permissive
  for delete
  to authenticated
using ((listed_by_user_id = auth.uid()));



  create policy "Allow users to update own properties"
  on "public"."properties"
  as permissive
  for update
  to authenticated
using ((listed_by_user_id = auth.uid()))
with check ((listed_by_user_id = auth.uid()));



  create policy "Allow users to view own properties"
  on "public"."properties"
  as permissive
  for select
  to authenticated
using ((listed_by_user_id = auth.uid()));



  create policy "Allow authenticated users to insert media"
  on "public"."property_media"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = property_media.property_id) AND (properties.listed_by_user_id = auth.uid())))));



  create policy "Allow public to view property media"
  on "public"."property_media"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = property_media.property_id) AND (properties.is_active = true)))));



  create policy "Allow users to delete own property media"
  on "public"."property_media"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = property_media.property_id) AND (properties.listed_by_user_id = auth.uid())))));



  create policy "Allow users to view own property media"
  on "public"."property_media"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = property_media.property_id) AND (properties.listed_by_user_id = auth.uid())))));



  create policy "Allow authenticated inserts via API"
  on "public"."users"
  as permissive
  for insert
  to anon, authenticated
with check (true);



  create policy "Allow service role to insert users"
  on "public"."users"
  as permissive
  for insert
  to service_role
with check (true);



  create policy "Public can view basic user info"
  on "public"."users"
  as permissive
  for select
  to public
using (true);



  create policy "Users can update own profile"
  on "public"."users"
  as permissive
  for update
  to authenticated
using ((id = auth.uid()))
with check ((id = auth.uid()));



  create policy "Users can view own profile"
  on "public"."users"
  as permissive
  for select
  to authenticated
using ((id = auth.uid()));



  create policy "Authenticated deletes luhpm4_0"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using ((bucket_id = 'property-media'::text));



  create policy "Authenticated deletes luhpm4_1"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = 'property-media'::text));



  create policy "Authenticated uploads luhpm4_0"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'property-media'::text));



  create policy "Public Avatars Access"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'avatars'::text));



  create policy "Public reads luhpm4_0"
  on "storage"."objects"
  as permissive
  for select
  to anon
using ((bucket_id = 'property-media'::text));



  create policy "Users can delete own avatar"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'avatars'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Users can update own avatar"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'avatars'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Users can upload own avatar"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'avatars'::text) AND (auth.role() = 'authenticated'::text)));



