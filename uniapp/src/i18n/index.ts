import { computed, ref } from "vue";

export type AppLanguage = "zh-CN" | "en" | "ja" | "ko";

export interface LanguageOption {
  id: AppLanguage;
  nativeName: string;
  shortName: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { id: "zh-CN", nativeName: "中文", shortName: "中" },
  { id: "en", nativeName: "English", shortName: "EN" },
  { id: "ja", nativeName: "日本語", shortName: "日" },
  { id: "ko", nativeName: "한국어", shortName: "한" },
];

type Translation = { en: string; ja: string; ko: string };

// Common mobile-app wording is aligned with established open-source app locales.
// OOTD is intentionally never translated because it is part of the product name.
const DICTIONARY: Record<string, Translation> = {
  "明天穿什么": { en: "What to Wear", ja: "明日のコーデ", ko: "내일 뭐 입지" },
  "OOTD 明天穿什么": { en: "OOTD What to Wear", ja: "OOTD 明日のコーデ", ko: "OOTD 내일 뭐 입지" },
  "首页": { en: "Home", ja: "ホーム", ko: "홈" },
  "衣橱": { en: "Closet", ja: "クローゼット", ko: "옷장" },
  "穿搭": { en: "Looks", ja: "コーデ", ko: "코디" },
  "我的": { en: "Profile", ja: "マイページ", ko: "마이" },
  "个人中心": { en: "Profile", ja: "マイページ", ko: "마이페이지" },
  "我的衣橱": { en: "My Closet", ja: "マイクローゼット", ko: "내 옷장" },
  "穿搭灵感": { en: "Outfit Ideas", ja: "コーデのヒント", ko: "코디 아이디어" },
  "穿搭记录": { en: "Outfit History", ja: "コーデ履歴", ko: "코디 기록" },
  "穿搭好物": { en: "Closet Picks", ja: "おすすめアイテム", ko: "추천 아이템" },
  "动画演示": { en: "Quick Tour", ja: "使い方ガイド", ko: "사용 가이드" },
  "添加单品": { en: "Add Item", ja: "アイテムを追加", ko: "아이템 추가" },
  "添加衣物": { en: "Add Clothes", ja: "服を追加", ko: "의류 추가" },
  "数据存储": { en: "Data & Storage", ja: "データと保存", ko: "데이터 및 저장" },
  "数据与存储": { en: "Data & Storage", ja: "データと保存", ko: "데이터 및 저장" },
  "主题设置": { en: "Theme", ja: "テーマ設定", ko: "테마 설정" },
  "语言设置": { en: "Language", ja: "言語設定", ko: "언어 설정" },
  "选择语言": { en: "Choose Language", ja: "言語を選択", ko: "언어 선택" },
  "界面语言": { en: "App Language", ja: "表示言語", ko: "앱 언어" },
  "切换后立即应用到整个应用": { en: "Applied across the app instantly", ja: "アプリ全体にすぐ反映されます", ko: "앱 전체에 바로 적용됩니다" },
  "中文": { en: "Chinese", ja: "中国語", ko: "중국어" },
  "英文": { en: "English", ja: "英語", ko: "영어" },
  "日文": { en: "Japanese", ja: "日本語", ko: "일본어" },
  "韩文": { en: "Korean", ja: "韓国語", ko: "한국어" },
  "AI 助手": { en: "AI Assistant", ja: "AI アシスタント", ko: "AI 도우미" },
  "AI 设置": { en: "AI SETTINGS", ja: "AI 設定", ko: "AI 설정" },
  "AI 助手设置": { en: "AI Assistant", ja: "AI アシスタント設定", ko: "AI 도우미 설정" },
  "意见反馈": { en: "Feedback", ja: "ご意見・ご要望", ko: "의견 보내기" },
  "内容仅保存在本机": { en: "Saved only on this device", ja: "内容はこの端末にのみ保存されます", ko: "내용은 이 기기에만 저장됩니다" },
  "将通过系统分享发送给开发者": { en: "Send to the developers through system sharing", ja: "システム共有で開発者に送信します", ko: "시스템 공유로 개발자에게 보냅니다" },
  "发送给开发者": { en: "Send to Developers", ja: "開発者に送信", ko: "개발자에게 보내기" },
  "开发者反馈": { en: "Developer Feedback", ja: "開発者へのフィードバック", ko: "개발자 피드백" },
  "反馈类型": { en: "Feedback Type", ja: "フィードバックの種類", ko: "피드백 유형" },
  "已打开系统分享": { en: "System sharing opened", ja: "システム共有を開きました", ko: "시스템 공유를 열었습니다" },
  "发送失败，请重试": { en: "Couldn't send. Please try again.", ja: "送信できませんでした。もう一度お試しください。", ko: "보내지 못했습니다. 다시 시도해 주세요." },
  "功能建议": { en: "Feature Idea", ja: "機能の提案", ko: "기능 제안" },
  "体验问题": { en: "App Issue", ja: "使い心地の問題", ko: "사용 문제" },
  "其他": { en: "Other", ja: "その他", ko: "기타" },
  "写下你的建议或遇到的问题": { en: "Tell us your idea or issue", ja: "ご提案や困ったことを入力してください", ko: "제안이나 문제를 적어 주세요" },
  "关于": { en: "About", ja: "このアプリについて", ko: "앱 정보" },
  "清空数据": { en: "Clear Data", ja: "データを消去", ko: "데이터 삭제" },
  "清空所有数据": { en: "Clear All Data", ja: "すべてのデータを消去", ko: "모든 데이터 삭제" },
  "总单品": { en: "Items", ja: "アイテム", ko: "아이템" },
  "收藏": { en: "Favorites", ja: "お気に入り", ko: "즐겨찾기" },
  "品类": { en: "Categories", ja: "カテゴリー", ko: "카테고리" },
  "单品": { en: "Item", ja: "アイテム", ko: "아이템" },
  "已开启": { en: "On", ja: "オン", ko: "켜짐" },
  "未开启": { en: "Off", ja: "オフ", ko: "꺼짐" },
  "今日天气": { en: "Weather", ja: "今日の天気", ko: "오늘의 날씨" },
  "今日灵感": { en: "Today's Inspiration", ja: "今日のヒント", ko: "오늘의 아이디어" },
  "今日推荐": { en: "Today's Pick", ja: "今日のおすすめ", ko: "오늘의 추천" },
  "随机推荐会不定期变换；天气看「今日天气」，按场景和风格到「穿搭灵感」。": { en: "Picks change at random. Use Weather for weather-based looks, or Outfit Ideas for occasion and style.", ja: "おすすめはランダムに変わります。天気に合わせるなら「今日の天気」、シーンやスタイルは「コーデのヒント」で選べます。", ko: "추천은 무작위로 바뀝니다. 날씨 코디는 ‘오늘의 날씨’에서, 상황과 스타일은 ‘코디 아이디어’에서 고르세요." },
  "随机推荐今日穿搭。天气推荐穿搭见「今日天气」模块，个性化场景风格推荐穿搭请到「穿搭灵感」页面。": { en: "Today's look is picked at random. Find weather-based looks in Weather, and personalized occasion or style looks in Outfit Ideas.", ja: "今日のコーデはランダムに選ばれます。天気に合わせるなら「今日の天気」、シーンやスタイルに合わせるなら「コーデのヒント」をご利用ください。", ko: "오늘의 코디는 무작위로 추천됩니다. 날씨 코디는 ‘오늘의 날씨’에서, 상황과 스타일 맞춤 코디는 ‘코디 아이디어’에서 확인하세요." },
  "换一套": { en: "Shuffle", ja: "別のコーデ", ko: "다른 코디" },
  "你的魔法衣橱": { en: "Your Magic Closet", ja: "魔法のクローゼット", ko: "나만의 마법 옷장" },
  "你的": { en: "Your", ja: "あなたの", ko: "나의" },
  "魔法衣橱": { en: "Magic Closet", ja: "魔法のクローゼット", ko: "마법 옷장" },
  "生成今日穿搭": { en: "Create Today's Look", ja: "今日のコーデを作成", ko: "오늘의 코디 만들기" },
  "今天准备去哪里？": { en: "Where are you going today?", ja: "今日はどこへ行きますか？", ko: "오늘 어디에 가나요?" },
  "选择场景": { en: "Choose Occasion", ja: "シーンを選択", ko: "상황 선택" },
  "推荐场景": { en: "Suggested Occasions", ja: "おすすめシーン", ko: "추천 상황" },
  "个性化条件": { en: "Preferences", ja: "こだわり条件", ko: "맞춤 조건" },
  "按当前天气推荐": { en: "Use Current Weather", ja: "現在の天気を使用", ko: "현재 날씨 반영" },
  "搜索城市后，从候选地点中确认": { en: "Search for a city, then confirm a suggested location", ja: "都市を検索して候補から選択します", ko: "도시를 검색한 뒤 후보 위치를 선택하세요" },
  "个候选": { en: "matches", ja: "件の候補", ko: "개 후보" },
  "可用天气地点": { en: "Weather location", ja: "天気の地点", ko: "날씨 위치" },
  "未找到匹配地点": { en: "No matching place found", ja: "一致する場所が見つかりません", ko: "일치하는 장소를 찾지 못했어요" },
  "请尝试城市名、区县名或英文名。": { en: "Try a city, district, or English name.", ja: "都市名、地区名、または英語名でお試しください。", ko: "도시명, 지역명 또는 영문 이름으로 다시 시도해 보세요." },
  "清除搜索": { en: "Clear Search", ja: "検索をクリア", ko: "검색 지우기" },
  "结合天气推荐": { en: "Weather-aware", ja: "天気を反映", ko: "날씨 반영" },
  "暂无可用天气": { en: "No weather available", ja: "利用できる天気情報がありません", ko: "사용 가능한 날씨 정보가 없어요" },
  "查看天气": { en: "View Weather", ja: "天気を見る", ko: "날씨 보기" },
  "未参考天气": { en: "Weather not used", ja: "天気は未使用", ko: "날씨 미반영" },
  "根据当前衣橱生成": { en: "Based on your closet", ja: "クローゼットから提案", ko: "내 옷장 기준" },
  "找灵感": { en: "Ideas", ja: "ヒントを探す", ko: "아이디어" },
  "搜索穿搭灵感": { en: "Search outfit ideas", ja: "コーデのヒントを検索", ko: "코디 아이디어 검색" },
  "输入灵感，如逛街、日常、简约…": { en: "Try shopping, casual, minimal…", ja: "買い物、普段着、シンプルなど…", ko: "쇼핑, 데일리, 미니멀 등…" },
  "选择灵感后开始推荐": { en: "Choose an idea to get looks", ja: "ヒントを選んでコーデを作成", ko: "아이디어를 선택해 코디 받기" },
  "选择场景生成穿搭。": { en: "Choose an occasion to create looks.", ja: "シーンを選んでコーデを作成しましょう。", ko: "상황을 선택해 코디를 만들어 보세요." },
  "全部": { en: "All", ja: "すべて", ko: "전체" },
  "季节": { en: "Season", ja: "季節", ko: "계절" },
  "春季": { en: "Spring", ja: "春", ko: "봄" },
  "夏季": { en: "Summer", ja: "夏", ko: "여름" },
  "秋季": { en: "Autumn", ja: "秋", ko: "가을" },
  "冬季": { en: "Winter", ja: "冬", ko: "겨울" },
  "春": { en: "Spring", ja: "春", ko: "봄" },
  "夏": { en: "Summer", ja: "夏", ko: "여름" },
  "秋": { en: "Autumn", ja: "秋", ko: "가을" },
  "冬": { en: "Winter", ja: "冬", ko: "겨울" },
  "轻薄明亮的春装": { en: "Light, bright spring looks", ja: "軽やかで明るい春コーデ", ko: "가볍고 화사한 봄 코디" },
  "清凉透气的夏装": { en: "Cool, breathable summer looks", ja: "涼しく快適な夏コーデ", ko: "시원하고 통기성 좋은 여름 코디" },
  "温暖有层次的秋装": { en: "Warm, layered autumn looks", ja: "温かみのある重ね着コーデ", ko: "따뜻한 레이어드 가을 코디" },
  "保暖厚实的冬装": { en: "Warm winter layers", ja: "しっかり暖かな冬コーデ", ko: "도톰하고 따뜻한 겨울 코디" },
  "场景": { en: "Occasion", ja: "シーン", ko: "상황" },
  "风格": { en: "Style", ja: "スタイル", ko: "스타일" },
  "色系": { en: "Color", ja: "カラー", ko: "컬러" },
  "日常": { en: "Everyday", ja: "普段使い", ko: "데일리" },
  "通勤": { en: "Work", ja: "通勤", ko: "출근" },
  "办公": { en: "Office", ja: "オフィス", ko: "오피스" },
  "逛街": { en: "Shopping", ja: "ショッピング", ko: "쇼핑" },
  "约会": { en: "Date", ja: "デート", ko: "데이트" },
  "聚会": { en: "Party", ja: "集まり", ko: "모임" },
  "运动": { en: "Sport", ja: "スポーツ", ko: "운동" },
  "度假": { en: "Vacation", ja: "旅行", ko: "여행" },
  "户外": { en: "Outdoor", ja: "アウトドア", ko: "야외" },
  "面试": { en: "Interview", ja: "面接", ko: "면접" },
  "搜索衣橱": { en: "Search Closet", ja: "クローゼットを検索", ko: "옷장 검색" },
  "搜索衣物、颜色或标签": { en: "Search items, colors or tags", ja: "アイテム、色、タグを検索", ko: "아이템, 색상 또는 태그 검색" },
  "管理": { en: "Manage", ja: "管理", ko: "관리" },
  "完成": { en: "Done", ja: "完了", ko: "완료" },
  "筛选与排序": { en: "Filter & Sort", ja: "絞り込み・並べ替え", ko: "필터 및 정렬" },
  "排序方式": { en: "Sort By", ja: "並べ替え", ko: "정렬" },
  "最近添加": { en: "Newest", ja: "新しい順", ko: "최신순" },
  "最常穿": { en: "Most Worn", ja: "着用回数順", ko: "자주 입는 순" },
  "收藏优先": { en: "Favorites First", ja: "お気に入り優先", ko: "즐겨찾기 우선" },
  "只看收藏": { en: "Favorites Only", ja: "お気に入りのみ", ko: "즐겨찾기만" },
  "清除筛选": { en: "Clear Filters", ja: "絞り込みを解除", ko: "필터 초기화" },
  "上装": { en: "Tops", ja: "トップス", ko: "상의" },
  "短袖上衣": { en: "Short-Sleeve Top", ja: "半袖トップス", ko: "반소매 상의" },
  "长袖上衣": { en: "Long-Sleeve Top", ja: "長袖トップス", ko: "긴소매 상의" },
  "裤子": { en: "Pants", ja: "パンツ", ko: "바지" },
  "半身裙": { en: "Skirt", ja: "スカート", ko: "스커트" },
  "鞋子": { en: "Shoes", ja: "シューズ", ko: "신발" },
  "裤裙": { en: "Bottoms", ja: "ボトムス", ko: "하의" },
  "连衣裙": { en: "Dresses", ja: "ワンピース", ko: "원피스" },
  "外套": { en: "Outerwear", ja: "アウター", ko: "아우터" },
  "鞋": { en: "Shoes", ja: "シューズ", ko: "신발" },
  "配饰": { en: "Accessories", ja: "アクセサリー", ko: "액세서리" },
  "添加第一件衣物": { en: "Add Your First Item", ja: "最初の服を追加", ko: "첫 아이템 추가" },
  "衣橱空空如也": { en: "Your closet is empty", ja: "クローゼットは空です", ko: "옷장이 비어 있어요" },
  "当前搜索和筛选条件没有结果。": { en: "No items match your search or filters.", ja: "検索・絞り込み条件に一致するアイテムがありません。", ko: "검색 또는 필터와 일치하는 아이템이 없습니다." },
  "换个关键词试试。": { en: "Try another keyword.", ja: "別のキーワードをお試しください。", ko: "다른 검색어를 입력해 보세요." },
  "名称": { en: "Name", ja: "名前", ko: "이름" },
  "收藏单品": { en: "Favorites", ja: "お気に入り", ko: "즐겨찾기" },
  "保存穿搭": { en: "Saved Looks", ja: "保存コーデ", ko: "저장한 코디" },
  "类别": { en: "Category", ja: "カテゴリー", ko: "카테고리" },
  "颜色": { en: "Color", ja: "カラー", ko: "색상" },
  "主色": { en: "Main Color", ja: "メインカラー", ko: "주 색상" },
  "白色": { en: "White", ja: "白", ko: "흰색" },
  "黑色": { en: "Black", ja: "黒", ko: "검정" },
  "灰色": { en: "Gray", ja: "グレー", ko: "회색" },
  "红色": { en: "Red", ja: "赤", ko: "빨강" },
  "粉色": { en: "Pink", ja: "ピンク", ko: "분홍" },
  "橙色": { en: "Orange", ja: "オレンジ", ko: "주황" },
  "黄色": { en: "Yellow", ja: "黄", ko: "노랑" },
  "绿色": { en: "Green", ja: "緑", ko: "초록" },
  "蓝色": { en: "Blue", ja: "青", ko: "파랑" },
  "紫色": { en: "Purple", ja: "紫", ko: "보라" },
  "棕色": { en: "Brown", ja: "ブラウン", ko: "갈색" },
  "米色": { en: "Beige", ja: "ベージュ", ko: "베이지" },
  "藏青": { en: "Navy", ja: "ネイビー", ko: "네이비" },
  "多色": { en: "Multi", ja: "マルチカラー", ko: "멀티컬러" },
  "适合季节": { en: "Season", ja: "季節", ko: "계절" },
  "材质": { en: "Material", ja: "素材", ko: "소재" },
  "标签": { en: "Tags", ja: "タグ", ko: "태그" },
  "休闲": { en: "Casual", ja: "カジュアル", ko: "캐주얼" },
  "正式": { en: "Formal", ja: "フォーマル", ko: "포멀" },
  "街头": { en: "Street", ja: "ストリート", ko: "스트리트" },
  "复古": { en: "Retro", ja: "レトロ", ko: "레트로" },
  "简约": { en: "Minimal", ja: "ミニマル", ko: "미니멀" },
  "优雅": { en: "Elegant", ja: "エレガント", ko: "우아함" },
  "甜美": { en: "Sweet", ja: "ガーリー", ko: "러블리" },
  "仙女风": { en: "Fairy", ja: "フェアリー", ko: "페어리" },
  "梦幻少女": { en: "Dreamy", ja: "ドリーミー", ko: "드리미" },
  "粉色轻柔": { en: "Soft pink", ja: "やわらかなピンク", ko: "부드러운 핑크" },
  "极简 INS": { en: "Minimal", ja: "ミニマル", ko: "미니멀" },
  "黑白克制": { en: "Monochrome", ja: "モノトーン", ko: "모노톤" },
  "森系自然": { en: "Forest", ja: "ナチュラル", ko: "내추럴" },
  "清新温和": { en: "Fresh & calm", ja: "爽やかで穏やか", ko: "산뜻하고 편안함" },
  "轻盈日常": { en: "Light & easy", ja: "軽やかな日常", ko: "가벼운 데일리" },
  "商务": { en: "Business", ja: "ビジネス", ko: "비즈니스" },
  "度假风": { en: "Resort", ja: "リゾート", ko: "리조트" },
  "棉": { en: "Cotton", ja: "コットン", ko: "면" },
  "麻": { en: "Linen", ja: "リネン", ko: "린넨" },
  "丝绸": { en: "Silk", ja: "シルク", ko: "실크" },
  "雪纺": { en: "Chiffon", ja: "シフォン", ko: "시폰" },
  "牛仔": { en: "Denim", ja: "デニム", ko: "데님" },
  "羊毛": { en: "Wool", ja: "ウール", ko: "울" },
  "针织": { en: "Knit", ja: "ニット", ko: "니트" },
  "皮革": { en: "Leather", ja: "レザー", ko: "가죽" },
  "聚酯纤维": { en: "Polyester", ja: "ポリエステル", ko: "폴리에스터" },
  "编辑单品": { en: "Edit Item", ja: "アイテムを編集", ko: "아이템 편집" },
  "保存": { en: "Save", ja: "保存", ko: "저장" },
  "已保存": { en: "Saved", ja: "保存済み", ko: "저장됨" },
  "取消": { en: "Cancel", ja: "キャンセル", ko: "닫기" },
  "确认": { en: "Confirm", ja: "確認", ko: "확인" },
  "是": { en: "Yes", ja: "はい", ko: "예" },
  "否": { en: "No", ja: "いいえ", ko: "아니요" },
  "删除": { en: "Delete", ja: "削除", ko: "삭제" },
  "移除": { en: "Remove", ja: "削除", ko: "제거" },
  "撤销": { en: "Undo", ja: "元に戻す", ko: "실행 취소" },
  "返回": { en: "Back", ja: "戻る", ko: "뒤로" },
  "重试": { en: "Retry", ja: "再試行", ko: "다시 시도" },
  "重置": { en: "Reset", ja: "リセット", ko: "초기화" },
  "搜索": { en: "Search", ja: "検索", ko: "검색" },
  "添加": { en: "Add", ja: "追加", ko: "추가" },
  "导入": { en: "Import", ja: "読み込む", ko: "가져오기" },
  "导出": { en: "Export", ja: "書き出す", ko: "내보내기" },
  "复制": { en: "Copy", ja: "コピー", ko: "복사" },
  "分享": { en: "Share", ja: "共有", ko: "공유" },
  "拍照": { en: "Camera", ja: "カメラ", ko: "카메라" },
  "相册导入": { en: "Import Photos", ja: "写真から追加", ko: "사진 가져오기" },
  "拍照扫描": { en: "Scan with Camera", ja: "カメラでスキャン", ko: "카메라 스캔" },
  "拍照或从相册导入": { en: "Take a photo or import one", ja: "撮影または写真から追加", ko: "촬영하거나 사진을 가져오기" },
  "每次拍摄 1 件": { en: "1 item per photo", ja: "1回につき1点", ko: "사진 1장당 1개" },
  "还可选择": { en: "Up to", ja: "あと", ko: "최대" },
  "张": { en: " photos", ja: "枚", ko: "장" },
  "拍摄建议": { en: "Photo Tips", ja: "撮影のコツ", ko: "촬영 팁" },
  "衣物平铺 · 背景干净 · 光线均匀": { en: "Lay flat · Clean background · Even light", ja: "平置き・無地の背景・均一な明るさ", ko: "평평하게 · 깔끔한 배경 · 고른 조명" },
  "拍照或从相册导入，图片仅在本机处理。": { en: "Take a photo or import one. Images stay on this device.", ja: "撮影または写真から追加。画像は端末内で処理されます。", ko: "촬영하거나 사진을 가져오세요. 이미지는 기기에서만 처리됩니다." },
  "穿搭统计": { en: "Outfit Stats", ja: "コーデ統計", ko: "코디 통계" },
  "本周已穿": { en: "Worn This Week", ja: "今週の着用", ko: "이번 주 착용" },
  "利用率": { en: "Usage", ja: "活用率", ko: "활용도" },
  "满意度": { en: "Rating", ja: "満足度", ko: "만족도" },
  "推荐理由": { en: "Why It Works", ja: "おすすめ理由", ko: "추천 이유" },
  "删除此记录": { en: "Delete Record", ja: "履歴を削除", ko: "기록 삭제" },
  "管理记录": { en: "Manage Records", ja: "履歴を管理", ko: "기록 관리" },
  "按分类查看历史穿搭": { en: "Browse outfit history by category", ja: "カテゴリ別にコーデ履歴を確認", ko: "분류별 코디 기록 보기" },
  "选择此记录": { en: "Select This Record", ja: "この履歴を選択", ko: "이 기록 선택" },
  "已选中": { en: "Selected", ja: "選択済み", ko: "선택됨" },
  "批量删除": { en: "Delete Selected", ja: "選択した履歴を削除", ko: "선택 항목 삭제" },
  "删除后无法恢复，请确认。": { en: "This can't be undone. Continue?", ja: "削除後は元に戻せません。続行しますか？", ko: "삭제 후 되돌릴 수 없습니다. 계속할까요?" },
  "删除穿搭记录？": { en: "Delete this outfit record?", ja: "このコーデ履歴を削除しますか？", ko: "이 코디 기록을 삭제할까요?" },
  "已删除": { en: "Deleted", ja: "削除しました", ko: "삭제됨" },
  "暂无记录": { en: "No records yet", ja: "履歴はまだありません", ko: "아직 기록이 없어요" },
  "分享失败，请重试": { en: "Couldn't share. Please try again.", ja: "共有できませんでした。もう一度お試しください。", ko: "공유하지 못했습니다. 다시 시도해 주세요." },
  "需要相机权限": { en: "Camera Permission Needed", ja: "カメラの許可が必要です", ko: "카메라 권한이 필요합니다" },
  "允许相机权限后即可拍照扫描。你也可以先从系统相册导入。": { en: "Allow camera access to scan with a photo. You can also import from Photos.", ja: "カメラへのアクセスを許可すると撮影してスキャンできます。写真から読み込むこともできます。", ko: "카메라 접근을 허용하면 촬영하여 스캔할 수 있습니다. 사진에서 가져올 수도 있습니다." },
  "拍照失败，请重试": { en: "Photo capture failed. Please try again.", ja: "撮影に失敗しました。もう一度お試しください。", ko: "사진 촬영에 실패했습니다. 다시 시도해 주세요." },
  "导入失败，请重试": { en: "Import failed. Please try again.", ja: "読み込みに失敗しました。もう一度お試しください。", ko: "가져오기에 실패했습니다. 다시 시도해 주세요." },
  "打开相机拍照并扫描衣物": { en: "Open camera to scan clothes", ja: "カメラを開いて服をスキャン", ko: "카메라를 열어 옷 스캔" },
  "从系统相册批量导入衣物": { en: "Import clothes from Photos", ja: "写真から服をまとめて読み込む", ko: "사진에서 옷 여러 장 가져오기" },
  "补充上装、下装或连衣裙后，再回来生成。": { en: "Add tops, bottoms, or dresses, then create looks.", ja: "トップス、ボトムス、またはワンピースを追加してから、もう一度コーデを作成してください。", ko: "상의, 하의 또는 원피스를 추가한 뒤 다시 코디를 만들어 보세요." },
  "反馈会保存在本机，并用于调整后续排序。": { en: "Your feedback stays on this device and improves future ordering.", ja: "フィードバックはこの端末に保存され、次回以降の並び順の調整に使われます。", ko: "피드백은 이 기기에 저장되며 이후 정렬을 개선하는 데 사용됩니다." },
  "虚拟试穿": { en: "Virtual Try-On", ja: "バーチャル試着", ko: "가상 피팅" },
  "今天穿这套": { en: "Wear Today", ja: "今日はこれを着る", ko: "오늘 이 코디 입기" },
  "保存到本机": { en: "Save to Device", ja: "端末に保存", ko: "기기에 저장" },
  "保存到相册": { en: "Save to Photos", ja: "写真に保存", ko: "사진에 저장" },
  "保存偏好": { en: "Save Preferences", ja: "好みを保存", ko: "취향 저장" },
  "喜欢": { en: "Like", ja: "好き", ko: "좋아요" },
  "不喜欢": { en: "Dislike", ja: "好みではない", ko: "별로예요" },
  "设置天气": { en: "Set Weather", ja: "天気を設定", ko: "날씨 설정" },
  "定位天气": { en: "Local Weather", ja: "現在地の天気", ko: "현재 위치 날씨" },
  "输入城市名称": { en: "Enter a city", ja: "都市名を入力", ko: "도시 이름 입력" },
  "搜索城市，例如杭州": { en: "Search city, e.g. Hangzhou", ja: "都市を検索（例：杭州）", ko: "도시 검색 (예: 항저우)" },
  "获取当前位置天气": { en: "Use Current Location", ja: "現在地を使用", ko: "현재 위치 사용" },
  "湿度": { en: "Humidity", ja: "湿度", ko: "습도" },
  "风速": { en: "Wind", ja: "風速", ko: "풍속" },
  "降水": { en: "Rain", ja: "降水", ko: "강수" },
  "保存失败，请重试": { en: "Could not save. Please try again.", ja: "保存できませんでした。もう一度お試しください。", ko: "저장하지 못했습니다. 다시 시도해 주세요." },
  "加载失败，请重试": { en: "Could not load. Please try again.", ja: "読み込めませんでした。もう一度お試しください。", ko: "불러오지 못했습니다. 다시 시도해 주세요." },
  "请稍后重试": { en: "Please try again later", ja: "しばらくしてから再度お試しください", ko: "잠시 후 다시 시도해 주세요" },
  "确认清空": { en: "Clear Data?", ja: "データを消去しますか？", ko: "데이터를 삭제할까요?" },
  "已清空": { en: "Data cleared", ja: "データを消去しました", ko: "데이터가 삭제되었습니다" },
  "数据与图片默认只保存在当前设备。": { en: "Data and images stay on this device by default.", ja: "データと画像は初期設定ではこの端末内に保存されます。", ko: "데이터와 이미지는 기본적으로 이 기기에만 저장됩니다." },
  "衣物照片、穿搭和反馈默认只保存在当前设备。": { en: "Item photos, looks and feedback stay on this device by default.", ja: "衣類写真、コーデ、フィードバックは初期設定ではこの端末にのみ保存されます。", ko: "의류 사진, 코디 및 피드백은 기본적으로 이 기기에만 저장됩니다." },
  "权限用途": { en: "Permissions", ja: "権限の用途", ko: "권한 사용" },
  "相机与相册用于添加衣物；定位仅在点击后用于获取当前位置天气。": { en: "Camera and photos add items. Location is used only when you request local weather.", ja: "カメラと写真は衣類の追加に使います。位置情報は現在地の天気を取得するときだけ使います。", ko: "카메라와 사진은 의류 추가에 사용합니다. 위치는 현재 날씨를 요청할 때만 사용합니다." },
  "识图与搭配点评": { en: "Image Analysis & Styling", ja: "画像認識とコーデ評価", ko: "이미지 인식 및 코디 평가" },
  "配置后可用于衣物识别和穿搭点评": { en: "Set up AI for clothing recognition and styling feedback", ja: "服の認識とコーデ評価に AI を設定できます", ko: "의류 인식과 코디 평가에 AI를 설정하세요" },
  "开启后才会调用已配置的服务": { en: "Uses your configured service only when enabled", ja: "オンにした場合のみ設定済みサービスを利用します", ko: "켜면 설정한 서비스를 사용합니다" },
  "本地优先": { en: "LOCAL FIRST", ja: "端末内を優先", ko: "기기 우선" },
  "密钥只保存在当前设备；关闭开关后不会请求 AI 服务。": { en: "Your key stays on this device. Turning it off stops AI requests.", ja: "キーはこの端末にのみ保存され、オフにすると AI への通信は行いません。", ko: "키는 이 기기에만 저장되며, 끄면 AI 요청을 보내지 않습니다." },
  "AI 助手已开启": { en: "AI Assistant is on", ja: "AI アシスタントをオンにしました", ko: "AI 도우미를 켰습니다" },
  "已保存，AI 助手未开启": { en: "Saved. AI Assistant is off", ja: "保存しました。AI アシスタントはオフです", ko: "저장했습니다. AI 도우미는 꺼져 있습니다" },
  "请先填写 API Key": { en: "Enter your API key first", ja: "先に API キーを入力してください", ko: "먼저 API 키를 입력해 주세요" },
  "接口地址": { en: "Endpoint", ja: "接続先", ko: "엔드포인트" },
  "文本模型（搭配点评）": { en: "Text Model (Styling)", ja: "テキストモデル（コーデ評価）", ko: "텍스트 모델 (코디 평가)" },
  "识图模型（识别衣物）": { en: "Vision Model (Clothes)", ja: "画像モデル（服の認識）", ko: "비전 모델 (의류 인식)" },
  "测试连接": { en: "Test Connection", ja: "接続テスト", ko: "연결 테스트" },
  "测试中…": { en: "Testing…", ja: "テスト中…", ko: "테스트 중…" },
  "连接成功": { en: "Connected", ja: "接続しました", ko: "연결됨" },
  "连接失败，请检查 Key 与网络": { en: "Connection failed. Check the key and network.", ja: "接続できません。キーと通信環境を確認してください。", ko: "연결에 실패했습니다. 키와 네트워크를 확인하세요." },
  "连接失败": { en: "Connection failed", ja: "接続できません", ko: "연결 실패" },
  "API Key 无效或没有模型权限": { en: "Invalid API key or model access", ja: "APIキーが無効、またはモデル権限がありません", ko: "API 키가 유효하지 않거나 모델 권한이 없습니다" },
  "接口地址或模型不可用": { en: "Endpoint or model unavailable", ja: "接続先またはモデルを利用できません", ko: "엔드포인트 또는 모델을 사용할 수 없습니다" },
  "请求过于频繁或账户额度不足": { en: "Too many requests or insufficient balance", ja: "リクエスト過多、または残高不足です", ko: "요청이 너무 많거나 계정 잔액이 부족합니다" },
  "网络连接失败或请求超时": { en: "Network failed or request timed out", ja: "ネットワーク接続失敗、またはタイムアウトしました", ko: "네트워크 연결 실패 또는 요청 시간 초과" },
  "无法解析接口域名，请检查网络或 DNS": { en: "Can't resolve the endpoint. Check your network or DNS.", ja: "接続先の名前を解決できません。ネットワークまたはDNSを確認してください。", ko: "엔드포인트 이름을 찾을 수 없습니다. 네트워크 또는 DNS를 확인하세요." },
  "安全连接失败，请检查系统时间或网络": { en: "Secure connection failed. Check the system time or network.", ja: "安全な接続に失敗しました。端末の時刻またはネットワークを確認してください。", ko: "보안 연결에 실패했습니다. 시스템 시간 또는 네트워크를 확인하세요." },
  "请求超时，请检查网络或稍后重试": { en: "Request timed out. Check your network or try again later.", ja: "リクエストがタイムアウトしました。通信環境を確認して、しばらくしてから再試行してください。", ko: "요청 시간이 초과되었습니다. 네트워크를 확인하거나 잠시 후 다시 시도하세요." },
  "网络连接失败，请检查网络后重试": { en: "Network connection failed. Check your network and try again.", ja: "ネットワーク接続に失敗しました。通信環境を確認して再試行してください。", ko: "네트워크 연결에 실패했습니다. 네트워크를 확인한 후 다시 시도하세요." },
  "使用教程": { en: "Quick Tour", ja: "使い方ガイド", ko: "사용 가이드" },
  "下一步": { en: "Next", ja: "次へ", ko: "다음" },
  "关闭": { en: "Close", ja: "閉じる", ko: "닫기" },
  "咖啡": { en: "Coffee", ja: "カフェ", ko: "카페" },
  "节日": { en: "Festival", ja: "イベント", ko: "행사" },
  "婚礼": { en: "Wedding", ja: "結婚式", ko: "결혼식" },
  "典礼": { en: "Ceremony", ja: "式典", ko: "행사" },
  "演出": { en: "Show", ja: "公演", ko: "공연" },
  "材质与标签": { en: "Material & Tags", ja: "素材とタグ", ko: "소재 및 태그" },
  "请填写内容": { en: "Please enter a message", ja: "内容を入力してください", ko: "내용을 입력해 주세요" },
  "已保存到本机": { en: "Saved to this device", ja: "この端末に保存しました", ko: "이 기기에 저장되었습니다" },
  "将删除 {items} 件衣物和 {outfits} 套穿搭。": { en: "Delete {items} items and {outfits} looks?", ja: "{items}点の服と{outfits}件のコーデを削除しますか？", ko: "의류 {items}개와 코디 {outfits}개를 삭제할까요?" },
  "LOCAL FIRST": { en: "LOCAL FIRST", ja: "端末内を優先", ko: "기기 우선" },
  "当前设备": { en: "This Device", ja: "この端末", ko: "현재 기기" },
  "件单品": { en: "items", ja: "点のアイテム", ko: "개 아이템" },
  "张图片": { en: "photos", ja: "枚の写真", ko: "장의 사진" },
  "套已保存穿搭": { en: "saved looks", ja: "件の保存済みコーデ", ko: "개의 저장된 코디" },
  "达到 180 件时会提醒整理；200 件为体验建议值。": { en: "We'll suggest a tidy-up at 180 items; 200 is the recommended limit.", ja: "180点で整理をお知らせします。200点が推奨上限です。", ko: "180개가 되면 정리를 알려드리며, 200개가 권장 기준입니다." },
  "完整设备备份": { en: "Full Device Backup", ja: "端末を完全バックアップ", ko: "기기 전체 백업" },
  "JSON 元数据 + 原图 + 缩略图 ZIP": { en: "JSON metadata + originals + thumbnails ZIP", ja: "JSONメタデータ + 元画像 + サムネイル ZIP", ko: "JSON 메타데이터 + 원본 + 썸네일 ZIP" },
  "Android 可用": { en: "Android Ready", ja: "Androidで利用可", ko: "Android에서 사용 가능" },
  "正式 APK 可用": { en: "Release APK Only", ja: "正式APKで利用可", ko: "정식 APK에서 사용 가능" },
  "导出完整备份": { en: "Export Full Backup", ja: "完全バックアップを書き出す", ko: "전체 백업 내보내기" },
  "从 ZIP 恢复": { en: "Restore from ZIP", ja: "ZIPから復元", ko: "ZIP에서 복원" },
  "恢复前先预检": { en: "Preview Before Restore", ja: "復元前に確認", ko: "복원 전 미리 확인" },
  "导入时会展示新增数量和同 ID 冲突；你可以保留本机记录，也可以明确选择由备份覆盖，不会静默替换。": { en: "Before importing, review new items and matching-ID conflicts. Keep local records or explicitly replace them—nothing changes silently.", ja: "読み込み前に新規件数と同一IDの競合を確認できます。端末の記録を残すか、バックアップで上書きするかを明示的に選べます。", ko: "가져오기 전에 새 항목과 같은 ID 충돌을 확인할 수 있습니다. 기기 기록을 유지하거나 백업으로 덮어쓸지 직접 선택하며, 자동으로 바뀌지 않습니다." },
  "复制跨端元数据": { en: "Copy Cross-Device Data", ja: "他端末用データをコピー", ko: "기기간 데이터 복사" },
  "不含图片，适合微信小程序或临时迁移": { en: "No photos; useful for WeChat Mini Programs or a quick transfer", ja: "写真を含まず、WeChatミニプログラムや一時移行に便利です", ko: "사진 없이 WeChat 미니 프로그램 또는 임시 이전에 적합합니다" },
  "从剪贴板导入": { en: "Import from Clipboard", ja: "クリップボードから読み込む", ko: "클립보드에서 가져오기" },
  "读取版本化 JSON 并预览冲突": { en: "Read versioned JSON and preview conflicts", ja: "バージョン付きJSONを読み込み、競合を確認", ko: "버전 JSON을 읽고 충돌 미리 보기" },
  "复制本地诊断日志": { en: "Copy Local Diagnostics", ja: "端末内の診断ログをコピー", ko: "로컬 진단 로그 복사" },
  "不包含衣物照片": { en: "No item photos included", ja: "衣類写真は含まれません", ko: "의류 사진은 포함되지 않습니다" },
  "完整备份文件保存在 Android 公共文档目录的“明天穿什么备份”文件夹，可通过系统分享发送到另一台设备。微信端继续使用不含图片的元数据备份。": { en: "Full backups are saved in Android's public Documents folder under “What to Wear Backup”. Share them with another device through the system. Use the photo-free metadata backup for WeChat.", ja: "完全バックアップはAndroidの共有ドキュメント内「明日のコーデバックアップ」フォルダに保存されます。システム共有で別の端末へ送れます。WeChatでは写真なしのメタデータバックアップをご利用ください。", ko: "전체 백업은 Android 공용 문서의 ‘내일 뭐 입지 백업’ 폴더에 저장됩니다. 시스템 공유로 다른 기기에 보낼 수 있습니다. WeChat에서는 사진 없는 메타데이터 백업을 사용하세요." },
  "收起危险操作": { en: "Hide Dangerous Actions", ja: "危険な操作を閉じる", ko: "위험한 작업 접기" },
  "展开危险操作": { en: "Show Dangerous Actions", ja: "危険な操作を表示", ko: "위험한 작업 펼치기" },
  "清空后无法撤销，建议先导出完整备份。": { en: "Clearing cannot be undone. Export a full backup first.", ja: "消去は元に戻せません。先に完全バックアップを書き出してください。", ko: "삭제한 내용은 되돌릴 수 없습니다. 먼저 전체 백업을 내보내세요." },
  "衣橱结构完整": { en: "Your Closet Is Ready", ja: "クローゼットの準備ができました", ko: "옷장이 준비되었습니다" },
  "已经可以生成多套穿搭": { en: "You can now create multiple looks", ja: "複数のコーデを作成できます", ko: "이제 여러 코디를 만들 수 있습니다" },
  "发现适合你的穿搭好物": { en: "Discover style finds made for you", ja: "あなたに合うファッションアイテムを見つける", ko: "나에게 맞는 패션 아이템 찾기" },
  "敬请期待": { en: "Coming Soon", ja: "近日公開", ko: "곧 공개" },
  "我们正在完善基于衣橱和个人风格的好物推荐，未来会在这里为你呈现。": { en: "We're refining personalized finds based on your closet and style. They'll appear here in a future update.", ja: "クローゼットと好みに基づくおすすめアイテムを準備中です。今後ここに表示されます。", ko: "옷장과 취향을 바탕으로 한 맞춤 아이템 추천을 준비 중입니다. 향후 이곳에 표시됩니다." },
  "完整图片 ZIP 备份与恢复正在适配当前 Android 预览版，后续版本开放。": { en: "Full ZIP backup and restore are being adapted for this Android preview and will be available in a future version.", ja: "完全なZIPバックアップと復元は、このAndroidプレビュー向けに対応中です。今後のバージョンで利用できます。", ko: "전체 ZIP 백업 및 복원은 현재 Android 미리보기용으로 작업 중이며 이후 버전에서 제공됩니다." },
  "已喜欢": { en: "Liked", ja: "いいね済み", ko: "좋아요 함" },
  "已不喜欢": { en: "Disliked", ja: "好みではない", ko: "싫어요 함" },
  "已记住你喜欢这套，后续推荐会更接近它。": { en: "We'll remember you liked this and tune future picks closer to it.", ja: "このコーデが好みであることを記録しました。次回以降の提案に反映します。", ko: "이 코디를 좋아한 것으로 기록했어요. 이후 추천에 반영합니다." },
  "已记录不喜欢的原因，可再次点击撤销。": { en: "Your dislike is recorded. Tap again to undo.", ja: "好みではない理由を記録しました。もう一度タップすると取り消せます。", ko: "싫어요 이유를 기록했어요. 다시 누르면 취소됩니다." },
  "这套已保存，可在“我的穿搭”中找到。": { en: "This look is saved in My Looks.", ja: "このコーデはマイコーデに保存されています。", ko: "이 코디는 내 코디에 저장되어 있어요." },
  "去添加": { en: "Add Items", ja: "追加する", ko: "추가하기" },
  "还没有标签，添加后可在衣橱搜索中使用。": { en: "No tags yet. Add them to make closet search easier.", ja: "タグはまだありません。追加するとクローゼット検索で使えます。", ko: "아직 태그가 없습니다. 추가하면 옷장 검색에 사용할 수 있습니다." },
  "输入标签，可用逗号分隔": { en: "Enter tags, separated by commas", ja: "タグを入力（カンマ区切り）", ko: "태그 입력 (쉼표로 구분)" },
  "正在打开媒体选择器": { en: "Opening media picker", ja: "メディア選択画面を開いています", ko: "미디어 선택기를 여는 중" },
  "请在下一步确认品类和颜色": { en: "Confirm category and color in the next step", ja: "次の画面でカテゴリと色を確認してください", ko: "다음 단계에서 카테고리와 색상을 확인하세요" },
  "正在本地处理图片": { en: "Processing image on this device", ja: "端末内で画像を処理しています", ko: "기기에서 이미지를 처리하는 중" },
  "快速生成三套搭配": { en: "Create three looks quickly", ja: "3つのコーデをすばやく作成", ko: "세 가지 코디를 빠르게 만들기" },
  "记录反馈": { en: "Save Feedback", ja: "フィードバックを記録", ko: "피드백 기록" },
  "保存、已穿与喜好": { en: "Save, worn status and preferences", ja: "保存・着用・好みを記録", ko: "저장, 착용 및 선호 기록" },
  "还没有天气": { en: "No Weather Yet", ja: "天気情報がありません", ko: "날씨 정보가 없습니다" },
  "使用定位或搜索城市。": { en: "Use your location or search for a city.", ja: "現在地を使うか、都市を検索してください。", ko: "현재 위치를 사용하거나 도시를 검색하세요." },
  "当前位置": { en: "Current Location", ja: "現在地", ko: "현재 위치" },
  "示例天气": { en: "Sample Weather", ja: "サンプル天気", ko: "예시 날씨" },
  "今日穿衣": { en: "What to Wear Today", ja: "今日の服装", ko: "오늘의 옷차림" },
  "实用舒适": { en: "Practical & Comfy", ja: "実用的で快適", ko: "실용적이고 편안함" },
  "喜庆得体": { en: "Festive & Polished", ja: "華やかで上品", ko: "경사스럽고 단정함" },
  "精致闪耀": { en: "Polished & Bright", ja: "華やかで洗練", ko: "세련되고 화려함" },
  "庄重优雅": { en: "Elegant & Poised", ja: "上品で優雅", ko: "격식 있고 우아함" },
  "醒目有个性": { en: "Bold & Expressive", ja: "印象的で個性的", ko: "돋보이고 개성 있음" },
  "舒适随性不费力": { en: "Easy, Effortless Comfort", ja: "気負わない快適さ", ko: "편안하고 자연스러움" },
  "正式得体有气场": { en: "Polished & Confident", ja: "きちんと自信のある印象", ko: "단정하고 자신감 있는 분위기" },
  "少即是多的美学": { en: "The Beauty of Less", ja: "少ないほど美しい", ko: "적을수록 아름다운 미학" },
  "优雅知性的气质": { en: "Graceful, Refined Style", ja: "上品で知的な雰囲気", ko: "우아하고 지적인 분위기" },
  "甜美可爱的少女感": { en: "Sweet, Playful Charm", ja: "甘く愛らしい雰囲気", ko: "달콤하고 사랑스러운 분위기" },
  "活力四射的运动风": { en: "Energetic Sport Style", ja: "元気なスポーツスタイル", ko: "활기찬 스포츠 스타일" },
  "轻松惬意的度假风": { en: "Relaxed Resort Mood", ja: "心地よいリゾート感", ko: "편안한 리조트 무드" },
  "潮酷有型的街头范": { en: "Cool Street Energy", ja: "クールなストリート感", ko: "쿨한 스트리트 감성" },
  "复古摩登的怀旧感": { en: "Modern Retro Charm", ja: "モダンレトロなムード", ko: "모던한 레트로 무드" },
  "轻盈浪漫的仙气": { en: "Light, Romantic Air", ja: "軽やかでロマンティック", ko: "가볍고 로맨틱한 분위기" },
  "干练专业的职场感": { en: "Sharp Professional Style", ja: "洗練された仕事スタイル", ko: "깔끔한 프로페셔널 스타일" },
  "确认衣物信息": { en: "Confirm Item Details", ja: "アイテム情報を確認", ko: "의류 정보 확인" },
  "生成新穿搭": { en: "Create a New Look", ja: "新しいコーデを作成", ko: "새 코디 만들기" },
  "穿搭推荐": { en: "Outfit Picks", ja: "おすすめコーデ", ko: "추천 코디" },
  "天气穿搭": { en: "Weather Looks", ja: "天気コーデ", ko: "날씨 코디" },
  "偏好风格": { en: "Style Preferences", ja: "好みのスタイル", ko: "스타일 선호" },
  "很适合": { en: "Great Match", ja: "とてもおすすめ", ko: "아주 잘 어울려요" },
  "值得尝试": { en: "Worth Trying", ja: "試す価値あり", ko: "시도해 볼 만해요" },
  "可尝试": { en: "Try It", ja: "試してみる", ko: "입어 보기" },
  "单品已缺失": { en: "Item unavailable", ja: "アイテムがありません", ko: "아이템을 찾을 수 없음" },
  "邻近色": { en: "Analogous", ja: "類似色", ko: "유사색" },
  "对比色": { en: "Complementary", ja: "補色", ko: "보색" },
  "中性色": { en: "Neutral", ja: "ニュートラル", ko: "뉴트럴" },
  "协调": { en: "Balanced", ja: "調和", ko: "조화" },
  "泡泡袖": { en: "Puff Sleeve", ja: "パフスリーブ", ko: "퍼프소매" },
  "碎花": { en: "Floral", ja: "花柄", ko: "플로럴" },
  "模拟数据": { en: "Sample Data", ja: "サンプルデータ", ko: "샘플 데이터" },
  "女士流行款": { en: "Women's Trend", ja: "レディース人気", ko: "여성 인기 스타일" },
  "派对": { en: "Party", ja: "パーティー", ko: "파티" },
  "专业得体": { en: "Professional & Polished", ja: "プロらしく端正", ko: "전문적이고 단정함" },
  "舒适利落": { en: "Comfortable & Sharp", ja: "快適ですっきり", ko: "편안하고 깔끔함" },
  "温柔精致": { en: "Soft & Refined", ja: "やわらかく上品", ko: "부드럽고 세련됨" },
  "亮眼出彩": { en: "Bright & Eye-Catching", ja: "華やかで印象的", ko: "화사하고 돋보임" },
  "透气有活力": { en: "Breathable & Energetic", ja: "通気性がよく元気", ko: "통기성 좋고 활기참" },
  "轻松明快": { en: "Light & Cheerful", ja: "軽やかで明るい", ko: "가볍고 산뜻함" },
  "时尚舒适": { en: "Stylish & Comfortable", ja: "おしゃれで快適", ko: "스타일리시하고 편안함" },
  "简约随性": { en: "Minimal & Easy", ja: "シンプルで気軽", ko: "미니멀하고 편안함" },
  "干练自信": { en: "Sharp & Confident", ja: "洗練され自信ある印象", ko: "깔끔하고 자신감 있음" },
  "轻快实用": { en: "Light & Practical", ja: "軽快で実用的", ko: "가볍고 실용적" },
  "时尚百搭": { en: "Stylish & Versatile", ja: "おしゃれで着回しやすい", ko: "스타일리시하고 활용도 높음" },
  "专业亲和": { en: "Professional & Approachable", ja: "プロらしく親しみやすい", ko: "전문적이고 친근함" },
  "文艺松弛": { en: "Artful & Relaxed", ja: "アート感のあるリラックス", ko: "감성적이고 여유로움" },
  "示例": { en: "Sample", ja: "サンプル", ko: "예시" },
  "晴朗": { en: "Clear", ja: "晴れ", ko: "맑음" },
  "体感": { en: "Feels like", ja: "体感", ko: "체감" },
  "定位超时，请重试": { en: "Location timed out. Please retry.", ja: "位置情報がタイムアウトしました。再試行してください。", ko: "위치 확인 시간이 초과되었습니다. 다시 시도해 주세요." },
  "定位权限未开启": { en: "Location permission is off", ja: "位置情報の権限がオフです", ko: "위치 권한이 꺼져 있습니다" },
  "系统定位服务未开启": { en: "Location services are off", ja: "位置情報サービスがオフです", ko: "위치 서비스가 꺼져 있습니다" },
  "无法获取当前位置": { en: "Couldn't get your location", ja: "現在地を取得できません", ko: "현재 위치를 가져올 수 없습니다" },
  "可前往系统设置重新开启": { en: "Enable it again in system settings", ja: "システム設定で再度オンにできます", ko: "시스템 설정에서 다시 켤 수 있습니다" },
  "请先打开手机定位服务": { en: "Turn on location services first", ja: "先に位置情報サービスをオンにしてください", ko: "먼저 위치 서비스를 켜 주세요" },
  "也可以搜索城市": { en: "Or search for a city", ja: "都市を検索することもできます", ko: "도시를 검색할 수도 있습니다" },
  "天气已过期，请刷新": { en: "Weather is out of date. Refresh it.", ja: "天気情報の期限が切れました。更新してください。", ko: "날씨 정보가 오래되었습니다. 새로고침하세요." },
  "刚刚更新": { en: "Updated just now", ja: "たった今更新", ko: "방금 업데이트됨" },
  "正在读取条件并检查搭配…": { en: "Reading your choices and checking looks…", ja: "条件を読み込み、コーデを確認しています…", ko: "조건을 읽고 코디를 확인하는 중…" },
  "先比较，再决定": { en: "Compare, Then Decide", ja: "比べてから決める", ko: "비교한 뒤 결정하세요" },
  "点选方案，查看单品与推荐理由": { en: "Tap a look to see its items and why it works", ja: "コーデをタップしてアイテムとおすすめ理由を見る", ko: "코디를 탭해 아이템과 추천 이유를 확인하세요" },
  "评分结合天气、场景、色彩与衣橱轮换": { en: "Scores combine weather, occasion, color and closet rotation", ja: "スコアは天気・シーン・色・クローゼットの着回しを組み合わせます", ko: "점수는 날씨, 상황, 색상, 옷장 순환을 반영합니다" },
  "左右点选上方方案进行比较": { en: "Tap a look above to compare", ja: "上のコーデをタップして比較", ko: "위의 코디를 탭해 비교하세요" },
  "评分综合天气、场景、色彩与衣橱轮换": { en: "Scores consider weather, occasion, color and closet rotation", ja: "スコアは天気・シーン・色・クローゼットの着回しを総合します", ko: "점수는 날씨, 상황, 색상, 옷장 순환을 종합합니다" },
  "当前查看": { en: "Viewing", ja: "表示中", ko: "보고 있음" },
  "AI 精排中…": { en: "AI is refining…", ja: "AIが調整中…", ko: "AI가 다듬는 중…" },
  "AI 已结合天气、场景帮你精排": { en: "AI refined these using weather and occasion", ja: "AIが天気とシーンをもとに調整しました", ko: "AI가 날씨와 상황을 반영해 다듬었습니다" },
  "换一批推荐": { en: "Show More Looks", ja: "別のコーデを見る", ko: "다른 코디 보기" },
  "修改条件": { en: "Edit Choices", ja: "条件を変更", ko: "조건 수정" },
  "更接近此风格": { en: "More like this", ja: "この雰囲気に近づける", ko: "이 스타일에 더 가깝게" },
  "减少类似推荐": { en: "Fewer looks like this", ja: "似た提案を減らす", ko: "비슷한 추천 줄이기" },
  "留在我的穿搭": { en: "Keep in My Looks", ja: "マイコーデに保存", ko: "내 코디에 보관" },
  "发给朋友": { en: "Send to a friend", ja: "友だちに送る", ko: "친구에게 보내기" },
  "点选需要操作的单品": { en: "Select items to manage", ja: "操作するアイテムを選択", ko: "관리할 아이템을 선택하세요" },
  "全选结果": { en: "Select All", ja: "すべて選択", ko: "전체 선택" },
  "取消全选": { en: "Clear All", ja: "すべて解除", ko: "전체 선택 해제" },
  "清除选择": { en: "Clear Selection", ja: "選択を解除", ko: "선택 지우기" },
  "取消收藏": { en: "Remove Favorite", ja: "お気に入りを解除", ko: "즐겨찾기 해제" },
  "清除全部条件": { en: "Clear All Filters", ja: "すべての条件を解除", ko: "모든 필터 지우기" },
  "已开启：只看收藏": { en: "On: Favorites Only", ja: "オン：お気に入りのみ", ko: "켜짐: 즐겨찾기만" },
  "5 秒内可以撤销": { en: "Undo within 5 seconds", ja: "5秒以内なら元に戻せます", ko: "5초 안에 실행 취소할 수 있습니다" },
  "未使用天气": { en: "Weather not used", ja: "天気は未使用", ko: "날씨 미사용" },
  "方案 {index}": { en: "Look {index}", ja: "コーデ {index}", ko: "코디 {index}" },
  "{context} · 共 {count} 套": { en: "{context} · {count} looks", ja: "{context} · 全{count}コーデ", ko: "{context} · 총 {count}개 코디" },
  "已选 {count} 件": { en: "{count} selected", ja: "{count}点を選択", ko: "{count}개 선택됨" },
  "{total} 件": { en: "{total} items", ja: "{total}点", ko: "{total}개" },
  "{total} 件 · 已选 {selected} 件": { en: "{total} items · {selected} selected", ja: "{total}点・{selected}点を選択", ko: "{total}개 · {selected}개 선택됨" },
  "体感 {temperature}°": { en: "Feels like {temperature}°", ja: "体感 {temperature}°", ko: "체감 {temperature}°" },
  "ADD GARMENTS": { en: "ADD GARMENTS", ja: "服を追加", ko: "의류 추가" },
  "CREATE A LOOK": { en: "CREATE A LOOK", ja: "コーデを作成", ko: "코디 만들기" },
  "YOUR PREFERENCES": { en: "YOUR PREFERENCES", ja: "あなたの好み", ko: "나의 취향" },
  "YOUR EDIT": { en: "YOUR EDIT", ja: "あなたのコーデ", ko: "나의 코디" },
};

