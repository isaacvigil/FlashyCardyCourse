import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserDecks } from "@/db/queries/deck-queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function DashboardPage() {
  const { userId, has } = await auth();

  if (!userId) {
    // User is not authenticated - redirect to homepage where sign-in/sign-up buttons are
    redirect("/");
  }

  // Fetch user's decks using query helper
  const decks = await getUserDecks(userId);

  // Check if user has unlimited decks feature (Pro users)
  const hasUnlimitedDecks = has({ feature: "unlimited_decks" });
  
  // Check if user is on Pro plan
  const isProUser = has({ plan: "pro" });
  
  // Free users are limited to 3 decks
  const canCreateMoreDecks = hasUnlimitedDecks || decks.length < 3;

  return (
    <div className="container mx-auto py-8 px-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
            <Badge variant={isProUser ? "default" : "secondary"} className="text-sm">
              {isProUser ? "Pro" : "Free"}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-2">Manage your flashcard decks</p>
        </div>
        {canCreateMoreDecks ? (
          <Button asChild>
            <Link href="/dashboard/new">Create New Deck</Link>
          </Button>
        ) : (
          <Button asChild variant="default">
            <Link href="/pricing">Upgrade to Pro for Unlimited Decks</Link>
          </Button>
        )}
      </div>

      {/* Show upgrade notice if at deck limit */}
      {!canCreateMoreDecks && (
        <Card className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🚀</span>
              <span>Deck Limit Reached</span>
            </CardTitle>
            <CardDescription>
              You've created {decks.length} out of 3 decks available on the free plan.
              Upgrade to Pro for unlimited decks!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/pricing">View Pro Plans</Link>
            </Button>
          </CardContent>
        </Card>
      )}

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
            <Link
              key={deck.id}
              href={`/decks/${deck.id}`}
              className="block"
              tabIndex={-1}
            >
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full focus:ring-2 focus:ring-primary focus:outline-none">
                <CardHeader>
                  <CardTitle>{deck.title}</CardTitle>
                  {deck.description && (
                    <CardDescription>{deck.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {deck.cardCount} {deck.cardCount === 1 ? 'card' : 'cards'}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Updated {new Date(deck.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

