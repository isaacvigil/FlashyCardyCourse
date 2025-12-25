import { db } from "@/db";
import { decksTable, cardsTable } from "@/db/schema";
import { eq, and, desc, count, sql } from "drizzle-orm";

/**
 * Get all decks for a user, ordered by most recently updated
 * Includes card count for each deck
 */
export async function getUserDecks(userId: string) {
  return await db
    .select({
      id: decksTable.id,
      userId: decksTable.userId,
      title: decksTable.title,
      description: decksTable.description,
      createdAt: decksTable.createdAt,
      updatedAt: decksTable.updatedAt,
      cardCount: sql<number>`cast(count(${cardsTable.id}) as integer)`,
    })
    .from(decksTable)
    .leftJoin(cardsTable, eq(decksTable.id, cardsTable.deckId))
    .where(eq(decksTable.userId, userId))
    .groupBy(decksTable.id)
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
