import { revalidatePath } from "next/cache";
import { AdminCancelBookingButton } from "@/components/admin-cancel-booking-button";
import { AdminDeleteBookingButton } from "@/components/admin-delete-booking-button";
import { AdminNav } from "@/components/admin-nav";
import { requireAdmin } from "@/lib/admin";
import { deleteBookingCalendarEvent } from "@/lib/calendar/delete-booking-event";
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
    .select("*, booking_types(name, profile_id), booking_change_requests(id, proposed_starts_at, message, status, created_at)")
    .order("starts_at", { ascending: false })
    .limit(100);
  const profileIds = Array.from(
    new Set(
      (bookings || [])
        .map((booking) => booking.booking_types?.profile_id)
        .filter((profileId): profileId is string => typeof profileId === "string" && profileId.length > 0)
    )
  );
  const { data: profiles } = profileIds.length
    ? await supabase.from("booking_profiles").select("id, name").in("id", profileIds)
    : { data: [] as Array<{ id: string; name: string | null }> };
  const profileNameById = new Map((profiles || []).map((profile) => [profile.id, profile.name || "Standardprofil"]));

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
        await deleteBookingCalendarEvent({
          eventId: booking.calendar_event_id,
          eventUrl: booking.calendar_event_url
        });
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

  async function deleteBooking(formData: FormData) {
    "use server";

    await requireAdmin();
    const bookingId = String(formData.get("bookingId") || "");

    if (!bookingId) {
      return;
    }

    const supabase = createSupabaseAdmin();
    const { data: booking } = await supabase.from("bookings").select("id, status, ends_at").eq("id", bookingId).maybeSingle();

    if (!booking) {
      revalidatePath("/admin/bookings");
      return;
    }

    const isCancelled = booking.status === "cancelled";
    const isExpired = new Date(booking.ends_at).getTime() < Date.now();

    if (!isCancelled && !isExpired) {
      revalidatePath("/admin/bookings");
      return;
    }

    await supabase.from("bookings").delete().eq("id", booking.id);

    revalidatePath("/admin/bookings");
  }

  return (
    <section className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-950">Buchungsübersicht</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Hier verwalten Sie eingegangene Termine. Zukünftige bestätigte Termine werden storniert. Stornierte oder abgelaufene Termine können dauerhaft aus der Übersicht gelöscht werden.
          </p>
        </div>
      </div>
      <AdminNav />
      <div className="mt-8 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[1050px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Termin</th>
              <th className="px-4 py-3">Kunde</th>
              <th className="px-4 py-3">Herkunft / Ort</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Aktion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {(bookings || []).map((booking) => {
              const isExpired = new Date(booking.ends_at).getTime() < Date.now();
              const canDelete = booking.status === "cancelled" || isExpired;
              const canCancel = booking.status === "confirmed" && !isExpired;

              return (
                <tr key={booking.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-950">{booking.booking_types?.name}</p>
                    <p className="text-slate-500">
                      {formatGermanDate(new Date(booking.starts_at))}, {formatGermanTime(new Date(booking.starts_at))}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Eingetragen am {formatGermanDate(new Date(booking.created_at))}, {formatGermanTime(new Date(booking.created_at))}
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
                    <p className="font-medium text-slate-950">{booking.company}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">Profil: {getProfileName(booking.booking_types, profileNameById)}</p>
                    <p className="text-xs text-slate-500">Terminort: {getMeetingLocationLabel(booking.meeting_location)}</p>
                    <p className="text-xs text-slate-500">Kalender: {getCalendarProviderLabel(booking.calendar_event_url || booking.calendar_event_id)}</p>
                    <MeetingDetails meetingLocation={booking.meeting_location} meetingUrl={booking.meeting_url} phone={booking.phone} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={booking.status} isExpired={isExpired} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {canCancel ? <AdminCancelBookingButton action={cancelBooking} bookingId={booking.id} customerName={booking.customer_name} /> : null}
                      {canDelete ? <AdminDeleteBookingButton action={deleteBooking} bookingId={booking.id} customerName={booking.customer_name} /> : null}
                      {!canCancel && !canDelete ? <span className="text-xs text-slate-400">Keine Aktion</span> : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StatusBadge({ status, isExpired }: { status: string; isExpired: boolean }) {
  if (status === "confirmed" && isExpired) {
    return <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">Abgelaufen</span>;
  }

  if (status === "confirmed") {
    return <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Bestätigt</span>;
  }

  return <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">Storniert</span>;
}

function getProfileName(bookingType: { profile_id?: string | null } | null | undefined, profileNameById: Map<string, string>) {
  return bookingType?.profile_id ? profileNameById.get(bookingType.profile_id) || "Standardprofil" : "Standardprofil";
}

function getCalendarProviderLabel(calendarReference: string | null | undefined) {
  const value = (calendarReference || "").toLowerCase();

  if (value.includes("google.com") || value.includes("googleapis.com")) {
    return "Google Kalender";
  }

  if (value.includes("outlook") || value.includes("office.com") || value.includes("microsoft")) {
    return "Microsoft 365 / Outlook";
  }

  if (value.includes("icloud.com") || value.includes("caldav")) {
    return "Apple CalDAV";
  }

  return calendarReference ? "Kalender eingetragen" : "Noch kein Kalendereintrag";
}

function MeetingDetails({ meetingLocation, meetingUrl, phone }: { meetingLocation: string; meetingUrl: string | null; phone: string | null }) {
  if (meetingLocation === "zoom") {
    return meetingUrl ? (
      <a
        href={meetingUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-1 block max-w-xs break-all text-xs font-semibold text-brand-600 hover:text-brand-700"
      >
        {meetingUrl}
      </a>
    ) : (
      <p className="mt-1 text-xs text-slate-400">Kein Zoom-Link gespeichert</p>
    );
  }

  if (meetingLocation === "phone") {
    return phone ? (
      <a href={`tel:${phone.replace(/\s+/g, "")}`} className="mt-1 inline-flex text-xs font-semibold text-brand-600 hover:text-brand-700">
        {phone}
      </a>
    ) : (
      <p className="mt-1 text-xs text-slate-400">Keine Telefonnummer gespeichert</p>
    );
  }

  if (meetingUrl) {
    return (
      <a
        href={meetingUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-1 block max-w-xs break-all text-xs font-semibold text-brand-600 hover:text-brand-700"
      >
        {meetingUrl}
      </a>
    );
  }

  return null;
}
