import BookPage from "@/app/book/page";

export const dynamic = "force-dynamic";

export default async function ProfileBookPage({
  params,
  searchParams
}: {
  params: Promise<{ profile: string }>;
  searchParams?: Promise<{ preview?: string }>;
}) {
  const { profile } = await params;
  const { preview } = (await searchParams) || {};

  return <BookPage searchParams={Promise.resolve({ profile, preview })} />;
}
