import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';

    const cities = await prisma.cities.findMany({
      where: {
        is_active: true,
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { countries: { name: { contains: query, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: {
        countries: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { name: 'asc' },
      take: 20,
    });

    const results = cities.map((c) => ({
      id: c.id,
      name: c.name,
      countryId: c.countries?.id || null,
      countryName: c.countries?.name || 'Indonesia',
      countryCode: c.countries?.code || 'ID',
      imageUrl: c.image_url,
    }));

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error in /api/locations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}
