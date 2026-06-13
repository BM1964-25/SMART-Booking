import { revalidatePath } from "next/cache";
import { AdminCancelBookingButton } from "@/components/admin-cancel-booking-button";
import { AdminNav } from "@/components/admin-nav";
import { requireAdmin } from "@/lib/admin";
import { deleteEvent } from "@/lib/calendar/caldav";
import { formatGermanDate, formatGermanTime } from "@/lib/date";
import { sendBookingCancellationEmails } from "@/lib/email";
import { getMeetingLocationLabel } from "@/lib/meeting-location";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  await requireAdmin();
  const supabase = createSupabaseAdmin();
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, booking_types(name), booking_change_requests(id, proposed_starts_at, message, status, created_at)")
    .order("starts_at", { ascending: false })
    .limit(100);

  async function cancelBooking(formData: FormData) {
    "use server";

    await requireAdmin();
    const bookingId = String(formData.get("bookingId") || "");

    if (!bookingId) {
      return;
    }

    const supabase = createSupabaseAdmin();
    const { data: booking } = await supabase
      .from("bookings")
      .select("*, booking_types(*)")
      .eq("id", bookingId)
      .eq("status", "confirmed")
      .maybeSingle();

    if (!booking) {
      revalidatePath("/admin/bookings");
      return;
    }

    if (booking.calendar_event_id) {
      try {
        await deleteEvent(booking.calendar_event_id);
      } catch {
        // The admin cancellation should still be recorded if the calendar object was already removed.
      }
    }

    await supabase.from("bookings").update({ status: "cancelled" }).eq("id", booking.id);

    if (booking.booking_types) {
      try {
        await sendBookingCancellationEmails({ ...booking, bookingType: booking.booking_types });
      } catch (error) {
        console.error("Cancellation email delivery failed", error);
      }
    }

    revalidatePath("/admin/bookings");
    revalidatePath("/book");
  }

  return (
    <section className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-950">Buchungsübersicht</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Hier verwalten Sie eingegangene Termine. Beim Stornieren wird der Apple-Kalendereintrag entfernt, die Buchung nachvollziehbar als storniert markiert und der Kunde per E-Mail informiert, sobald Brevo SMTP eingerichtet ist.
          </p>
        </div>
      </div>
      <AdminNav />
      <div className="mt-8 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Termin</th>
              <th className="px-4 py-3">Kunde</th>
              <th className="px-4 py-3">Unternehmen / Ort</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Aktion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {(bookings || []).map((booking) => (
              <tr key={booking.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-950">{booking.booking_types?.name}</p>
                  <p className="text-slate-500">
                    {formatGermanDate(new Date(booking.starts_at))}, {formatGermanTime(new Date(booking.starts_at))}
                  </p>
                  {booking.booking_change_requests?.length ? (
                    <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                      <p className="font-semibold">Änderungsvorschlag</p>
                      {booking.booking_change_requests.map(
                        (request: { id: string; proposed_starts_at: string | null; message: string; status: string }) => (
                          <div key={request.id} className="mt-2">
                            {request.proposed_starts_at ? (
                              <p>
                                Wunsch: {formatGermanDate(new Date(request.proposed_starts_at))},{" "}
                                {formatGermanTime(new Date(request.proposed_starts_at))}
                              </p>
                            ) : null}
                            <p>{request.message}</p>
                            <p>Status: {request.status}</p>
                          </div>
                        )
                      )}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-950">{booking.customer_name}</p>
                  <p className="text-slate-500">{booking.customer_email}</p>
                </td>
                <td className="px-4 py-3">
                  <p>{booking.company}</p>
                  <p className="text-slate-500">{getMeetingLocationLabel(booking.meeting_location)}</p>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={booking.status} />
                </td>
                <td className="px-4 py-3">
                  {booking.status === "confirmed" ? (
                    <AdminCancelBookingButton action={cancelBooking} bookingId={booking.id} customerName={booking.customer_name} />
                  ) : (
                    <span className="text-xs text-slate-400">Keine Aktion</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "confirmed") {
    return <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Bestätigt</span>;
  }

  return <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">Storniert</span>;
}
