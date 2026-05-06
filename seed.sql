-- Initial Menu Data
DELETE FROM menus;

INSERT INTO menus (
    week_start_date, 
    item_1, item_1_image, item_1_sizes, item_1_options,
    item_2, item_2_image, item_2_sizes, item_2_options,
    item_3, item_3_image, item_3_sizes, item_3_options,
    item_4, item_4_image, item_4_sizes, item_4_options
)
VALUES (
    '2026-04-27', 
    '鶏の照り焼き弁当', '', '[{"label":"M","desc":"通常サイズ"}]', '["マヨネーズ","七味"]',
    '鮭の塩焼き弁当', '', '[{"label":"M","desc":"通常サイズ"}]', '[]',
    'ハンバーグ弁当', '', '[{"label":"M","desc":"通常サイズ"}]', '["チーズトッピング"]',
    '牛めし', '', '[{"label":"S","desc":"ライス150g"},{"label":"M","desc":"ライス200g"},{"label":"L","desc":"ライス300g"}]', '["つゆだく","ネギ抜き","その他"]'
);

INSERT INTO menus (
    week_start_date, 
    item_1, item_1_image, item_1_sizes, item_1_options,
    item_2, item_2_image, item_2_sizes, item_2_options,
    item_3, item_3_image, item_3_sizes, item_3_options,
    item_4, item_4_image, item_4_sizes, item_4_options
)
VALUES (
    '2026-05-04', 
    'からあげ弁当', '', '[{"label":"M","desc":"通常サイズ"}]', '["レモンあり","マヨネーズ"]',
    '豚しょうが焼き弁当', '', '[{"label":"M","desc":"通常サイズ"}]', '[]',
    '白身魚フライ弁当', '', '[{"label":"M","desc":"通常サイズ"}]', '["タルタル増し"]',
    '三色そぼろ弁当', '', '[{"label":"M","desc":"通常サイズ"}]', '[]'
);

-- Initial Holiday Data
INSERT INTO holidays (date, reason) VALUES ('2026-05-01', '創立記念日');

-- Initial Settings
INSERT OR IGNORE INTO settings (key, value) VALUES ('debug_mode', 'off');
