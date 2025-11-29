import { NextRequest, NextResponse } from "next/server";
import { searchSchema } from "@/lib/validators";
import { prisma } from "@/lib/db";
import { parseSearchQuery } from "@/lib/ai/search-parser";
import { checkItemPrice } from "@/lib/ai/price-checker";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = searchSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { query, category, minPrice, maxPrice, condition, sort, page, limit } = validationResult.data;

    // AI parse the search query
    const parsedQuery = await parseSearchQuery(query);

    // Build database query
    const where: Record<string, unknown> = {
      availabilityStatus: "AVAILABLE",
      // Only show items from verified sellers
      seller: {
        verificationStatus: "VERIFIED",
      },
    };

    // Search by item name/description
    if (parsedQuery.item) {
      where.OR = [
        { name: { contains: parsedQuery.item, mode: "insensitive" } },
        { description: { contains: parsedQuery.item, mode: "insensitive" } },
      ];
    }

    // Category filter
    if (category || parsedQuery.category) {
      where.category = { contains: category || parsedQuery.category, mode: "insensitive" };
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined || parsedQuery.priceRange) {
      where.price = {};
      if (minPrice !== undefined) {
        (where.price as Record<string, number>).gte = minPrice;
      }
      if (maxPrice !== undefined || parsedQuery.priceRange?.max) {
        (where.price as Record<string, number>).lte = maxPrice || parsedQuery.priceRange?.max;
      }
    }

    // Condition filter
    if (condition) {
      where.condition = condition;
    }

    // Determine sort order
    let orderBy: Record<string, string> = { createdAt: "desc" };
    switch (sort) {
      case "price_asc":
        orderBy = { price: "asc" };
        break;
      case "price_desc":
        orderBy = { price: "desc" };
        break;
      case "newest":
        orderBy = { createdAt: "desc" };
        break;
      case "rating":
        orderBy = { seller: { avgRating: "desc" } } as Record<string, string>;
        break;
    }

    // Execute search
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        orderBy,
        skip,
        take: limit,
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
              location: true,
            },
          },
        },
      }),
      prisma.item.count({ where }),
    ]);

    // Enhance items with AI price ratings
    const enhancedItems = await Promise.all(
      items.map(async (item) => {
        const priceCheck = await checkItemPrice(item.name, item.price, item.condition);
        return {
          ...item,
          aiPriceRating: priceCheck.rating,
          avgCampusPrice: priceCheck.averagePrice,
          priceExplanation: priceCheck.explanation,
        };
      })
    );

    return NextResponse.json({
      query: {
        original: query,
        parsed: parsedQuery,
      },
      items: enhancedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
