"use server";

import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { 
  createCard as createCardQuery,
  updateCard as updateCardQuery,
  deleteCard as deleteCardQuery 
} from "@/db/queries/card-queries";

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

