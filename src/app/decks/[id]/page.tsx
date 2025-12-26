import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { getDeckById } from "@/db/queries/deck-queries";
import { getCardsByDeckId } from "@/db/queries/card-queries";
import { checkFeatureAccess } from "@/lib/feature-access";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AIGenerateButton } from "@/components/ai-generate-button";
import { EditDeckDialog } from "./edit-deck-dialog";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";

interface DeckPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function DeckPage({ params }: DeckPageProps) {
  const { userId } = await auth();

  if (!userId) {
    // User is not authenticated - redirect to homepage
    redirect("/");
  }

  // Check if user has AI generation feature using robust helper
  const aiFeatureCheck = await checkFeatureAccess("ai_flashcard_generation");
  const hasAIFeature = aiFeatureCheck.hasAccess;

  const { id } = await params;
  const deckId = parseInt(id);

  // Validate that the ID is a valid number
  if (isNaN(deckId)) {
    notFound();
  }

  // Fetch deck details with ownership check
  const deck = await getDeckById(deckId, userId);

  if (!deck) {
    // Deck not found or user doesn't have access
    notFound();
  }

  // Fetch cards for this deck with ownership check
  let cards;
  try {
    cards = await getCardsByDeckId(deckId, userId);
  } catch (error) {
    // If there's an error fetching cards (shouldn't happen since we verified deck ownership)
    notFound();
  }

  return (
    <div className="container mx-auto py-8 px-8">
      {/* Header with back button */}
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-4xl font-bold tracking-tight">{deck.title}</h1>
            {deck.description && (
              <p className="text-muted-foreground mt-2 text-lg">{deck.description}</p>
            )}
            <div className="flex items-center gap-4 mt-4">
              <Badge variant="secondary">
                {cards.length} {cards.length === 1 ? 'card' : 'cards'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Created {new Date(deck.createdAt).toLocaleDateString()}
              </span>
              <span className="text-sm text-muted-foreground">
                Updated {new Date(deck.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <EditDeckDialog deck={deck} />
            <AIGenerateButton 
              deckId={deckId} 
              hasAIFeature={hasAIFeature} 
              hasDescription={!!deck.description && deck.description.trim() !== ''} 
            />
          </div>
        </div>
      </div>

      {/* Cards Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Flashcards</h2>
          <Button asChild>
            <Link href={`/decks/${deckId}/cards/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Card
            </Link>
          </Button>
        </div>

        {cards.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Cards Yet</CardTitle>
              <CardDescription>
                Start building your deck by adding your first flashcard!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href={`/decks/${deckId}/cards/new`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Card
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <Card key={card.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base">Front</CardTitle>
                  <CardDescription className="text-base text-foreground mt-2">
                    {card.front}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Back</p>
                    <p className="text-sm">{card.back}</p>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <Button variant="outline" size="sm" asChild className="w-full">
                      <Link href={`/decks/${deckId}/cards/${card.id}/edit`}>
                        Edit Card
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

