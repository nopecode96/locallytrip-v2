import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const [usersCount, experiencesCount, storiesCount] = await Promise.all([
      prisma.users.count(),
      prisma.experiences.count(),
      prisma.stories.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        status: 'online',
        architecture: 'AKPJUTS Modern Monolith',
        version: 'v1',
        stats: {
          users: usersCount,
          experiences: experiencesCount,
          stories: storiesCount,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown database error',
      },
      { status: 500 }
    );
  }
}
