-- ユーザー情報
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    grade TEXT NOT NULL,         -- 学年
    class_name TEXT NOT NULL,    -- 組
    full_name TEXT NOT NULL,     -- 名前
    email TEXT,                  -- メールアドレス
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 週替わりメニュー
CREATE TABLE menus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    week_start_date DATE NOT NULL, -- その週の月曜日の日付
    item_1 TEXT NOT NULL,
    item_1_image TEXT,
    item_1_sizes TEXT,             -- JSON: [{label, desc}]
    item_1_options TEXT,           -- JSON: [string]
    item_2 TEXT NOT NULL,
    item_2_image TEXT,
    item_2_sizes TEXT,
    item_2_options TEXT,
    item_3 TEXT NOT NULL,
    item_3_image TEXT,
    item_3_sizes TEXT,
    item_3_options TEXT,
    item_4 TEXT NOT NULL,
    item_4_image TEXT,
    item_4_sizes TEXT,
    item_4_options TEXT
);

-- 注文データ
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    delivery_date DATE NOT NULL,  -- お弁当を食べる日
    ticket_number TEXT NOT NULL,  -- 6桁の英数字チケット番号
    selected_menu_item TEXT NOT NULL,
    size TEXT NOT NULL,           -- サイズ (S, M, L)
    options TEXT,                 -- オプション (JSON配列)
    other_option_text TEXT,       -- その他の内容
    status TEXT DEFAULT 'pending', -- 注文状態
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 休業日
CREATE TABLE holidays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL UNIQUE,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- システム設定
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
