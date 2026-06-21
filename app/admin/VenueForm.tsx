"use client";

import { useState } from "react";
import type { OpeningHours, Venue } from "@/types/venue";
import { enrichVenueAction } from "./actions";

type Props = {
  venue?: Venue;
  action: (formData: FormData) => Promise<void>;
};

const input =
  "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500";
const label = "block text-xs font-semibold uppercase tracking-wide text-zinc-500";

export default function VenueForm({ venue, action }: Props) {
  const primary = venue?.locations?.[0];
  const extraLocations = venue?.locations?.slice(1) ?? [];

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
    locAddress: primary?.address ?? "",
    locLat: primary?.coordinates.lat?.toString() ?? "",
    locLng: primary?.coordinates.lng?.toString() ?? "",
    locNeighborhood: primary?.neighborhood ?? "",
    locBorough: primary?.borough ?? "",
    locPlaceId: primary?.placeId ?? "",
  });
  const [featured, setFeatured] = useState(venue?.featured ?? false);
  const [unverified, setUnverified] = useState(venue?.unverified ?? false);
  const [primaryHours, setPrimaryHours] = useState<OpeningHours | null>(primary?.hours ?? null);
  const [enriching, setEnriching] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }));

  async function enrich() {
    if (!f.name.trim()) {
      setMsg("Enter a name first.");
      return;
    }
    setEnriching(true);
    setMsg(null);
    try {
      const r = await enrichVenueAction(f.name.trim(), f.locAddress.trim() || undefined);
      if (!r.found) {
        setMsg("No Google match found.");
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
        locAddress: r.location?.address ?? prev.locAddress,
        locLat: r.location?.coordinates.lat?.toString() ?? prev.locLat,
        locLng: r.location?.coordinates.lng?.toString() ?? prev.locLng,
        locNeighborhood: r.location?.neighborhood ?? prev.locNeighborhood,
        locBorough: r.location?.borough ?? prev.locBorough,
        locPlaceId: r.location?.placeId ?? prev.locPlaceId,
      }));
      setPrimaryHours(r.location?.hours ?? null);
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
      <input type="hidden" name="primaryHoursJson" value={JSON.stringify(primaryHours)} />
      <input type="hidden" name="extraLocationsJson" value={JSON.stringify(extraLocations)} />
      <input type="hidden" name="locPlaceId" value={f.locPlaceId} />

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
        <legend className="px-1 text-sm font-semibold text-zinc-700">Primary location</legend>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={label}>Address</label>
            <input name="locAddress" value={f.locAddress} onChange={set("locAddress")} className={input} required />
          </div>
          <div>
            <label className={label}>Latitude</label>
            <input name="locLat" value={f.locLat} onChange={set("locLat")} className={input} inputMode="decimal" required />
          </div>
          <div>
            <label className={label}>Longitude</label>
            <input name="locLng" value={f.locLng} onChange={set("locLng")} className={input} inputMode="decimal" required />
          </div>
          <div>
            <label className={label}>Loc. neighborhood</label>
            <input name="locNeighborhood" value={f.locNeighborhood} onChange={set("locNeighborhood")} className={input} />
          </div>
          <div>
            <label className={label}>Borough</label>
            <input name="locBorough" value={f.locBorough} onChange={set("locBorough")} className={input} />
          </div>
        </div>
        {extraLocations.length > 0 && (
          <p className="mt-2 text-xs text-zinc-500">
            + {extraLocations.length} more location(s) preserved (edit via Enrich or DB).
          </p>
        )}
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
          <label className={label}>Happy hour details</label>
          <textarea name="happyHourDetails" value={f.happyHourDetails} onChange={set("happyHourDetails")} className={input} rows={2} />
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
          <label className={label}>Photo URL</label>
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
