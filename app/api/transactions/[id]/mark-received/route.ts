import { NextRequest, NextResponse } from "next/server";
import { markReceivedSchema } from "@/lib/validators";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { calculateTrustScore, getEarnedBadges } from "@/lib/services/trust-engine";

// POST /api/transactions/[id]/mark-received - Buyer confirms item received
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
    const validationResult = markReceivedSchema.safeParse({
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

    // Verify user is buyer
    if (transaction.buyerId !== userId) {
      return NextResponse.json(
        { error: "Only the buyer can mark item as received" },
        { status: 403 }
      );
    }

    // Check status - must be PAID to mark as received
    if (transaction.status !== "PAID") {
      return NextResponse.json(
        { error: `Cannot mark item as received for transaction in ${transaction.status} status. Must be PAID.` },
        { status: 400 }
      );
    }

    // Update transaction status to COMPLETED
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: "COMPLETED" },
    });

    // Mark item as SOLD (this removes it from listings)
    await prisma.item.update({
      where: { id: transaction.itemId },
      data: { availabilityStatus: "SOLD" },
    });

    // Update seller stats
    const seller = transaction.seller;
    const newCompletedDeals = seller.completedDeals + 1;
    const newCancellationRate =
      seller.cancellationRate * seller.completedDeals / newCompletedDeals;

    // Recalculate trust score
    const { score: newTrustScore } = calculateTrustScore({
      verificationStatus: seller.verificationStatus,
      avgRating: seller.avgRating,
      completedDeals: newCompletedDeals,
      cancellationRate: newCancellationRate,
    });

    // Check for new badges
    const newBadges = getEarnedBadges({
      completedDeals: newCompletedDeals,
      avgRating: seller.avgRating,
      cancellationRate: newCancellationRate,
    });

    await prisma.user.update({
      where: { id: transaction.sellerId },
      data: {
        completedDeals: newCompletedDeals,
        cancellationRate: newCancellationRate,
        trustScore: newTrustScore,
        badges: newBadges,
      },
    });

    // Update buyer stats
    const buyer = transaction.buyer;
    await prisma.user.update({
      where: { id: transaction.buyerId },
      data: {
        completedDeals: buyer.completedDeals + 1,
      },
    });

    return NextResponse.json({
      message: "Item marked as received. Transaction completed!",
      transaction: updatedTransaction,
      nextStep: "Please rate the seller",
      ratingRequired: true,
    });
  } catch (error) {
    console.error("Error marking item as received:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
