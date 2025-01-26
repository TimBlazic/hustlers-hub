import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { GigDetail } from "@/components/gigs/gig-detail";

interface GigPageProps {
  params: {
    id: string;
  };
}

async function getGig(id: string) {
  const gig = await prisma.gig.findUnique({
    where: { id },
    include: {
      seller: {
        select: {
          id: true,
          name: true,
          pfp_url: true,
          bio: true,
          solanaAddress: true,
        },
      },
    },
  });

  if (!gig) notFound();
  return gig;
}

export default async function GigPage({ params }: GigPageProps) {
  const gig = await getGig(params.id);

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <GigDetail gig={gig} />
      </div>
    </div>
  );
}
