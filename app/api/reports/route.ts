import { NextRequest, NextResponse } from 'next/server';
import { createReport, getReports } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'admin' && user.role !== 'director')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reports = await getReports();
    return NextResponse.json(reports);
  } catch (error: any) {
    console.error('Get reports error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get reports' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, description, photos, videos, location } = body;

    const reportId = await createReport({
      projectId,
      foremanId: user.id,
      foremanName: user.name,
      description,
      photos: photos || [],
      videos: videos || [],
      location,
    });

    return NextResponse.json({ id: reportId });
  } catch (error: any) {
    console.error('Create report error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create report' },
      { status: 500 }
    );
  }
}
