import { NextRequest, NextResponse } from "next/server";
import { updateItemSchema } from "@/lib/validators";
import { prisma } from "@/lib/db";
import { checkItemPrice } from "@/lib/ai/price-checker";
import { getUserFromRequest } from "@/lib/auth";


// Helper to get user from token


// GET /api/items/[id] - Get a single item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            photo: true,
            verificationStatus: true,
            trustScore: true,
            avgRating: true,
            badges: true,
            college: true,
            isOnline: true,
            lastSeen: true,
            completedDeals: true,
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    // Use cached price ratings from database (no AI calls needed)
    // Generate simple explanation from stored rating
    const priceExplanation = item.aiPriceRating && item.avgCampusPrice
      ? item.price > item.avgCampusPrice
        ? `This item is priced ${((item.price - item.avgCampusPrice) / item.avgCampusPrice * 100).toFixed(0)}% above the typical campus price.`
        : item.price < item.avgCampusPrice
        ? `This item is priced ${((item.avgCampusPrice - item.price) / item.avgCampusPrice * 100).toFixed(0)}% below the typical campus price.`
        : "Price is in line with typical campus marketplace prices."
      : "Price analysis unavailable.";

    return NextResponse.json({
      item: {
        ...item,
        priceExplanation,
      },
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Error fetching item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/items/[id] - Update an item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getUserFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check ownership
    const existingItem = await prisma.item.findUnique({
      where: { id },
      select: { sellerId: true },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    if (existingItem.sellerId !== userId) {
      return NextResponse.json(
        { error: "You can only update your own listings" },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = updateItemSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // If price is updated, recalculate price rating
    if (updateData.price && updateData.name) {
      const priceCheck = await checkItemPrice(
        updateData.name,
        updateData.price,
        updateData.condition || "GOOD"
      );
      (updateData as Record<string, unknown>).aiPriceRating = priceCheck.rating;
      (updateData as Record<string, unknown>).avgCampusPrice = priceCheck.averagePrice;
    }

    const item = await prisma.item.update({
      where: { id },
      data: updateData,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            photo: true,
            verificationStatus: true,
            trustScore: true,
            avgRating: true,
            badges: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Item updated successfully",
      item,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/items/[id] - Delete an item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getUserFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check ownership
    const existingItem = await prisma.item.findUnique({
      where: { id },
      select: { sellerId: true },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    if (existingItem.sellerId !== userId) {
      return NextResponse.json(
        { error: "You can only delete your own listings" },
        { status: 403 }
      );
    }

    await prisma.item.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Item deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
