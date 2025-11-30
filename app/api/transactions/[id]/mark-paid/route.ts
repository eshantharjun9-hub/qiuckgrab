import { NextRequest, NextResponse } from "next/server";
import { markPaidSchema } from "@/lib/validators";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// POST /api/transactions/[id]/mark-paid - Buyer marks physical payment as done
export async function POST(
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
    const body = await request.json();

    // Validate input
    const validationResult = markPaidSchema.safeParse({
      transactionId,
      ...body,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.issues },
        { status: 400 }
      );
    }

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

    // Verify user is buyer
    if (transaction.buyerId !== userId) {
      return NextResponse.json(
        { error: "Only the buyer can mark payment as done" },
        { status: 403 }
      );
    }

    // Check status - must be MEETING to mark as paid
    if (transaction.status !== "MEETING") {
      return NextResponse.json(
        { error: `Cannot mark payment for transaction in ${transaction.status} status. Must be MEETING.` },
        { status: 400 }
      );
    }

    // Update transaction status to PAID and mark as physical payment
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: "PAID",
        paymentId: "physical_payment", // Marker for physical payment (no actual payment processing)
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
      message: "Payment marked as done",
      transaction: updatedTransaction,
    });
  } catch (error) {
    console.error("Error marking payment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
