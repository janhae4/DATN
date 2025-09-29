import Link from "next/link";
import type { Metadata } from "next";
import Actions from "@/components/meeting/Actions";

interface MeetingPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: MeetingPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Meeting ${id}`,
    description: `Details and actions for meeting ${id}`,
  };
}

export default async function MeetingPage_room({ params }: MeetingPageProps) {
  const { id } = await params;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Meeting</h1>
        <Link href="/" className="text-blue-600 hover:underline">Home</Link>
      </div>

      <section className="rounded-lg border p-6">
        <p className="mb-4 text-gray-700">{id}</p>
        <Actions id={id} />
      </section>
    </main>
  );
}
