import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // 1. Read and validate input first — cheapest failure path.
  let body: { email?: string; fullName?: string; orderId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { email, fullName, orderId } = body;

  if (!email || !fullName || !orderId) {
    return NextResponse.json(
      { success: false, error: "Missing email, fullName, or orderId" },
      { status: 400 }
    );
  }

  // 2. Read the API key at request time, not module load.
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set");
    return NextResponse.json(
      { success: false, error: "Email service not configured" },
      { status: 500 }
    );
  }

  const resend = new Resend(apiKey);

  const html = `
    <div style="font-family: Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #ffffff;">

      <div style="background: #000000; padding: 32px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 28px; letter-spacing: 8px; margin: 0; font-weight: 300;">VYRA</h1>
      </div>

      <div style="padding: 32px; text-align: center;">
        <h2 style="font-size: 20px; color: #111111; margin: 0 0 12px;">Order Confirmed ✓</h2>
        <p style="color: #555555; font-size: 15px; margin: 0 0 8px;">Hey ${fullName}, thanks for your order!</p>
        <p style="color: #555555; font-size: 15px; margin: 0 0 24px;">Your order <strong>#${orderId}</strong> is being processed and will be shipped within 2–5 business days.</p>
        <p style="color: #888888; font-size: 13px; margin: 0;">Questions? Email us at <a href="mailto:vyrastore07@gmail.com" style="color: #111111;">vyrastore07@gmail.com</a></p>
      </div>

      <div style="padding: 16px 32px; text-align: center; border-top: 1px solid #eeeeee;">
        <p style="font-size: 11px; color: #cccccc; letter-spacing: 2px; margin: 0;">© 2025 VYRA. ALL RIGHTS RESERVED.</p>
      </div>

    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: "VYRA Store <onboarding@resend.dev>",
      to: email,
      subject: `Order Confirmed — #${orderId} | VYRA`,
      html,
    });

    if (result.error) {
      console.error("Resend returned an error:", result.error);
      return NextResponse.json(
        { success: false, error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: result.data?.id });
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send email" },
      { status: 500 }
    );
  }
}