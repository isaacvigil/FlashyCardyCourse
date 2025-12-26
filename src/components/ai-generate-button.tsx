"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sparkles, Loader2 } from "lucide-react";
import { generateFlashcardsWithAI } from "@/app/actions/card-actions";
import { toast } from "sonner";

interface AIGenerateButtonProps {
  deckId: number;
  hasAIFeature: boolean;
  hasDescription: boolean;
}

export function AIGenerateButton({ deckId, hasAIFeature, hasDescription }: AIGenerateButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  async function handleGenerate() {
    // If deck doesn't have a description, show error
    if (!hasDescription) {
      toast.error("Please add a description to your deck first. The AI uses it to generate relevant flashcards.");
      return;
    }

    // If user doesn't have the feature, redirect to pricing
    if (!hasAIFeature) {
      router.push("/pricing");
      return;
    }

    setIsGenerating(true);

    try {
      const result = await generateFlashcardsWithAI({ deckId });

      if (result.success) {
        toast.success(`Generated ${result.data?.count} flashcards with AI!`);
      } else {
        if (result.requiresUpgrade) {
          // Redirect to pricing page
          router.push("/pricing");
        } else {
          toast.error(result.error || "Failed to generate flashcards");
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsGenerating(false);
    }
  }

  // Determine tooltip message based on conditions
  let tooltipMessage = null;
  
  if (!hasDescription) {
    tooltipMessage = "Add a description to your deck to use AI generation";
  } else if (!hasAIFeature) {
    tooltipMessage = "This is a Pro feature. Click to upgrade!";
  }

  // If user has the feature and description exists, show regular button
  if (hasAIFeature && hasDescription) {
    return (
      <Button onClick={handleGenerate} disabled={isGenerating} variant="secondary">
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Cards with AI
          </>
        )}
      </Button>
    );
  }

  // Show button with tooltip for missing description or missing feature
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button onClick={handleGenerate} variant="secondary">
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Cards with AI
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipMessage}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

