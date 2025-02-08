import { NextResponse } from 'next/server';
import { getRankingsForEvent } from '~/lib/ranking';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const event_id = params.id;
    if (!event_id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const result = await getRankingsForEvent(event_id);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error ranking places:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}