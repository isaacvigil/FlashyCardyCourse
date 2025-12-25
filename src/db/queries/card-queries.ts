import { db } from "@/db";
import { cardsTable, decksTable } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Get all cards for a deck (with ownership check)
 */
export async function getCardsByDeckId(deckId: number, userId: string) {
  // Verify deck ownership first
  const [deck] = await db
    .select()
    .from(decksTable)
    .where(
      and(
        eq(decksTable.id, deckId),
        eq(decksTable.userId, userId)
      )
    );
  
  if (!deck) {
    throw new Error("Deck not found or unauthorized");
  }
  
  // Now fetch cards
  return await db
    .select()
    .from(cardsTable)
    .where(eq(cardsTable.deckId, deckId))
    .orderBy(desc(cardsTable.createdAt));
}

/**
 * Get a single card by ID (with ownership check via deck)
 */
export async function getCardById(cardId: number, userId: string) {
  // First get the card
  const [card] = await db
    .select()
    .from(cardsTable)
    .where(eq(cardsTable.id, cardId));
  
  if (!card) {
    return null;
  }
  
  // Verify deck ownership
  const [deck] = await db
    .select()
    .from(decksTable)
    .where(
      and(
        eq(decksTable.id, card.deckId),
        eq(decksTable.userId, userId)
      )
    );
  
  if (!deck) {
    throw new Error("Unauthorized");
  }
  
  return card;
}

/**
 * Create a new card (with ownership check)
 */
export async function createCard(data: {
  deckId: number;
  userId: string;
  front: string;
  back: string;
}) {
  // Verify deck ownership
  const [deck] = await db
    .select()
    .from(decksTable)
    .where(
      and(
        eq(decksTable.id, data.deckId),
        eq(decksTable.userId, data.userId)
      )
    );
  
  if (!deck) {
    throw new Error("Deck not found or unauthorized");
  }
  
  const [newCard] = await db
    .insert(cardsTable)
    .values({
      deckId: data.deckId,
      front: data.front,
      back: data.back,
    })
    .returning();
  
  return newCard;
}

/**
 * Update a card (with ownership check via deck)
 */
export async function updateCard(data: {
  id: number;
  userId: string;
  front?: string;
  back?: string;
}) {
  const { id, userId, ...updates } = data;
  
  // First get the card to find its deck
  const [card] = await db
    .select()
    .from(cardsTable)
    .where(eq(cardsTable.id, id));
  
  if (!card) {
    throw new Error("Card not found");
  }
  
  // Verify deck ownership
  const [deck] = await db
    .select()
    .from(decksTable)
    .where(
      and(
        eq(decksTable.id, card.deckId),
        eq(decksTable.userId, userId)
      )
    );
  
  if (!deck) {
    throw new Error("Unauthorized");
  }
  
  const [updatedCard] = await db
    .update(cardsTable)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(cardsTable.id, id))
    .returning();
  
  if (!updatedCard) {
    throw new Error("Failed to update card");
  }
  
  return updatedCard;
}

/**
 * Delete a card (with ownership check via deck)
 */
export async function deleteCard(cardId: number, userId: string) {
  // First get the card to find its deck
  const [card] = await db
    .select()
    .from(cardsTable)
    .where(eq(cardsTable.id, cardId));
  
  if (!card) {
    throw new Error("Card not found");
  }
  
  // Verify deck ownership
  const [deck] = await db
    .select()
    .from(decksTable)
    .where(
      and(
        eq(decksTable.id, card.deckId),
        eq(decksTable.userId, userId)
      )
    );
  
  if (!deck) {
    throw new Error("Unauthorized");
  }
  
  await db
    .delete(cardsTable)
    .where(eq(cardsTable.id, cardId));
}

/**
 * Get card count for a deck (with ownership check)
 */
export async function getCardCount(deckId: number, userId: string) {
  const cards = await getCardsByDeckId(deckId, userId);
  return cards.length;
}

