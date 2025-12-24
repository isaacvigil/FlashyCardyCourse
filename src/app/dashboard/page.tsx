import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserDecks } from "@/db/queries/deck-queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    // User is not authenticated - redirect to homepage where sign-in/sign-up buttons are
    redirect("/");
  }

  // Fetch user's decks using query helper
  const decks = await getUserDecks(userId);

  return (
    <div className="container mx-auto py-8 px-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage your flashcard decks</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/new">Create New Deck</Link>
        </Button>
      </div>

      {decks.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Decks Yet</CardTitle>
            <CardDescription>
              Get started by creating your first flashcard deck!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/new">Create Your First Deck</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <Card key={deck.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>{deck.title}</CardTitle>
                {deck.description && (
                  <CardDescription>{deck.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Updated {new Date(deck.updatedAt).toLocaleDateString()}
                  </span>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/decks/${deck.id}`}>View</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

