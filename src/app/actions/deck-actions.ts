"use server";

import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { checkFeatureAccess } from "@/lib/feature-access";
import { 
  createDeck as createDeckQuery, 
  updateDeck as updateDeckQuery,
  deleteDeck as deleteDeckQuery,
  getUserDecks
} from "@/db/queries/deck-queries";

// Define Zod schema for deck creation
const createDeckSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
});

type CreateDeckInput = z.infer<typeof createDeckSchema>;

export async function createDeck(input: CreateDeckInput) {
  // 1. Authenticate
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }
  
  // 2. Validate input with Zod
  const validation = createDeckSchema.safeParse(input);
  if (!validation.success) {
    return { 
      success: false, 
      error: validation.error.errors[0].message 
    };
  }
  
  // 3. Check if user has unlimited decks feature using robust helper
  const unlimitedDecksCheck = await checkFeatureAccess("unlimited_decks");
  const hasUnlimitedDecks = unlimitedDecksCheck.hasAccess;
  
  // If not, check if they've hit the 3 deck limit
  if (!hasUnlimitedDecks) {
    const existingDecks = await getUserDecks(userId);
    
    if (existingDecks.length >= 3) {
      return { 
        success: false, 
        error: "You've reached the 3 deck limit. Upgrade to Pro for unlimited decks.",
        requiresUpgrade: true 
      };
    }
  }
  
  // 4. Call mutation helper
  try {
    const newDeck = await createDeckQuery({
      userId,
      title: validation.data.title,
      description: validation.data.description,
    });
    
    revalidatePath("/dashboard");
    return { success: true, data: newDeck };
  } catch (error) {
    return { success: false, error: "Failed to create deck" };
  }
}

// Define Zod schema for deck update
const updateDeckSchema = z.object({
  id: z.number(),
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

type UpdateDeckInput = z.infer<typeof updateDeckSchema>;

export async function updateDeck(input: UpdateDeckInput) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }
  
  const validation = updateDeckSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0].message };
  }
  
  try {
    await updateDeckQuery({
      id: validation.data.id,
      userId,
      title: validation.data.title,
      description: validation.data.description,
    });
    
    revalidatePath("/dashboard");
    revalidatePath(`/decks/${validation.data.id}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update deck" };
  }
}

// Define Zod schema for deck deletion
const deleteDeckSchema = z.object({
  id: z.number(),
});

type DeleteDeckInput = z.infer<typeof deleteDeckSchema>;

export async function deleteDeck(input: DeleteDeckInput) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }
  
  const validation = deleteDeckSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0].message };
  }
  
  try {
    await deleteDeckQuery(validation.data.id, userId);
    
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete deck" };
  }
}

