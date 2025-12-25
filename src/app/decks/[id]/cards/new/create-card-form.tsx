"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCard } from "@/app/actions/card-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface CreateCardFormProps {
  deckId: number;
}

export function CreateCardForm({ deckId }: CreateCardFormProps) {
  const router = useRouter();
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await createCard({
      deckId,
      front,
      back,
    });

    if (result.success) {
      // Redirect back to the deck page
      router.push(`/decks/${deckId}`);
      router.refresh();
    } else {
      setError(result.error || "Failed to create card");
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Card Details</CardTitle>
        <CardDescription>
          Enter the front and back content for your flashcard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Front Field */}
          <div className="space-y-2">
            <Label htmlFor="front">Front</Label>
            <Textarea
              id="front"
              placeholder="Question or term (e.g., 'What is the capital of France?')"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              required
              maxLength={500}
              rows={3}
              disabled={isSubmitting}
            />
            <p className="text-sm text-muted-foreground">
              {front.length}/500 characters
            </p>
          </div>

          {/* Back Field */}
          <div className="space-y-2">
            <Label htmlFor="back">Back</Label>
            <Textarea
              id="back"
              placeholder="Answer or definition (e.g., 'Paris')"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              required
              maxLength={500}
              rows={3}
              disabled={isSubmitting}
            />
            <p className="text-sm text-muted-foreground">
              {back.length}/500 characters
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isSubmitting || !front.trim() || !back.trim()}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Card"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/decks/${deckId}`)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

