import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// GET /api/transactions - List all transactions for current user (as buyer or seller)
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    // Build where clause - user must be buyer or seller
    const where: Record<string, unknown> = {
      OR: [{ buyerId: userId }, { sellerId: userId }],
    };

    // Add status filter if provided
    if (status && status !== "all") {
      where.status = status.toUpperCase();
    }

    // Get transactions with related data
    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            photo: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            photo: true,
          },
        },
        item: {
          select: {
            id: true,
            name: true,
            price: true,
            photo: true,
            condition: true,
            category: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1, // Get latest message for preview
          include: {
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Format response with latest message preview
    const formattedTransactions = transactions.map((transaction) => {
      const latestMessage = transaction.messages[0] || null;
      const otherParty =
        transaction.buyerId === userId ? transaction.seller : transaction.buyer;

      return {
        id: transaction.id,
        status: transaction.status,
        escrowAmount: transaction.escrowAmount,
        meetupLocation: transaction.meetupLocation,
        meetupTime: transaction.meetupTime,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
        item: transaction.item,
        otherParty,
        latestMessage: latestMessage
          ? {
              id: latestMessage.id,
              content: latestMessage.content,
              senderId: latestMessage.senderId,
              senderName: latestMessage.sender.name,
              createdAt: latestMessage.createdAt,
            }
          : null,
        role: transaction.buyerId === userId ? "buyer" : "seller",
      };
    });

    return NextResponse.json({
      transactions: formattedTransactions,
      count: formattedTransactions.length,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
