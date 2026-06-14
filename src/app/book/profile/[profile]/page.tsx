import BookPage from "@/app/book/page";

export const dynamic = "force-dynamic";

export default async function ProfileBookPage({ params }: { params: Promise<{ profile: string }> }) {
  const { profile } = await params;

  return <BookPage searchParams={Promise.resolve({ profile })} />;
}
