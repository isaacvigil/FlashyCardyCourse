"use server";

import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { checkFeatureAccess } from "@/lib/feature-access";
import { 
  createCard as createCardQuery,
  updateCard as updateCardQuery,
  deleteCard as deleteCardQuery,
  createCardsBulk 
} from "@/db/queries/card-queries";
import { getDeckById } from "@/db/queries/deck-queries";

// Define Zod schema for card creation
const createCardSchema = z.object({
  deckId: z.number(),
  front: z.string().min(1, "Front is required").max(500, "Front must be less than 500 characters"),
  back: z.string().min(1, "Back is required").max(500, "Back must be less than 500 characters"),
});

type CreateCardInput = z.infer<typeof createCardSchema>;

export async function createCard(input: CreateCardInput) {
  // 1. Authenticate
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }
  
  // 2. Validate input with Zod
  const validation = createCardSchema.safeParse(input);
  if (!validation.success) {
    return { 
      success: false, 
      error: validation.error.errors[0].message 
    };
  }
  
  // 3. Call mutation helper
  try {
    const newCard = await createCardQuery({
      deckId: validation.data.deckId,
      userId,
      front: validation.data.front,
      back: validation.data.back,
    });
    
    revalidatePath(`/decks/${validation.data.deckId}`);
    return { success: true, data: newCard };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create card";
    return { success: false, error: message };
  }
}

// Define Zod schema for card update
const updateCardSchema = z.object({
  id: z.number(),
  front: z.string().min(1).max(500).optional(),
  back: z.string().min(1).max(500).optional(),
});

type UpdateCardInput = z.infer<typeof updateCardSchema>;

export async function updateCard(input: UpdateCardInput) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }
  
  const validation = updateCardSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0].message };
  }
  
  try {
    const updatedCard = await updateCardQuery({
      id: validation.data.id,
      userId,
      front: validation.data.front,
      back: validation.data.back,
    });
    
    revalidatePath(`/decks/${updatedCard.deckId}`);
    return { success: true, data: updatedCard };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update card";
    return { success: false, error: message };
  }
}

// Define Zod schema for card deletion
const deleteCardSchema = z.object({
  id: z.number(),
});

type DeleteCardInput = z.infer<typeof deleteCardSchema>;

export async function deleteCard(input: DeleteCardInput) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }
  
  const validation = deleteCardSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0].message };
  }
  
  try {
    await deleteCardQuery(validation.data.id, userId);
    
    // Note: We can't revalidate a specific deck path here since we don't have deckId
    // The calling component should handle revalidation
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete card";
    return { success: false, error: message };
  }
}

// Define Zod schema for AI flashcard generation
const generateFlashcardsSchema = z.object({
  deckId: z.number(),
});

type GenerateFlashcardsInput = z.infer<typeof generateFlashcardsSchema>;

// Flashcard schema for AI output
const flashcardSchema = z.object({
  front: z.string().describe("The question or prompt on the front of the card"),
  back: z.string().describe("The answer or explanation on the back of the card"),
});

const flashcardsOutputSchema = z.object({
  cards: z.array(flashcardSchema).describe("Array of generated flashcards"),
});

export async function generateFlashcardsWithAI(input: GenerateFlashcardsInput) {
  // 1. Authenticate user
  const { userId } = await auth();
  
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }
  
  // 2. Check if user has AI generation feature (Pro feature) using robust helper
  const featureCheck = await checkFeatureAccess("ai_flashcard_generation");
  
  // DEBUG: Log feature check result
  console.log("🐛 AI Generation Debug:", {
    userId,
    featureCheck,
  });
  
  if (!featureCheck.hasAccess) {
    console.log("❌ AI Generation blocked:", featureCheck.reason);
    return { 
      success: false, 
      error: "AI flashcard generation is a Pro feature. Please upgrade.",
      requiresUpgrade: true 
    };
  }
  
  console.log("✅ AI Generation allowed:", featureCheck.reason, `(via ${featureCheck.method})`);
  
  // 3. Validate input
  const validation = generateFlashcardsSchema.safeParse(input);
  if (!validation.success) {
    return { 
      success: false, 
      error: validation.error.errors[0].message 
    };
  }
  
  const { deckId } = validation.data;
  
  // 4. Verify deck ownership
  const deck = await getDeckById(deckId, userId);
  
  if (!deck) {
    return { success: false, error: "Deck not found or unauthorized" };
  }
  
  // 5. Check if deck has a description
  if (!deck.description || deck.description.trim() === '') {
    return { 
      success: false, 
      error: "Please add a description to your deck first. The AI uses the description to generate relevant flashcards.",
      needsDescription: true 
    };
  }
  
  // 6. Generate flashcards with AI based on deck title and description
  try {
    const topic = deck.title;
    const additionalContext = `\nContext: ${deck.description}`;
    const count = 20;
    
    const prompt = `Generate ${count} high-quality flashcards about "${topic}".${additionalContext}
    
Guidelines:
- Each card should have a clear, concise question on the front
- Each card should have a complete, accurate answer on the back
- Vary the types of questions (definitions, examples, comparisons, applications)
- Make questions specific and unambiguous
- Keep answers concise but complete
- Cover different aspects of the topic comprehensively`;

    const { output } = await generateText({
      model: openai('gpt-4o-mini'),
      output: Output.object({
        schema: flashcardsOutputSchema,
      }),
      prompt,
    });
    
    // 7. Save generated cards to database using bulk insert
    const createdCards = await createCardsBulk({
      deckId,
      userId,
      cards: output.cards,
    });
    
    // 8. Revalidate the deck page
    revalidatePath(`/decks/${deckId}`);
    
    return { 
      success: true, 
      data: { 
        cards: createdCards,
        count: createdCards.length 
      } 
    };
    
  } catch (error) {
    console.error("AI generation error:", error);
    
    return { 
      success: false, 
      error: "Failed to generate flashcards. Please try again." 
    };
  }
}

