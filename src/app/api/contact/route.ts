import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Log the contact form submission
    const timestamp = new Date().toISOString();
    const contactData = {
      name,
      email,
      subject,
      message,
      timestamp,
      ip: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    };

    console.log('📧 Contact form submission:', {
      name,
      email,
      subject,
      timestamp,
      ip: contactData.ip
    });

    // In a real application, you would:
    // 1. Save to database
    // 2. Send email notification
    // 3. Add to CRM system
    // 4. Send auto-reply to user

    // For now, we'll just log it and return success
    // You can integrate with services like:
    // - SendGrid for email
    // - Mailchimp for newsletter
    // - Firebase Firestore for storage
    // - Slack for notifications

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({
      success: true,
      message: 'Thank you for your message. We will get back to you soon!'
    });

  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Failed to send message. Please try again.' },
      { status: 500 }
    );
  }
}
