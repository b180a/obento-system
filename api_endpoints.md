APIエンドポイント定義

ユーザー向け

POST /api/register: ユーザー情報（学年・組・名）の登録・保存

GET /api/menu?date=YYYY-MM-DD: 指定された日の週替わりメニューを取得

POST /api/order: 注文の実行

バリデーション:

delivery_dateが今日より先か。

17時を過ぎていないか（翌日注文の場合）。

ticket_numberが6桁英数字か。

管理者向け

GET /api/admin/orders?date=YYYY-MM-DD: 特定の日の注文一覧取得

POST /api/admin/menu/update: メニュー情報の更新

GET /api/admin/export: 注文データのCSVダウンロード