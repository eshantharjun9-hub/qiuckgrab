import { NextRequest, NextResponse } from "next/server";
import { sendMessageSchema } from "@/lib/validators";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// POST /api/transactions/[id]/messages - Send a message in a transaction
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
    const validationResult = sendMessageSchema.safeParse({
      transactionId,
      ...body,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { content } = validationResult.data;

    // Get transaction to verify user is part of it
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      select: {
        buyerId: true,
        sellerId: true,
        status: true,
      },
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

    // Create message
    const message = await prisma.message.create({
      data: {
        transactionId,
        senderId: userId,
        content,
        isAI: false,
      },
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

    // TODO: Emit Socket.io event for real-time message delivery
    // socketClient.emit('new_message', { transactionId, message });

    return NextResponse.json(
      {
        message: message,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
