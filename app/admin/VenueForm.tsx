"use client";

import { useState } from "react";
import type { OpeningHours, Venue, VenueLocation } from "@/types/venue";
import { cn } from "@/lib/cn";
import { AMENITIES } from "@/lib/amenities";
import HoursEditor from "@/components/admin/HoursEditor";
import { enrichVenueAction } from "./actions";

type Props = {
  venue?: Venue;
  action: (formData: FormData) => Promise<void>;
};

const input =
  "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500";
const label = "block text-xs font-semibold uppercase tracking-wide text-zinc-500";

type LocRow = {
  address: string;
  lat: string;
  lng: string;
  neighborhood: string;
  borough: string;
  placeId: string;
  approxLocation: boolean;
  hours: OpeningHours | null;
};

const emptyLoc = (): LocRow => ({
  address: "",
  lat: "",
  lng: "",
  neighborhood: "",
  borough: "",
  placeId: "",
  approxLocation: false,
  hours: null,
});

function venueToLocRows(v?: Venue): LocRow[] {
  const locs = v?.locations ?? [];
  if (!locs.length) return [emptyLoc()];
  return locs.map((l) => ({
    address: l.address ?? "",
    lat: l.coordinates?.lat?.toString() ?? "",
    lng: l.coordinates?.lng?.toString() ?? "",
    neighborhood: l.neighborhood ?? "",
    borough: l.borough ?? "",
    placeId: l.placeId ?? "",
    approxLocation: l.approxLocation ?? false,
    hours: l.hours ?? null,
  }));
}

function locRowsToVenueLocations(rows: LocRow[]): VenueLocation[] {
  return rows
    .filter((r) => r.address.trim() && r.lat.trim() && r.lng.trim())
    .map((r) => ({
      address: r.address.trim(),
      neighborhood: r.neighborhood.trim() || undefined,
      borough: r.borough.trim() || undefined,
      coordinates: { lat: Number(r.lat), lng: Number(r.lng) },
      placeId: r.placeId.trim() || undefined,
      hours: r.hours ?? undefined,
      approxLocation: r.approxLocation || undefined,
    }));
}

