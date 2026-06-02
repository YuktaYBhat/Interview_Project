import { NextRequest, NextResponse } from 'next/server';
import { Resume } from '@/types';
import { calculateATSScore } from '@/lib/resume-utils';

// Mock database for resumes
const resumesDatabase: Map<string, Resume> = new Map();

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resumeData = await request.json();

    const resume: Resume = {
      id: `resume_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      title: resumeData.title,
      content: resumeData.content,
      atsScore: calculateATSScore(resumeData),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    resumesDatabase.set(resume.id, resume);

    // Also save to localStorage
    if (typeof window !== 'undefined') {
      const resumes = JSON.parse(localStorage.getItem(`resumes_${userId}`) || '[]');
      resumes.push(resume);
      localStorage.setItem(`resumes_${userId}`, JSON.stringify(resumes));
    }

    return NextResponse.json(
      {
        success: true,
        data: resume,
        message: 'Resume created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Resume creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resumes = Array.from(resumesDatabase.values()).filter((r) => r.userId === userId);

    return NextResponse.json(
      {
        success: true,
        data: resumes,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Resume fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
