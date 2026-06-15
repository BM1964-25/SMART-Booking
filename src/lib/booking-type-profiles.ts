import { createSupabaseAdmin } from "@/lib/supabase/admin";

export type BookingTypeProfileAssignment = {
  booking_type_id: string;
  profile_id: string;
};

export async function getBookingTypeProfileAssignments() {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("booking_type_profiles")
    .select("booking_type_id, profile_id")
    .returns<BookingTypeProfileAssignment[]>();

  if (error) {
    return [];
  }

  return data || [];
}

export async function getBookingTypeIdsForProfile(profileId: string) {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("booking_type_profiles")
    .select("booking_type_id")
    .eq("profile_id", profileId)
    .returns<Array<Pick<BookingTypeProfileAssignment, "booking_type_id">>>();

  if (error) {
    return null;
  }

  return new Set((data || []).map((assignment) => assignment.booking_type_id));
}

export async function replaceBookingTypeProfileAssignments(bookingTypeId: string, profileIds: string[]) {
  const supabase = createSupabaseAdmin();
  await supabase.from("booking_type_profiles").delete().eq("booking_type_id", bookingTypeId);

  const uniqueProfileIds = Array.from(new Set(profileIds.filter(Boolean)));

  if (uniqueProfileIds.length > 0) {
    await supabase.from("booking_type_profiles").insert(
      uniqueProfileIds.map((profileId) => ({
        booking_type_id: bookingTypeId,
        profile_id: profileId
      }))
    );
  }
}
