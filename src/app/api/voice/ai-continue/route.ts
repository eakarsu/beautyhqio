import { NextRequest, NextResponse } from "next/server";
import { generateTwiML } from "@/lib/twilio";

// POST /api/voice/ai-continue - Continue AI conversation
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const speechResult = formData.get("SpeechResult") as string;
    const from = formData.get("From") as string;

    if (!speechResult) {
      // No speech detected, prompt again
      const twiml = generateTwiML({
        say: {
          text: "I didn't catch that. Could you please repeat?",
        },
        gather: {
          action: "/api/voice/ai-continue",
          timeout: 10,
          speechTimeout: "auto",
          input: ["speech"],
        },
      });

      return new NextResponse(twiml, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Call AI voice receptionist
    const aiResponse = await fetch(
      new URL("/api/ai/voice-receptionist", request.url).toString(),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          speechInput: speechResult,
          from,
          context: "ongoing conversation",
        }),
      }
    );

    const aiData = await aiResponse.json();

    // Check for special actions
    if (aiData.actions?.includes("transfer")) {
      const twiml = generateTwiML({
        say: {
          text: aiData.response,
        },
        redirect: "/api/voice/transfer",
      });

      return new NextResponse(twiml, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    if (aiData.actions?.includes("booking")) {
      // Check for booking intent keywords
      const lowerSpeech = speechResult.toLowerCase();
      if (
        lowerSpeech.includes("yes") ||
        lowerSpeech.includes("book") ||
        lowerSpeech.includes("schedule")
      ) {
        const twiml = generateTwiML({
          say: {
            text: aiData.response,
          },
          redirect: "/api/voice/book",
        });

        return new NextResponse(twiml, {
          headers: { "Content-Type": "text/xml" },
        });
      }
    }

    // Continue AI conversation
    const twiml = generateTwiML({
      say: {
        text: aiData.response,
        voice: "Polly.Joanna",
      },
      gather: {
        action: "/api/voice/ai-continue",
        timeout: 10,
        speechTimeout: "auto",
        input: ["speech"],
      },
    });

    // Add fallback for no response
    const finalTwiml = twiml.replace(
      "</Response>",
      "<Say voice=\"Polly.Joanna\">I didn't hear anything. Is there anything else I can help you with?</Say><Gather action=\"/api/voice/ai-continue\" timeout=\"10\" speechTimeout=\"auto\" input=\"speech\"></Gather><Say voice=\"Polly.Joanna\">Thank you for calling. Goodbye!</Say><Hangup/></Response>"
    );

    return new NextResponse(finalTwiml, {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("Error in AI continue:", error);

    const errorTwiml = generateTwiML({
      say: {
        text: "I apologize, I'm having some trouble. Let me transfer you to someone who can help.",
      },
      redirect: "/api/voice/transfer",
    });

    return new NextResponse(errorTwiml, {
      headers: { "Content-Type": "text/xml" },
    });
  }
}
