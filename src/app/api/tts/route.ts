import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/tts
 *
 * Cloud-assisted text-to-speech endpoint for vernacular languages (such as Hindi)
 * when client devices lack native OS voice packs (e.g., standard Windows PCs without Devanagari TTS).
 *
 * Streams high-fidelity audio/mpeg back to the client.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text")?.trim();
  const lang = searchParams.get("lang") || "hi";

  if (!text) {
    return new NextResponse("Missing text parameter", { status: 400 });
  }

  // Cap text length for single-chunk safety
  const safeText = text.slice(0, 300);

  try {
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(
      lang
    )}&q=${encodeURIComponent(safeText)}`;

    const response = await fetch(ttsUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://translate.google.com/",
      },
    });

    if (!response.ok) {
      return new NextResponse(`Upstream TTS service returned ${response.status}`, {
        status: response.status,
      });
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal TTS error";
    return new NextResponse(message, { status: 500 });
  }
}
