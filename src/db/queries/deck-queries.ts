import { db } from "@/db";
import { decksTable } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Get all decks for a user, ordered by most recently updated
 */
export async function getUserDecks(userId: string) {
  return await db
    .select()
    .from(decksTable)
    .where(eq(decksTable.userId, userId))
    .orderBy(desc(decksTable.updatedAt));
}

/**
 * Get a single deck by ID (with ownership check)
 */
export async function getDeckById(deckId: number, userId: string) {
  const [deck] = await db
    .select()
    .from(decksTable)
    .where(
      and(
        eq(decksTable.id, deckId),
        eq(decksTable.userId, userId)
      )
    );
  
  return deck;
}

/**
 * Get deck count for a user
 */
export async function getUserDeckCount(userId: string) {
  const decks = await getUserDecks(userId);
  return decks.length;
}

/**
 * Create a new deck
 */
export async function createDeck(data: {
  userId: string;
  title: string;
  description?: string;
}) {
  const [newDeck] = await db
    .insert(decksTable)
    .values({
      userId: data.userId,
      title: data.title,
      description: data.description,
    })
    .returning();
  
  return newDeck;
}

/**
 * Update a deck (with ownership check)
 */
export async function updateDeck(data: {
  id: number;
  userId: string;
  title?: string;
  description?: string;
}) {
  const { id, userId, ...updates } = data;
  
  const [updatedDeck] = await db
    .update(decksTable)
    .set({ ...updates, updatedAt: new Date() })
    .where(
      and(
        eq(decksTable.id, id),
        eq(decksTable.userId, userId)
      )
    )
    .returning();
  
  return updatedDeck;
}

/**
 * Delete a deck (with ownership check)
 */
export async function deleteDeck(deckId: number, userId: string) {
  await db
    .delete(decksTable)
    .where(
      and(
        eq(decksTable.id, deckId),
        eq(decksTable.userId, userId)
      )
    );
}

