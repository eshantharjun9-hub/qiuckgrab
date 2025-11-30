import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { confirmDeliverySchema } from "@/lib/validators";

// POST /api/transactions/[id]/confirm-delivery - Seller confirms item delivery
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
    const validationResult = confirmDeliverySchema.safeParse({
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
      include: {
        seller: true,
        buyer: true,
        item: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Verify user is the seller
    if (transaction.sellerId !== userId) {
      return NextResponse.json(
        { error: "Only the seller can confirm delivery" },
        { status: 403 }
      );
    }

    // Check status - must be PAID or MEETING to confirm delivery
    if (transaction.status !== "PAID" && transaction.status !== "MEETING") {
      return NextResponse.json(
        { error: `Cannot confirm delivery for transaction in ${transaction.status} status. Must be PAID or MEETING.` },
        { status: 400 }
      );
    }

    // Update transaction status
    // If PAID, move to MEETING (ready for physical exchange)
    // If MEETING, keep as MEETING (delivery confirmed, waiting for buyer to mark received)
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: transaction.status === "PAID" 
        ? { status: "MEETING" }
        : {}, // Keep status as MEETING if already MEETING
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
      },
    });

    return NextResponse.json({
      message: "Delivery confirmed successfully",
      transaction: updatedTransaction,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

