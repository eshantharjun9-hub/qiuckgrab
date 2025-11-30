import { NextRequest, NextResponse } from "next/server";
import { setMeetupSchema } from "@/lib/validators";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// POST /api/transactions/[id]/meetup - Set meetup location
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: transactionId } = await params;
    const body = await request.json();

    // Validate input
    const validationResult = setMeetupSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { location } = validationResult.data;

    // Get transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Verify user is buyer or seller
    if (transaction.buyerId !== userId && transaction.sellerId !== userId) {
      return NextResponse.json(
        { error: "You are not part of this transaction" },
        { status: 403 }
      );
    }

    // Check status - must be ACCEPTED or REQUESTED to set meetup
    if (!["REQUESTED", "ACCEPTED"].includes(transaction.status)) {
      return NextResponse.json(
        {
          error: `Cannot set meetup location for transaction in ${transaction.status} status`,
        },
        { status: 400 }
      );
    }

    // Update transaction with meetup location and set status to MEETING
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        meetupLocation: location,
        status: "MEETING",
      },
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
        item: true,
      },
    });

    return NextResponse.json({
      message: "Meetup location set successfully",
      transaction: updatedTransaction,
    });
  } catch (error) {
    console.error("Error setting meetup location:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