export default function VenueForm({ venue, action }: Props) {
  const [f, setF] = useState({
    name: venue?.name ?? "",
    category: venue?.category ?? "bar",
    types: (venue?.types ?? []).join(", "),
    cuisines: (venue?.cuisines ?? []).join(", "),
    neighborhood: venue?.neighborhood ?? "",
    rating: venue?.rating?.toString() ?? "",
    priceLevel: venue?.priceLevel?.toString() ?? "",
    happyHour:
      venue?.happyHour === true ? "yes" : venue?.happyHour === false ? "no" : "unknown",
    happyHourDetails: venue?.happyHourDetails ?? "",
    reservationPolicy: venue?.reservationPolicy ?? "unknown",
    reservationRaw: venue?.reservationRaw ?? "",
    bookingUrl: venue?.booking?.url ?? "",
    bookingHost: venue?.booking?.host ?? "other",
    menuUrl: venue?.menuUrl ?? "",
    website: venue?.website ?? "",
    instagram: venue?.instagram ?? "",
    googleMapsUri: venue?.googleMapsUri ?? "",
    photoUrl: venue?.photoUrl ?? "",
    otherInfo: venue?.otherInfo ?? "",
    editorialNote: venue?.editorialNote ?? "",
  });
  const [featured, setFeatured] = useState(venue?.featured ?? false);
  const [unverified, setUnverified] = useState(venue?.unverified ?? false);
  const [locations, setLocations] = useState<LocRow[]>(() => venueToLocRows(venue));
  // Bumped on enrich to re-seed the primary location's HoursEditor.
  const [enrichSeq, setEnrichSeq] = useState(0);
  const [amenities, setAmenities] = useState<string[]>(venue?.amenities ?? []);
  const [photos, setPhotos] = useState<{ url: string; caption: string }[]>(() =>
    (venue?.photos ?? []).map((p) => ({ url: p.url, caption: p.caption ?? "" }))
  );
  const [hhWindows, setHhWindows] = useState<OpeningHours | null>(venue?.happyHourWindows ?? null);
  const [enriching, setEnriching] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [hhMenu, setHhMenu] = useState<{ item: string; price: string }[]>(() =>
    (venue?.happyHourMenu ?? []).map((m) => ({ item: m.item, price: m.price ?? "" }))
  );

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }));

  // --- locations ---
  const patchLocation = (i: number, patch: Partial<LocRow>) =>
    setLocations((rows) => rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const addLocation = () => setLocations((rows) => [...rows, emptyLoc()]);
  const removeLocation = (i: number) => setLocations((rows) => rows.filter((_, j) => j !== i));
  const setLoc = (i: number, k: keyof LocRow) => (e: React.ChangeEvent<HTMLInputElement>) =>
    patchLocation(i, { [k]: e.target.value } as Partial<LocRow>);

  // --- amenities ---
  const toggleAmenity = (a: string) =>
    setAmenities((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]));

  // --- photos ---
  const addPhoto = () => setPhotos((p) => [...p, { url: "", caption: "" }]);
  const removePhoto = (i: number) => setPhotos((p) => p.filter((_, j) => j !== i));
  const patchPhoto = (i: number, patch: Partial<{ url: string; caption: string }>) =>
    setPhotos((p) => p.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  // --- happy-hour deals ---
  const addItem = () => setHhMenu((m) => [...m, { item: "", price: "" }]);
  const removeItem = (i: number) => setHhMenu((m) => m.filter((_, j) => j !== i));
  const patchItem = (i: number, patch: Partial<{ item: string; price: string }>) =>
    setHhMenu((m) => m.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  async function enrich() {
    if (!f.name.trim()) {
      setMsg("Enter a name first.");
      return;
    }
    setEnriching(true);
    setMsg(null);
    try {
      const r = await enrichVenueAction(f.name.trim(), locations[0]?.address.trim() || undefined);
      if (!r.found) {
        setMsg(r.error ? `Enrich failed: ${r.error}` : "No Google match found.");
        return;
      }
      setF((prev) => ({
        ...prev,
        name: r.name ?? prev.name,
        cuisines: r.cuisines?.length ? r.cuisines.join(", ") : prev.cuisines,
        types: prev.category === "bar" && r.suggestedType && !prev.types ? r.suggestedType : prev.types,
        rating: r.rating?.toString() ?? prev.rating,
        priceLevel: r.priceLevel?.toString() ?? prev.priceLevel,
        neighborhood: r.location?.neighborhood ?? prev.neighborhood,
        website: r.website ?? prev.website,
        googleMapsUri: r.googleMapsUri ?? prev.googleMapsUri,
        photoUrl: r.photoUrl ?? prev.photoUrl,
      }));
      setLocations((rows) => {
        const next = rows.length ? [...rows] : [emptyLoc()];
        const cur = next[0];
        next[0] = {
          ...cur,
          address: r.location?.address ?? cur.address,
          lat: r.location?.coordinates.lat?.toString() ?? cur.lat,
          lng: r.location?.coordinates.lng?.toString() ?? cur.lng,
          neighborhood: r.location?.neighborhood ?? cur.neighborhood,
          borough: r.location?.borough ?? cur.borough,
          placeId: r.location?.placeId ?? cur.placeId,
          hours: r.location?.hours ?? cur.hours,
        };
        return next;
      });
      setEnrichSeq((n) => n + 1);
      if (r.closed) setMsg("⚠ Google marks this place permanently closed.");
      else setMsg(`Enriched (match confidence ${(r.confidence * 100).toFixed(0)}%).`);
    } catch (e) {
      setMsg(`Enrich failed: ${(e as Error).message}`);
    } finally {
      setEnriching(false);
    }
  }

  return (
    <form action={action} className="space-y-5">
      {venue && <input type="hidden" name="id" value={venue.id} />}
      <input type="hidden" name="reservationRaw" value={f.reservationRaw} />
      <input type="hidden" name="locationsJson" value={JSON.stringify(locRowsToVenueLocations(locations))} />
      <input type="hidden" name="amenitiesJson" value={JSON.stringify(amenities)} />
      <input type="hidden" name="photosJson" value={JSON.stringify(photos.filter((p) => p.url.trim()))} />

      <div className="flex flex-wrap items-end gap-3 rounded-lg bg-zinc-50 p-3">
        <div className="flex-1">
          <label className={label}>Name</label>
          <input name="name" required value={f.name} onChange={set("name")} className={input} />
        </div>
        <button
          type="button"
          onClick={enrich}
          disabled={enriching}
          className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {enriching ? "Enriching…" : "Enrich from Google"}
        </button>
      </div>
      {msg && <p className="text-sm text-zinc-600">{msg}</p>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Category</label>
          <select name="category" value={f.category} onChange={set("category")} className={input}>
            <option value="bar">Bar</option>
            <option value="restaurant">Restaurant</option>
          </select>
        </div>
        <div>
          <label className={label}>Price (1–4)</label>
          <select name="priceLevel" value={f.priceLevel} onChange={set("priceLevel")} className={input}>
            <option value="">—</option>
            <option value="1">$</option>
            <option value="2">$$</option>
            <option value="3">$$$</option>
            <option value="4">$$$$</option>
          </select>
        </div>
        <div>
          <label className={label}>Types (comma-separated)</label>
          <input name="types" value={f.types} onChange={set("types")} className={input} placeholder="Bar, Cocktail Bar" />
        </div>
        <div>
          <label className={label}>Cuisines (comma-separated)</label>
          <input name="cuisines" value={f.cuisines} onChange={set("cuisines")} className={input} placeholder="Italian" />
        </div>
        <div>
          <label className={label}>Rating</label>
          <input name="rating" value={f.rating} onChange={set("rating")} className={input} inputMode="decimal" />
        </div>
        <div>
          <label className={label}>Neighborhood</label>
          <input name="neighborhood" value={f.neighborhood} onChange={set("neighborhood")} className={input} />
        </div>
      </div>

      <fieldset className="rounded-lg border border-zinc-200 p-3">
        <legend className="px-1 text-sm font-semibold text-zinc-700">
          Locations ({locations.length})
        </legend>
        <div className="space-y-4">
          {locations.map((loc, i) => (
            <div key={i} className="rounded-lg border border-zinc-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {i === 0 ? "Primary location" : `Location ${i + 1}`}
                </span>
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => removeLocation(i)}
                    className="text-xs font-medium text-zinc-400 hover:text-rose-600"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={label}>Address</label>
                  <input value={loc.address} onChange={setLoc(i, "address")} className={input} required={i === 0} />
                </div>
                <div>
                  <label className={label}>Latitude</label>
                  <input value={loc.lat} onChange={setLoc(i, "lat")} className={input} inputMode="decimal" required={i === 0} />
                </div>
                <div>
                  <label className={label}>Longitude</label>
                  <input value={loc.lng} onChange={setLoc(i, "lng")} className={input} inputMode="decimal" required={i === 0} />
                </div>
                <div>
                  <label className={label}>Neighborhood</label>
                  <input value={loc.neighborhood} onChange={setLoc(i, "neighborhood")} className={input} />
                </div>
                <div>
                  <label className={label}>Borough</label>
                  <input value={loc.borough} onChange={setLoc(i, "borough")} className={input} />
                </div>
                <div>
                  <label className={label}>Place ID</label>
                  <input value={loc.placeId} onChange={setLoc(i, "placeId")} className={input} />
                </div>
                <label className="flex items-center gap-2 self-end text-sm text-zinc-700">
                  <input
                    type="checkbox"
                    checked={loc.approxLocation}
                    onChange={(e) => patchLocation(i, { approxLocation: e.target.checked })}
                  />
                  Approximate location
                </label>
              </div>
              <div className="mt-3">
                <p className={label}>Hours</p>
                {loc.hours?.weekdayText?.length ? (
                  <p className="mt-1 text-xs text-zinc-400">
                    Google: {loc.hours.weekdayText.join(" · ")}
                  </p>
                ) : null}
                <div className="mt-1">
                  <HoursEditor
                    key={`loc-hours-${i}-${enrichSeq}`}
                    initial={loc.hours}
                    onChange={(oh) => patchLocation(i, { hours: oh })}
                    addLabel="+ Add hours row"
                    emptyLabel="No structured hours."
                    defaultStart="11:00"
                    defaultEnd="23:00"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={addLocation} className="mt-3 text-sm font-medium text-rose-600 hover:underline">
          + Add location
        </button>
      </fieldset>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Happy hour</label>
          <select name="happyHour" value={f.happyHour} onChange={set("happyHour")} className={input}>
            <option value="unknown">Unknown</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
        <div>
          <label className={label}>Reservations</label>
          <select name="reservationPolicy" value={f.reservationPolicy} onChange={set("reservationPolicy")} className={input}>
            <option value="unknown">Unknown</option>
            <option value="reservations">Reservations</option>
            <option value="walk-in">Walk-in</option>
            <option value="mixed">Both</option>
          </select>
        </div>
        <div className="col-span-2">
          <fieldset className="rounded-lg border border-zinc-200 p-3">
            <legend className="px-1 text-sm font-semibold text-zinc-700">Happy hour</legend>
            <input type="hidden" name="happyHourWindowsJson" value={JSON.stringify(hhWindows)} />
            <input type="hidden" name="happyHourMenuJson" value={JSON.stringify(hhMenu)} />

            <p className={label}>Times</p>
            <div className="mt-1">
              <HoursEditor initial={venue?.happyHourWindows} onChange={setHhWindows} />
            </div>

            <p className={cn(label, "mt-4")}>Deals (item + price)</p>
            <div className="mt-1 space-y-2">
              {hhMenu.map((m, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={m.item} onChange={(e) => patchItem(i, { item: e.target.value })} placeholder="Draft beers" className="flex-1 rounded-md border border-zinc-300 px-2 py-1 text-sm" />
                  <input value={m.price} onChange={(e) => patchItem(i, { price: e.target.value })} placeholder="$5" className="w-24 rounded-md border border-zinc-300 px-2 py-1 text-sm" />
                  <button type="button" onClick={() => removeItem(i)} className="text-xs font-medium text-zinc-400 hover:text-rose-600">
                    Remove
                  </button>
                </div>
              ))}
              {hhMenu.length === 0 && <p className="text-sm text-zinc-400">No deals yet.</p>}
            </div>
            <button type="button" onClick={addItem} className="mt-2 text-sm font-medium text-rose-600 hover:underline">
              + Add deal
            </button>

            <div className="mt-4">
              <label className={label}>Notes (optional)</label>
              <textarea name="happyHourDetails" value={f.happyHourDetails} onChange={set("happyHourDetails")} className={input} rows={2} />
            </div>
          </fieldset>
        </div>
        <div>
          <label className={label}>Booking URL</label>
          <input name="bookingUrl" value={f.bookingUrl} onChange={set("bookingUrl")} className={input} />
        </div>
        <div>
          <label className={label}>Booking host</label>
          <select name="bookingHost" value={f.bookingHost} onChange={set("bookingHost")} className={input}>
            <option value="resy">Resy</option>
            <option value="opentable">OpenTable</option>
            <option value="tock">Tock</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className={label}>Website</label>
          <input name="website" value={f.website} onChange={set("website")} className={input} />
        </div>
        <div>
          <label className={label}>Menu URL</label>
          <input name="menuUrl" value={f.menuUrl} onChange={set("menuUrl")} className={input} />
        </div>
        <div>
          <label className={label}>Instagram</label>
          <input name="instagram" value={f.instagram} onChange={set("instagram")} className={input} />
        </div>
        <div>
          <label className={label}>Photo URL (primary)</label>
          <input name="photoUrl" value={f.photoUrl} onChange={set("photoUrl")} className={input} />
        </div>
        <input type="hidden" name="googleMapsUri" value={f.googleMapsUri} />
        <div className="col-span-2">
          <label className={label}>Other info</label>
          <input name="otherInfo" value={f.otherInfo} onChange={set("otherInfo")} className={input} />
        </div>
        <div className="col-span-2">
          <label className={label}>Editorial note</label>
          <textarea name="editorialNote" value={f.editorialNote} onChange={set("editorialNote")} className={input} rows={2} />
        </div>
      </div>

      <fieldset className="rounded-lg border border-zinc-200 p-3">
        <legend className="px-1 text-sm font-semibold text-zinc-700">Amenities</legend>
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map((a) => (
            <button
              type="button"
              key={a}
              onClick={() => toggleAmenity(a)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition",
                amenities.includes(a)
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400"
              )}
            >
              {a}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="rounded-lg border border-zinc-200 p-3">
        <legend className="px-1 text-sm font-semibold text-zinc-700">Photo gallery</legend>
        <div className="space-y-2">
          {photos.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <input value={p.url} onChange={(e) => patchPhoto(i, { url: e.target.value })} placeholder="https://…/photo.jpg" className="flex-1 rounded-md border border-zinc-300 px-2 py-1 text-sm" />
              <input value={p.caption} onChange={(e) => patchPhoto(i, { caption: e.target.value })} placeholder="Caption (optional)" className="w-44 rounded-md border border-zinc-300 px-2 py-1 text-sm" />
              <button type="button" onClick={() => removePhoto(i)} className="text-xs font-medium text-zinc-400 hover:text-rose-600">
                Remove
              </button>
            </div>
          ))}
          {photos.length === 0 && <p className="text-sm text-zinc-400">No gallery photos yet.</p>}
        </div>
        <button type="button" onClick={addPhoto} className="mt-2 text-sm font-medium text-rose-600 hover:underline">
          + Add photo
        </button>
      </fieldset>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input type="checkbox" name="featured" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input type="checkbox" name="unverified" checked={unverified} onChange={(e) => setUnverified(e.target.checked)} />
          Unverified
        </label>
      </div>

      <button type="submit" className="rounded-full bg-rose-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-rose-700">
        Save venue
      </button>
    </form>
  );
}
