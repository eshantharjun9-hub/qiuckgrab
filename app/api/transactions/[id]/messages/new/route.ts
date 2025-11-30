import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// GET /api/transactions/[id]/messages/new - Get new messages since a specific message ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: transactionId } = await params;
    const { searchParams } = new URL(request.url);
    const afterTimestamp = searchParams.get("after");

    // Verify user has access to this transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      select: {
        buyerId: true,
        sellerId: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    if (transaction.buyerId !== userId && transaction.sellerId !== userId) {
      return NextResponse.json(
        { error: "You are not part of this transaction" },
        { status: 403 }
      );
    }

    // Build query for new messages using createdAt for comparison
    const where: { 
      transactionId: string; 
      createdAt?: { gt: Date } 
    } = {
      transactionId,
    };

    if (afterTimestamp) {
      try {
        const afterDate = new Date(afterTimestamp);
        // Use gte (greater than or equal) with a small buffer to catch edge cases
        where.createdAt = { gt: new Date(afterDate.getTime() - 500) };
      } catch (err) {
        console.error("Invalid timestamp format:", afterTimestamp);
        // If timestamp is invalid, fetch all messages
      }
    }

    // Fetch only new messages
    const messages = await prisma.message.findMany({
      where,
      orderBy: { createdAt: "asc" },
      take: 50, // Limit to 50 new messages per request
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            photo: true,
          },
        },
      },
    });

    return NextResponse.json({
      messages,
      count: messages.length,
    }, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error fetching new messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

