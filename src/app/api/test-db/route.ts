import { NextResponse } from 'next/server';
import { getUserByEmail, createUser } from '@/utils/db/actions';

export async function GET() {
  try {
    const user = await getUserByEmail('jils@example.com');
    const createdUser = await createUser('test@example.com', 'Test User');
    return NextResponse.json({ success: true, user, createdUser });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
