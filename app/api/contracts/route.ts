import { NextRequest, NextResponse } from 'next/server';
import { createContract, getContracts, updateContract } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const contracts = await getContracts();
    return NextResponse.json(contracts);
  } catch (error: any) {
    console.error('Get contracts error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get contracts' },
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

    await updateContract(id, updates);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update contract error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update contract' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'seller') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      clientName,
      clientSurname,
      clientPhone,
      location,
      price,
      deadline,
      description,
      accommodationType,
      passportId,
      accommodationSquare,
      selectedServices,
    } = body;

    const contractId = await createContract({
      sellerId: user.id,
      sellerName: user.name,
      clientName,
      clientSurname,
      clientPhone,
      location,
      price: parseFloat(price),
      deadline: new Date(deadline),
      description,
      status: 'pending',
      accommodationType,
      passportId,
      accommodationSquare: accommodationSquare ? parseFloat(accommodationSquare) : undefined,
      selectedServices: selectedServices || [],
    });

    return NextResponse.json({ id: contractId });
  } catch (error: any) {
    console.error('Create contract error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create contract' },
      { status: 500 }
    );
  }
}