const TOKEN_DICTIONARY: Record<string, Translation> = {
  "衣物": { en: "item", ja: "服", ko: "의류" },
  "穿搭": { en: "outfit", ja: "コーデ", ko: "코디" },
  "衣橱": { en: "closet", ja: "クローゼット", ko: "옷장" },
  "单品": { en: "item", ja: "アイテム", ko: "아이템" },
  "图片": { en: "image", ja: "画像", ko: "이미지" },
  "记录": { en: "record", ja: "履歴", ko: "기록" },
  "天气": { en: "weather", ja: "天気", ko: "날씨" },
  "颜色": { en: "color", ja: "色", ko: "색상" },
  "风格": { en: "style", ja: "スタイル", ko: "스타일" },
  "场景": { en: "occasion", ja: "シーン", ko: "상황" },
  "设置": { en: "settings", ja: "設定", ko: "설정" },
  "保存": { en: "save", ja: "保存", ko: "저장" },
  "删除": { en: "delete", ja: "削除", ko: "삭제" },
  "添加": { en: "add", ja: "追加", ko: "추가" },
  "搜索": { en: "search", ja: "検索", ko: "검색" },
  "当前": { en: "current", ja: "現在", ko: "현재" },
  "已选": { en: "selected", ja: "選択済み", ko: "선택됨" },
  "已保存": { en: "saved", ja: "保存済み", ko: "저장됨" },
  "失败": { en: "failed", ja: "失敗", ko: "실패" },
  "成功": { en: "successful", ja: "成功", ko: "성공" },
  "正在": { en: "In progress: ", ja: "処理中：", ko: "진행 중: " },
  "全部": { en: "all", ja: "すべて", ko: "전체" },
};

