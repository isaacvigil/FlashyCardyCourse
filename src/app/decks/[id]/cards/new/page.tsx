import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { getDeckById } from "@/db/queries/deck-queries";
import { CreateCardForm } from "./create-card-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface NewCardPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function NewCardPage({ params }: NewCardPageProps) {
  const { userId } = await auth();

  if (!userId) {
    // User is not authenticated - redirect to homepage
    redirect("/");
  }

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

  return (
    <div className="container mx-auto py-8 px-8 max-w-2xl">
      {/* Header with back button */}
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/decks/${deckId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Deck
          </Link>
        </Button>

        <div>
          <h1 className="text-4xl font-bold tracking-tight">Add New Card</h1>
          <p className="text-muted-foreground mt-2">
            Add a flashcard to <span className="font-medium">{deck.title}</span>
          </p>
        </div>
      </div>

      {/* Create Card Form */}
      <CreateCardForm deckId={deckId} />
    </div>
  );
}

