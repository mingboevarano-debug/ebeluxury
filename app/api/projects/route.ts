import { NextRequest, NextResponse } from 'next/server';
import { createProject, getAllProjects, getProjectsByForeman, updateProject } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getContractById } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role === 'foreman') {
      const projects = await getProjectsByForeman(user.id);
      return NextResponse.json(projects);
    } else {
      const projects = await getAllProjects();
      return NextResponse.json(projects);
    }
  } catch (error: any) {
    console.error('Get projects error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'foreman') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contractId, deadline } = body;

    const contract = await getContractById(contractId);
    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    const projectId = await createProject({
      contractId,
      foremanId: user.id,
      foremanName: user.name,
      description: '',
      deadline: new Date(deadline),
      status: 'active',
    });

    return NextResponse.json({ id: projectId });
  } catch (error: any) {
    console.error('Create project error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create project' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    await updateProject(id, updates);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update project error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update project' },
      { status: 500 }
    );
  }
}