const STORAGE_KEY = "ootd_language_v1";

function readLanguage(): AppLanguage {
  try {
    const value = uni.getStorageSync(STORAGE_KEY) as AppLanguage;
    return LANGUAGE_OPTIONS.some((item) => item.id === value) ? value : "zh-CN";
  } catch {
    return "zh-CN";
  }
}

export const appLanguage = ref<AppLanguage>(readLanguage());

function translateDynamic(source: string, language: Exclude<AppLanguage, "zh-CN">): string {
  const planMatch = source.match(/^方案\s*(\d+)$/);
  if (planMatch) {
    if (language === "en") return `Look ${planMatch[1]}`;
    if (language === "ja") return `コーデ ${planMatch[1]}`;
    return `코디 ${planMatch[1]}`;
  }
  const selectionMatch = source.match(/^已选\s*(\d+)\s*件$/);
  if (selectionMatch) {
    if (language === "en") return `${selectionMatch[1]} selected`;
    if (language === "ja") return `${selectionMatch[1]}点を選択`;
    return `${selectionMatch[1]}개 선택됨`;
  }
  const resultCountMatch = source.match(/^(\d+)\s*件\s*·\s*已选\s*(\d+)\s*件$/);
  if (resultCountMatch) {
    if (language === "en") return `${resultCountMatch[1]} items · ${resultCountMatch[2]} selected`;
    if (language === "ja") return `${resultCountMatch[1]}点・${resultCountMatch[2]}点を選択`;
    return `${resultCountMatch[1]}개 · ${resultCountMatch[2]}개 선택됨`;
  }
  const filteredMatch = source.match(/^筛选与排序\s*·\s*(\d+)$/);
  if (filteredMatch) {
    if (language === "en") return `Filter & Sort · ${filteredMatch[1]}`;
    if (language === "ja") return `絞り込み・並べ替え · ${filteredMatch[1]}`;
    return `필터 및 정렬 · ${filteredMatch[1]}`;
  }
  const totalLooksMatch = source.match(/^共\s*(\d+)\s*套$/);
  if (totalLooksMatch) {
    if (language === "en") return `${totalLooksMatch[1]} looks`;
    if (language === "ja") return `${totalLooksMatch[1]}コーデ`;
    return `${totalLooksMatch[1]}개 코디`;
  }
  const feelsLikeMatch = source.match(/^体感\s*(\d+)°$/);
  if (feelsLikeMatch) {
    if (language === "en") return `Feels like ${feelsLikeMatch[1]}°`;
    if (language === "ja") return `体感 ${feelsLikeMatch[1]}°`;
    return `체감 ${feelsLikeMatch[1]}°`;
  }
  const minutesAgoMatch = source.match(/^(\d+)分钟前$/);
  if (minutesAgoMatch) {
    if (language === "en") return `${minutesAgoMatch[1]} min ago`;
    if (language === "ja") return `${minutesAgoMatch[1]}分前`;
    return `${minutesAgoMatch[1]}분 전`;
  }
  const hoursAgoMatch = source.match(/^(\d+)小时前$/);
  if (hoursAgoMatch) {
    if (language === "en") return `${hoursAgoMatch[1]} hr ago`;
    if (language === "ja") return `${hoursAgoMatch[1]}時間前`;
    return `${hoursAgoMatch[1]}시간 전`;
  }
  const weatherAdviceMatch = source.match(/^(羽绒服与保暖内搭|长袖加外套|薄针织或轻盈裙装|短袖与透气材质)(?:，(记得带伞))?(?:，(注意防风))?。$/);
  if (weatherAdviceMatch) {
    const base = {
      en: { "羽绒服与保暖内搭": "A down jacket with warm layers", "长袖加外套": "Long sleeves with a light outer layer", "薄针织或轻盈裙装": "Light knitwear or an airy dress", "短袖与透气材质": "Short sleeves in breathable fabrics" },
      ja: { "羽绒服与保暖内搭": "ダウンと暖かなインナー", "长袖加外套": "長袖に軽いアウター", "薄针织或轻盈裙装": "薄手ニットや軽やかなワンピース", "短袖与透气材质": "半袖と通気性のよい素材" },
      ko: { "羽绒服与保暖内搭": "패딩과 따뜻한 이너", "长袖加外套": "긴소매에 가벼운 아우터", "薄针织或轻盈裙装": "얇은 니트나 가벼운 원피스", "短袖与透气材质": "반소매와 통기성 좋은 소재" },
    };
    const extras = language === "en" ? [weatherAdviceMatch[2] ? "Bring an umbrella" : "", weatherAdviceMatch[3] ? "Stay windproof" : ""] : language === "ja" ? [weatherAdviceMatch[2] ? "傘をお忘れなく" : "", weatherAdviceMatch[3] ? "風よけも意識して" : ""] : [weatherAdviceMatch[2] ? "우산을 챙기세요" : "", weatherAdviceMatch[3] ? "바람도 대비하세요" : ""];
    return [base[language][weatherAdviceMatch[1] as keyof typeof base.en], ...extras.filter(Boolean)].join(language === "en" ? ". " : "、") + (language === "en" ? "." : "。");
  }
  const remainingPhotosMatch = source.match(/^还可选择\s*(\d+)\s*张$/);
  if (remainingPhotosMatch) {
    if (language === "en") return `Up to ${remainingPhotosMatch[1]} photos`;
    if (language === "ja") return `あと${remainingPhotosMatch[1]}枚`;
    return `최대 ${remainingPhotosMatch[1]}장`;
  }
  const eventCountMatch = source.match(/^当前\s*(\d+)\s*条，不包含衣物照片$/);
  if (eventCountMatch) {
    if (language === "en") return `${eventCountMatch[1]} entries · no item photos`;
    if (language === "ja") return `現在${eventCountMatch[1]}件・衣類写真は含まれません`;
    return `현재 ${eventCountMatch[1]}건 · 의류 사진 제외`;
  }
  const segmentMatch = source.match(/^(最近|保存|已穿)\s*(\d+)$/);
  if (segmentMatch) {
    const labels = {
      en: { "最近": "Recent", "保存": "Saved", "已穿": "Worn" },
      ja: { "最近": "最近", "保存": "保存", "已穿": "着用" },
      ko: { "最近": "최근", "保存": "저장", "已穿": "착용" },
    };
    return `${labels[language][segmentMatch[1] as "最近" | "保存" | "已穿"]} ${segmentMatch[2]}`;
  }
  const reasonParts = source.split("；");
  if (reasonParts.length > 1) {
    const translated = reasonParts.map((part) => {
      const weatherMatch = part.match(/^(\d+)°C (偏热，轻薄透气最舒服|温暖，轻搭外套刚刚好|偏凉，加件外套应对温差|寒冷，厚外套锁住温度)$/);
      if (weatherMatch) {
        const values = {
          en: ["warm — light, breathable pieces feel best", "warm — a light layer is just right", "cool — add a layer for changing temperatures", "cold — a heavier coat keeps you warm"],
          ja: ["暑め。軽くて通気性のよい服がおすすめ", "暖かめ。軽い羽織りがちょうどよい", "少し涼しいため、羽織りで温度差に対応", "寒いため、厚手のアウターで暖かく"],
          ko: ["따뜻해 가볍고 통기성 좋은 옷이 좋아요", "따뜻해 가벼운 아우터가 알맞아요", "선선하니 아우터로 일교차에 대비하세요", "추우니 두꺼운 아우터로 보온하세요"],
        };
        const index = ["偏热，轻薄透气最舒服", "温暖，轻搭外套刚刚好", "偏凉，加件外套应对温差", "寒冷，厚外套锁住温度"].indexOf(weatherMatch[2]);
        return language === "en" ? `${weatherMatch[1]}°C, ${values.en[index]}` : `${weatherMatch[1]}°C、${values[language][index]}`;
      }
      const harmonyMatch = part.match(/^(.+)配色，适合(.+)$/);
      if (harmonyMatch) {
        const harmony = translate(harmonyMatch[1], language);
        const scene = translate(harmonyMatch[2], language);
        if (language === "en") return `${harmony} colors suit ${scene.toLowerCase()}`;
        if (language === "ja") return `${harmony}配色で${scene}にぴったり`;
        return `${harmony} 배색으로 ${scene}에 잘 어울려요`;
      }
      const colorMatch = part.match(/^(.+)与(.+)的组合耐看$/);
      if (colorMatch) {
        const first = translate(colorMatch[1], language);
        const second = translate(colorMatch[2], language);
        if (language === "en") return `${first} and ${second} make a timeless pairing`;
        if (language === "ja") return `${first}と${second}の組み合わせは上品です`;
        return `${first}와 ${second}의 조합이 오래 봐도 좋아요`;
      }
      return translate(part, language);
    });
    return language === "en" ? translated.join(". ") : `${translated.join("。")}。`;
  }
  const reviewMatch = source.match(/^校对\s*(\d+)\s*件衣物$/);
  if (reviewMatch) {
    if (language === "en") return `Review ${reviewMatch[1]} items`;
    if (language === "ja") return `${reviewMatch[1]}点を確認`;
    return `${reviewMatch[1]}개 확인`;
  }
  const batchMatch = source.match(/^本批\s*(\d+)\/(\d+)$/);
  if (batchMatch) {
    if (language === "en") return `Batch ${batchMatch[1]}/${batchMatch[2]}`;
    if (language === "ja") return `今回 ${batchMatch[1]}/${batchMatch[2]}`;
    return `이번 ${batchMatch[1]}/${batchMatch[2]}`;
  }
  const progressMatch = source.match(/^(\d+)\s*件完成(?:\s*·\s*(\d+)\s*件失败)?$/);
  if (progressMatch) {
    if (language === "en") return `${progressMatch[1]} complete${progressMatch[2] ? ` · ${progressMatch[2]} failed` : ""}`;
    if (language === "ja") return `${progressMatch[1]}点完了${progressMatch[2] ? ` · ${progressMatch[2]}点失敗` : ""}`;
    return `${progressMatch[1]}개 완료${progressMatch[2] ? ` · ${progressMatch[2]}개 실패` : ""}`;
  }
  const outfitNameMatch = source.match(/^(.+)穿搭\s*(\d+)$/);
  if (outfitNameMatch) {
    const style = DICTIONARY[outfitNameMatch[1]]?.[language] || outfitNameMatch[1];
    if (language === "en") return `${style} Look ${outfitNameMatch[2]}`;
    if (language === "ja") return `${style}コーデ ${outfitNameMatch[2]}`;
    return `${style} 코디 ${outfitNameMatch[2]}`;
  }
  const countPatterns: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
    [/^(\d+)\s*件$/, (m) => language === "en" ? `${m[1]} items` : language === "ja" ? `${m[1]}点` : `${m[1]}개`],
    [/^(\d+)\s*套$/, (m) => language === "en" ? `${m[1]} looks` : language === "ja" ? `${m[1]}コーデ` : `${m[1]}개 코디`],
    [/^(\d+)\s*张图片$/, (m) => language === "en" ? `${m[1]} images` : language === "ja" ? `画像${m[1]}枚` : `이미지 ${m[1]}장`],
    [/^(\d+)\s*分$/, (m) => language === "en" ? `${m[1]} pts` : language === "ja" ? `${m[1]}点` : `${m[1]}점`],
  ];
  for (const [pattern, render] of countPatterns) {
    const match = source.match(pattern);
    if (match) return render(match);
  }
  let result = source;
  // Dynamic labels such as "短袖上衣 · 多色" are rendered as one text node.
  // Reuse the same approved UI vocabulary for its individual parts, while
  // explicit data fields (for example garment names) opt out with data-no-i18n.
  const dynamicTerms: Record<string, Translation> = { ...TOKEN_DICTIONARY, ...DICTIONARY };
  Object.keys(dynamicTerms).sort((a, b) => b.length - a.length).forEach((token) => {
    if (result.includes(token)) result = result.split(token).join(dynamicTerms[token][language]);
  });
  return result;
}

