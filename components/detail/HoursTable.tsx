import type { OpeningHours } from "@/types/venue";
import { formatWeekly, nycNow } from "@/lib/hours";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function HoursTable({ hours }: { hours?: OpeningHours }) {
  const rows = formatWeekly(hours);
  if (!rows.length) return null;
  const today = DAY_NAMES[nycNow().day];

  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map((row) => {
          const i = row.indexOf(": ");
          const day = i >= 0 ? row.slice(0, i) : row;
          const time = i >= 0 ? row.slice(i + 2) : "";
          const isToday = day === today;
          return (
            <tr
              key={row}
              className={isToday ? "font-semibold text-zinc-900" : "text-zinc-600"}
            >
              <td className="py-0.5 pr-6">{day}</td>
              <td className="py-0.5 text-right tabular-nums">{time}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
