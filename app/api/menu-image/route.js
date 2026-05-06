export const runtime = "edge";

import { NextResponse } from "next/server";

export async function GET(request) {
  const pathname = request.nextUrl.searchParams.get("pathname");

  if (!pathname) {
    return NextResponse.json({ error: "pathname is required" }, { status: 400 });
  }

  // Cloudflare R2
  const bucket = process.env.obento_images;
  if (!bucket) {
    return NextResponse.json({ error: "R2 bucket is not configured" }, { status: 500 });
  }

  const object = await bucket.get(pathname);

  if (!object) {
    return new NextResponse("Not found", { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=3600, must-revalidate");

  return new NextResponse(object.body, {
    headers,
  });
}