export function translate(source: string, language: AppLanguage = appLanguage.value): string {
  if (!source || language === "zh-CN") return source;
  const leading = source.match(/^\s*/)?.[0] || "";
  const trailing = source.match(/\s*$/)?.[0] || "";
  const core = source.trim();
  if (!core || core === "OOTD") return source;
  const exact = DICTIONARY[core]?.[language];
  return `${leading}${exact || translateDynamic(core, language)}${trailing}`;
}

export function formatMessage(source: string, values: Record<string, string | number>, language: AppLanguage = appLanguage.value): string {
  const template = translate(source, language);
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

const localizedTextSource = new WeakMap<Node, string>();
const localizedTextLast = new WeakMap<Node, string>();
const localizedAttributeSource = new WeakMap<Element, Record<string, string>>();
const localizedAttributeLast = new WeakMap<Element, Record<string, string>>();
let observer: MutationObserver | undefined;

function localizeTextNode(node: Node): void {
  if (node.parentElement?.closest("[data-no-i18n]")) return;
  const current = node.nodeValue || "";
  const previousApplied = localizedTextLast.get(node);
  let source = localizedTextSource.get(node);
  if (!source || (current !== previousApplied && current !== source)) {
    source = current;
    localizedTextSource.set(node, source);
  }
  const next = translate(source);
  localizedTextLast.set(node, next);
  if (current !== next) node.nodeValue = next;
}

function localizeElement(element: Element): void {
  if (element.closest("[data-no-i18n]")) return;
  const attributes = ["placeholder", "aria-label", "title"];
  const sources = localizedAttributeSource.get(element) || {};
  const lasts = localizedAttributeLast.get(element) || {};
  for (const attribute of attributes) {
    const current = element.getAttribute(attribute);
    if (!current) continue;
    if (!sources[attribute] || (current !== lasts[attribute] && current !== sources[attribute])) sources[attribute] = current;
    const next = translate(sources[attribute]);
    lasts[attribute] = next;
    if (current !== next) element.setAttribute(attribute, next);
  }
  localizedAttributeSource.set(element, sources);
  localizedAttributeLast.set(element, lasts);
}

function localizeTree(root: Node): void {
  if (root.nodeType === Node.TEXT_NODE) localizeTextNode(root);
  if (root.nodeType === Node.ELEMENT_NODE) localizeElement(root as Element);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) localizeTextNode(node);
    else localizeElement(node as Element);
    node = walker.nextNode();
  }
}

