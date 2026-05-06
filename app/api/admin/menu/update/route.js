export const runtime = "edge";

import { NextResponse } from "next/server";
import { upsertMenu } from "../../../../../lib/db";
import {
  formatDateInput,
  getCurrentWeekStart,
  getWeekStart,
  parseDateInput,
} from "../../../../../lib/date";

async function saveUploadedFile(file, prefix) {
  if (!(file instanceof File) || file.size === 0) {
    return null;
  }

  const filename = file.name || "";
  const extMatch = filename.match(/\.[^.]+$/);
  const ext = extMatch ? extMatch[0].toLowerCase() : ".jpg";
  const safeExt = ext.length <= 10 ? ext : ".jpg";
  const bytes = await file.arrayBuffer();
  
  const key = `${prefix}-${crypto.randomUUID()}${safeExt}`;

  // Cloudflare R2
  const bucket = process.env.obento_images;
  if (bucket) {
    await bucket.put(key, bytes, {
      httpMetadata: { contentType: file.type || "image/jpeg" },
    });
    return key; // R2のキー（ファイル名）を保存
  }

  console.warn("R2 bucket 'obento_images' not bound.");
  return null;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const referenceDate = parseDateInput(String(formData.get("reference_date") || ""));

    if (!referenceDate) {
      return NextResponse.json(
        { error: "週の基準日を指定してください。" },
        { status: 400 },
      );
    }

    const items = ["item_1", "item_2", "item_3", "item_4"].map((field) =>
      String(formData.get(field) || "").trim(),
    );
    const sizes = ["item_1_sizes", "item_2_sizes", "item_3_sizes", "item_4_sizes"].map(
      (field) => String(formData.get(field) || "").trim(),
    );
    const options = ["item_1_options", "item_2_options", "item_3_options", "item_4_options"].map(
      (field) => String(formData.get(field) || "").trim(),
    );
    const currentImages = ["item_1_image", "item_2_image", "item_3_image", "item_4_image"].map(
      (field) => String(formData.get(field) || "").trim(),
    );
    const removeImages = [
      "item_1_image_remove",
      "item_2_image_remove",
      "item_3_image_remove",
      "item_4_image_remove",
    ].map((field) => String(formData.get(field) || "") === "true");

    if (items.some((item) => !item)) {
      return NextResponse.json(
        { error: "4種類すべてのメニュー名を入力してください。" },
        { status: 400 },
      );
    }

    const targetWeekStart = getWeekStart(referenceDate);
    const currentWeekStart = getCurrentWeekStart();

    if (targetWeekStart <= currentWeekStart) {
      return NextResponse.json(
        { error: "当週および過去週のメニューは編集できません。" },
        { status: 400 },
      );
    }

    const images = await Promise.all(
      ["item_1_image_file", "item_2_image_file", "item_3_image_file", "item_4_image_file"].map(
        async (field, index) => {
          const uploaded = await saveUploadedFile(
            formData.get(field),
            `${formatDateInput(targetWeekStart)}-${index + 1}`,
          );

          if (uploaded) {
            return uploaded;
          }

          if (removeImages[index]) {
            return "";
          }

          return currentImages[index];
        },
      ),
    );

    const menu = await upsertMenu({
      week_start_date: formatDateInput(targetWeekStart),
      item_1: items[0],
      item_1_image: images[0],
      item_1_sizes: sizes[0],
      item_1_options: options[0],
      item_2: items[1],
      item_2_image: images[1],
      item_2_sizes: sizes[1],
      item_2_options: options[1],
      item_3: items[2],
      item_3_image: images[2],
      item_3_sizes: sizes[2],
      item_3_options: options[2],
      item_4: items[3],
      item_4_image: images[3],
      item_4_sizes: sizes[3],
      item_4_options: options[3],
    });

    return NextResponse.json({ menu });
  } catch (error) {
    console.error("Menu update error:", error);
    return NextResponse.json(
      { error: `サーバーエラー: ${error.message}` },
      { status: 500 },
    );
  }
}
