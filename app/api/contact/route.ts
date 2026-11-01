
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

    const { name, email, subject, message } = body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof subject !== "string" ||
      typeof message !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !subject.trim() ||
      !message.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "All fields are required.",
        },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

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

    // Save the contact message before sending emails.
    const { error: dbError } = await supabase
      .from("contact_messages")
      .insert({
        name: trimmedName,
        email: trimmedEmail,
        subject: trimmedSubject,
        message: trimmedMessage,
      });

    if (dbError) {
      console.error(
        "Supabase contact_messages insert error:",
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
    // The database submission remains successful
    // even when email delivery fails.

    const resend = getResend();

    if (resend) {
      const safeName = escapeHtml(trimmedName);
      const safeEmail = escapeHtml(trimmedEmail);
      const safeSubject = escapeHtml(trimmedSubject);
      const safeMessage = escapeHtml(trimmedMessage);

      // Notify the store owner.
      try {
        const { data, error } = await resend.emails.send({
          from: "VYRA Contact Form <onboarding@resend.dev>",
          to: "vyrastore07@gmail.com",
          replyTo: trimmedEmail,
          subject: `[Contact] ${trimmedSubject} — from ${trimmedName}`,
          html: `
            <div style="font-family: Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto;">
              <div style="background: #000000; padding: 24px; text-align: center;">
                <h1 style="color: #ffffff; font-size: 22px; letter-spacing: 6px; margin: 0; font-weight: 300;">
                  VYRA
                </h1>
              </div>

              <div style="padding: 24px;">
                <h2 style="font-size: 18px; color: #111111;">
                  New Contact Form Submission
                </h2>

                <p><strong>Name:</strong> ${safeName}</p>
                <p><strong>Email:</strong> ${safeEmail}</p>
                <p><strong>Subject:</strong> ${safeSubject}</p>

                <p><strong>Message:</strong></p>

                <p style="background: #f7f7f7; padding: 12px; border-radius: 6px; white-space: pre-wrap;">
                  ${safeMessage}
                </p>
              </div>
            </div>
          `,
        });

        if (error) {
          console.error(
            "Resend owner notification error:",
            error
          );
        } else {
          console.log(
            "Contact notification sent:",
            data?.id
          );
        }
      } catch (error) {
        console.error(
          "Contact owner email failed:",
          error
        );
      }

      // Send customer confirmation.
      try {
        const { data, error } = await resend.emails.send({
          from: "VYRA <onboarding@resend.dev>",
          to: trimmedEmail,
          subject: "We received your message — VYRA",
          html: `
            <div style="font-family: Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto;">
              <div style="background: #000000; padding: 32px; text-align: center;">
                <h1 style="color: #ffffff; font-size: 28px; letter-spacing: 8px; margin: 0; font-weight: 300;">
                  VYRA
                </h1>
              </div>

              <div style="padding: 32px; text-align: center;">
                <h2 style="font-size: 20px; color: #111111;">
                  Message received ✓
                </h2>

                <p>
                  Hey ${safeName}, thanks for reaching out!
                </p>

                <p>
                  We usually respond within 24 hours.
                  Here's a copy of what you sent us:
                </p>

                <p style="background: #f7f7f7; padding: 12px; border-radius: 6px; text-align: left; white-space: pre-wrap;">
                  ${safeMessage}
                </p>

                <p>
                  Questions in the meantime?
                  Email us at
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
            "Resend customer auto-reply error:",
            error
          );
        } else {
          console.log(
            "Contact auto-reply sent:",
            data?.id
          );
        }
      } catch (error) {
        console.error(
          "Contact auto-reply failed:",
          error
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Message sent successfully!",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Contact form error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}
