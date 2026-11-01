
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SECRET_KEY."
    );
  }

  return createClient(url, key);
}

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;

  if (!key) {
    console.warn("RESEND_API_KEY is not configured.");
    return null;
  }

  return new Resend(key);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const replacements: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return replacements[character] || character;
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { email } = body;

    if (
      !email ||
      typeof email !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Email is required.",
        },
        { status: 400 }
      );
    }

    const trimmedEmail = email
      .trim()
      .toLowerCase();

    if (!isValidEmail(trimmedEmail)) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a valid email address.",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Save the newsletter subscriber.
    const { error: dbError } = await supabase
      .from("newsletter_subscribers")
      .insert({
        email: trimmedEmail,
      });

    if (dbError) {
      // PostgreSQL unique constraint violation.
      if (dbError.code === "23505") {
        return NextResponse.json(
          {
            success: false,
            error: "You're already subscribed!",
          },
          { status: 409 }
        );
      }

      console.error(
        "Supabase newsletter insert error:",
        dbError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Something went wrong. Please try again.",
        },
        { status: 500 }
      );
    }

    // Email notifications are optional.
    // The subscription is already stored.

    const resend = getResend();

    if (resend) {
      const safeEmail = escapeHtml(trimmedEmail);

      // Notify the store owner.
      try {
        const { error } = await resend.emails.send({
          from: "VYRA Store <onboarding@resend.dev>",
          to: "vyrastore07@gmail.com",
          subject: "New Newsletter Signup - VYRA",
          html: `
            <div style="font-family: Helvetica, Arial, sans-serif; padding: 20px;">
              <h2>New Newsletter Signup</h2>

              <p>
                <strong>Email:</strong>
                ${safeEmail}
              </p>

              <p>
                <strong>Date:</strong>
                ${new Date().toLocaleString("en-US")}
              </p>
            </div>
          `,
        });

        if (error) {
          console.error(
            "Newsletter owner notification error:",
            error
          );
        }
      } catch (error) {
        console.error(
          "Failed to send newsletter notification:",
          error
        );
      }

      // Send subscriber welcome email.
      try {
        const { error } = await resend.emails.send({
          from: "VYRA <onboarding@resend.dev>",
          to: trimmedEmail,
          subject: "Welcome to VYRA",
          html: `
            <div style="font-family: Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto;">
              <div style="background: #000000; padding: 32px; text-align: center;">
                <h1 style="color: #ffffff; font-size: 28px; letter-spacing: 8px; margin: 0; font-weight: 300;">
                  VYRA
                </h1>
              </div>

              <div style="padding: 32px; text-align: center;">
                <h2 style="font-size: 20px; color: #111111;">
                  You're on the list ✓
                </h2>

                <p style="color: #555555; font-size: 15px;">
                  Thanks for subscribing!
                  You'll be the first to know about
                  new drops, exclusive offers,
                  and updates.
                </p>

                <p style="color: #888888; font-size: 13px;">
                  Questions? Email us at
                  <a href="mailto:vyrastore07@gmail.com">
                    vyrastore07@gmail.com
                  </a>
                </p>
              </div>

              <div style="padding: 16px 32px; text-align: center; border-top: 1px solid #eeeeee;">
                <p style="font-size: 11px; color: #cccccc; letter-spacing: 2px;">
                  © 2026 VYRA. ALL RIGHTS RESERVED.
                </p>
              </div>
            </div>
          `,
        });

        if (error) {
          console.error(
            "Newsletter welcome email error:",
            error
          );
        }
      } catch (error) {
        console.error(
          "Failed to send newsletter welcome email:",
          error
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Successfully subscribed!",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Newsletter signup error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}
