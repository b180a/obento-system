export const runtime = "edge";

import { NextResponse } from "next/server";
import { createOrder, getHolidays, getMenuByDate, saveUser } from "../../../lib/db";
import { canOrderDateForOrderWindow, parseDateInput } from "../../../lib/date";
import { Resend } from "resend";

const ALLOWED_GRADES = ["小１", "小２", "小３", "小４", "小５", "小６", "中１", "中２", "中３"];
const ALLOWED_CLASSES = ["１組", "２組", "３組", "４組", "５組"];

export async function POST(request) {
  try {
    const body = await request.json();
    const deliveryDate = String(body.delivery_date || "");
    const ticketNumber = String(body.ticket_number || "").trim();
    const selectedMenuItem = String(body.selected_menu_item || "").trim();
    const size = String(body.size || "M").trim();
    const options = body.options || [];
    const otherOptionText = String(body.other_option_text || "").trim();

    const ALLOWED_SIZES = ["S", "M", "L"];
    if (!ALLOWED_SIZES.includes(size)) {
      return NextResponse.json({ error: "サイズが不正です。" }, { status: 400 });
    }

    const date = parseDateInput(deliveryDate);
    if (!date) {
      return NextResponse.json({ error: "日付が不正です。" }, { status: 400 });
    }

    const holidaysData = await getHolidays();
    const holidays = holidaysData.map((h) => h.date);

    // デバッグモードの状態を確認
    const { isDebugMode } = await import("../../../lib/db");
    const debugMode = await isDebugMode();

    const validation = canOrderDateForOrderWindow(date, undefined, holidays, debugMode);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.message }, { status: 400 });
    }

    if (!/^[A-Z0-9]{6}$/.test(ticketNumber)) {
      return NextResponse.json(
        { error: "チケット番号は6桁の英数字で入力してください。" },
        { status: 400 },
      );
    }

    const menu = await getMenuByDate(deliveryDate);
    if (!menu) {
      return NextResponse.json(
        { error: "指定週のメニューが未設定です。" },
        { status: 400 },
      );
    }

    const items = [menu.item_1, menu.item_2, menu.item_3, menu.item_4];
    if (!items.includes(selectedMenuItem)) {
      return NextResponse.json(
        { error: "選択されたメニューが無効です。" },
        { status: 400 },
      );
    }

    const grade = String(body.grade || "").trim();
    const className = String(body.class_name || "").trim();
    const fullName = String(body.full_name || "").trim();
    const email = String(body.email || "").trim();

    if (!grade || !className || !fullName) {
      return NextResponse.json(
        { error: "学年・組・氏名を入力してください。" },
        { status: 400 },
      );
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "メールアドレスの形式が正しくありません。" },
        { status: 400 },
      );
    }

    if (!ALLOWED_GRADES.includes(grade)) {
      return NextResponse.json({ error: "学年の選択が不正です。" }, { status: 400 });
    }

    if (!ALLOWED_CLASSES.includes(className)) {
      return NextResponse.json({ error: "組の選択が不正です。" }, { status: 400 });
    }

    const user = await saveUser({
      grade,
      class_name: className,
      full_name: fullName,
      email,
    });

    const order = await createOrder({
      user_id: user.id,
      delivery_date: deliveryDate,
      ticket_number: ticketNumber,
      selected_menu_item: selectedMenuItem,
      size,
      options: JSON.stringify(options),
      other_option_text: otherOptionText,
    });

    // メール送信処理 (エラーが起きても注文自体は成功させるために個別にtry-catch)
    if (email && process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "Obento System <onboarding@resend.dev>",
          to: email,
          subject: "【予約完了】お弁当の注文を受け付けました",
          html: `
            <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
              <h2 style="color: #b94c2f;">お弁当の予約が完了しました</h2>
              <p>${fullName} 様</p>
              <p>この度はお弁当をご注文いただき、誠にありがとうございます。<br>以下の内容で予約を承りました。</p>
              
              <div style="background: #f9f9f9; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #eee;">
                <ul style="list-style: none; padding: 0; margin: 0;">
                  <li style="margin-bottom: 8px;"><strong>受取日:</strong> ${deliveryDate}</li>
                  <li style="margin-bottom: 8px;"><strong>メニュー:</strong> ${selectedMenuItem} (${size})</li>
                  ${options.length > 0 ? `<li style="margin-bottom: 8px;"><strong>オプション:</strong> ${options.join(", ")}</li>` : ""}
                  ${otherOptionText ? `<li style="margin-bottom: 8px;"><strong>その他:</strong> ${otherOptionText}</li>` : ""}
                  <li style="margin-bottom: 0;"><strong>チケット番号:</strong> ${ticketNumber}</li>
                </ul>
              </div>
              
              <p style="font-size: 0.9em; color: #666;">
                ※当日はチケット番号の控えをご持参ください。<br>
                ※キャンセルや変更がある場合は、前日の17時までにご連絡ください。
              </p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="font-size: 0.8em; color: #999;">本メールはシステムより自動送信されています。</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Resend API error:", emailError);
      }
    }

    return NextResponse.json({ order, user });
  } catch (error) {
    console.error("Order process error:", error);
    return NextResponse.json(
      { error: `サーバーエラーが発生しました: ${error.message}` },
      { status: 500 }
    );
  }
}
