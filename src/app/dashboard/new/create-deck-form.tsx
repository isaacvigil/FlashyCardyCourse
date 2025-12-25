"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createDeck } from "@/app/actions/deck-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function CreateDeckForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [requiresUpgrade, setRequiresUpgrade] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setRequiresUpgrade(false);
    setIsSubmitting(true);

    const result = await createDeck({
      title,
      description: description || undefined,
    });

    if (result.success) {
      // Redirect to the new deck page
      router.push(`/decks/${result.data.id}`);
      router.refresh();
    } else {
      setError(result.error || "Failed to create deck");
      setRequiresUpgrade(!!(result as any).requiresUpgrade);
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deck Details</CardTitle>
        <CardDescription>
          Enter the title and description for your new flashcard deck
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Field */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g., Spanish Vocabulary, Biology Terms, etc."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={100}
              disabled={isSubmitting}
            />
            <p className="text-sm text-muted-foreground">
              {title.length}/100 characters
            </p>
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="What is this deck about? What will you learn?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={4}
              disabled={isSubmitting}
            />
            <p className="text-sm text-muted-foreground">
              {description.length}/500 characters
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm">
              <p>{error}</p>
              {requiresUpgrade && (
                <Button asChild variant="link" className="mt-2 p-0 h-auto text-destructive underline">
                  <Link href="/pricing">View Pro Plans</Link>
                </Button>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Deck"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard")}
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

