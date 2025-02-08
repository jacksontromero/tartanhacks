import RankedRestaurants from "~/components/rankings/RankedRestaurants";
import { getRankingsForEvent } from "~/lib/ranking";

export default async function RankingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { rankings } = await getRankingsForEvent(id);

  // console.log(rankings);

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-8 text-center text-4xl font-bold text-secondary-foreground">
          Restaurant Rankings
        </h1>
        <RankedRestaurants rankings={rankings} />
      </div>
    </main>
  );
}
