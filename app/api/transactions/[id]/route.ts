import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// GET /api/transactions/[id] - Get a single transaction
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

    const { id } = await params;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            photo: true,
            verificationStatus: true,
            trustScore: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            photo: true,
            verificationStatus: true,
            trustScore: true,
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
          take: 50, // Only load last 50 messages initially (most recent)
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                photo: true,
              },
            },
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Only buyer or seller can view the transaction
    if (transaction.buyerId !== userId && transaction.sellerId !== userId) {
      return NextResponse.json(
        { error: "You are not part of this transaction" },
        { status: 403 }
      );
    }

    return NextResponse.json({ transaction }, {
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
