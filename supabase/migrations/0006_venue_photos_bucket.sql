-- Public storage bucket for admin-uploaded venue photos (logo + tagged gallery).
-- Public so optimized images serve through next/image. Uploads go through the
-- service-role client (bypasses RLS), so no insert policy is required here.
insert into storage.buckets (id, name, public)
values ('venue-photos', 'venue-photos', true)
on conflict (id) do nothing;