export function refreshLocalizedDom(): void {
  // #ifdef H5
  if (typeof document === "undefined" || !document.body) return;
  document.documentElement.lang = appLanguage.value;
  document.body.dataset.appLanguage = appLanguage.value;
  localizeTree(document.body);
  // #endif
}

function updateTabBar(language: AppLanguage): void {
  const labels: Record<AppLanguage, string[]> = {
    "zh-CN": ["首页", "衣橱", "穿搭", "我的"],
    en: ["Home", "Closet", "Looks", "Profile"],
    ja: ["ホーム", "クローゼット", "コーデ", "マイページ"],
    ko: ["홈", "옷장", "코디", "마이"],
  };
  labels[language].forEach((text, index) => {
    try {
      const request = uni.setTabBarItem({ index, text });
      // In the H5 WebView this native-only call can return a rejected Promise.
      // The custom tab bar is localized by the DOM observer, so its rejection is expected.
      if (request && typeof (request as Promise<unknown>).catch === "function") void (request as Promise<unknown>).catch(() => undefined);
    } catch { /* H5 custom tab bar is localized through the DOM. */ }
  });
}

export function setAppLanguage(language: AppLanguage): void {
  appLanguage.value = language;
  try { uni.setStorageSync(STORAGE_KEY, language); } catch { /* Keep the in-memory setting. */ }
  try {
    const setLocale = (uni as unknown as { setLocale?: (locale: string) => void }).setLocale;
    setLocale?.(language === "zh-CN" ? "zh-Hans" : language);
  } catch { /* Locale API is optional in older runtimes. */ }
  updateTabBar(language);
  setTimeout(refreshLocalizedDom, 0);
  setTimeout(refreshLocalizedDom, 80);
}

export function installLocalization(): void {
  updateTabBar(appLanguage.value);
  // #ifdef H5
  if (typeof document === "undefined") return;
  const start = () => {
    refreshLocalizedDom();
    if (observer || !document.body) return;
    observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "characterData") localizeTextNode(mutation.target);
        mutation.addedNodes.forEach(localizeTree);
        if (mutation.type === "attributes" && mutation.target instanceof Element) localizeElement(mutation.target);
      });
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["placeholder", "aria-label", "title"] });
  };
  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start, { once: true });
  // #endif
}

export function useI18n() {
  const languageOption = computed(() => LANGUAGE_OPTIONS.find((item) => item.id === appLanguage.value) || LANGUAGE_OPTIONS[0]);
  return { language: appLanguage, languageOption, languages: LANGUAGE_OPTIONS, t: translate, setLanguage: setAppLanguage };
}
