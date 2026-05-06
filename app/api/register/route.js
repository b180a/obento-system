export const runtime = "edge";

import { NextResponse } from "next/server";
import { saveUser } from "../../../lib/db";

export async function POST(request) {
  const body = await request.json();
  const grade = String(body.grade || "").trim();
  const className = String(body.class_name || "").trim();
  const fullName = String(body.full_name || "").trim();

  if (!grade || !className || !fullName) {
    return NextResponse.json(
      { error: "学年・組・氏名を入力してください。" },
      { status: 400 },
    );
  }

  const user = await saveUser({
    grade,
    class_name: className,
    full_name: fullName,
  });

  return NextResponse.json({ user });
}
