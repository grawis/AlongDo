# AlongDo
AlongDo 是一個結合「任務管理、地點感知、群組協作、路線規劃、天氣提醒」的 Android 行動 App 原型。  
它的核心概念不是只記錄「要做什麼」，而是進一步幫使用者判斷「要去哪裡做、附近有沒有更適合的地點、要不要順路一起完成」。

目前專案已具備可操作的核心流程，適合用來：

- 展示地點導向待辦 App 的概念
- 測試多人群組協作
- 驗證地圖、附近任務、路線規劃與天氣提醒的整合效果

---

## 專案重點
AlongDo 目前的主要特色如下：

- `個人任務 + 團隊任務`
  - 任務可分為個人與群組任務
  - 任務狀態可循環切換：`待處理 -> 進行中 -> 已完成 -> 待處理`
  - 任務可刪除

- `固定地址 + 彈性地點`
  - 固定地址：例如 `國立成功大學資訊工程學系`
  - 彈性地點：例如 `全聯`、`便利商店`
  - 固定地址可搜尋 Google 地點候選並選定
  - 彈性地點會依目前位置解析成附近實際地點

- `群組協作`
  - 可建立群組
  - 可使用邀請碼加入群組
  - 每位成員可設定自己在群組中的暱稱
  - 可展開查看群組成員列表
  - 停用群組後，其他頁面不再顯示該群組任務

- `附近任務`
  - 根據目前位置解析附近任務
  - 在地圖上顯示目前位置與任務點
  - 優先顯示未完成任務

- `路線規劃`
  - 可選取多筆任務做規劃
  - 會顯示任務順序、總距離、預估時間
  - 地圖上會顯示起點與任務編號
  - 可一鍵開啟 Google Maps 導航

- `天氣提醒`
  - 依目前位置取得天氣資訊
  - 顯示地區、時區、溫度、體感、風速、降雨機率
  - 會搭配目前未完成任務提供提醒清單

---

## 目前功能頁面

### 首頁

- 顯示個人任務、團隊任務、群組的摘要統計
- 作為整體專案功能入口

### 我的任務

- 顯示個人任務列表
- 可切換任務狀態
- 可刪除任務

### 團隊任務

- 顯示群組任務列表
- 可切換任務狀態
- 可刪除任務

### 群組

- 建立群組
- 用邀請碼加入群組
- 查看群組成員
- 切換群組啟用 / 停用

### 新增任務

- 可建立個人任務或團隊任務
- 支援固定地址與彈性地點兩種模式
- 固定地址可用 Google Places 搜尋與選點

### 附近任務

- 使用目前位置解析可處理的附近任務
- 顯示任務點與目前位置地圖

### 路線規劃

- 選取任務後自動產生規劃順序
- 顯示地圖、順序、距離與時間
- 可開啟 Google Maps 導航

### 天氣提醒

- 依目前位置查詢即時天氣
- 根據任務種類與天氣狀況提供提醒

---

## 技術組成

### 前端與執行環境

- Expo
- React Native
- Android Studio Emulator

### 地圖與定位

- `expo-location`
- `react-native-maps`
- Google Maps Platform
  - Maps SDK for Android
  - Places API (New)
  - Directions API
  - Geocoding API

### 雲端與資料儲存

- Firebase Firestore
- Firebase Anonymous Auth
- AsyncStorage（保存匿名登入狀態）

### 天氣資料

- Open-Meteo API

---

## 目前資料來源

專案目前以 Firebase Firestore 為主要資料來源，並保留 mock data 作為初始化與 fallback。

主要 collections：

- `personalTasks`
- `groupTasks`
- `groups`
- `groupMembers`

---

## 核心技術做法

### 1. 共用目前位置

目前位置不是由每一頁各自抓取，而是集中在 `App.js` 統一管理。  
這樣 `附近任務 / 路線規劃 / 天氣提醒` 都能共用同一組位置，切頁後也不會消失。

### 2. 彈性地點解析

若任務是像 `全聯`、`便利商店` 這類彈性地點，系統會依目前位置去查附近候選，再轉成實際任務地點。

### 3. 路線規劃

目前採用「先解析任務地點，再以最近鄰近法排序，最後交給 Google Directions API 取得距離、時間與路徑」的方式。

### 4. 天氣提醒

根據目前位置查詢 Open-Meteo 資料，並依未完成任務類型產生提醒，例如：

- 下雨時提醒雨具
- 高溫時提醒補水
- 有固定地址任務時提醒先確認交通
- 有彈性地點任務時提醒可順路完成

---

## 專案結構

```text
AlongDo/
├─ App.js
├─ app.json
├─ app.config.js
├─ components/
├─ data/
├─ screens/
├─ services/
├─ README.md
├─ PROJECT_SPEC.md
├─ CURRENT_STATUS.md
```

---

## 本機執行

### 1. 安裝套件

```bash
npm install
```

### 2. 建立 `.env`

請在專案根目錄建立 `.env`，至少填入：

```env
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
```

可參考專案中的 [`.env.example`](/D:/AlongDo/.env.example:1)。

### 3. 準備雲端服務

在正式執行前，需先完成以下設定：

- 在 `Google Cloud` 啟用：
  - `Maps SDK for Android`
  - `Places API (New)`
  - `Directions API`
- 在 `Firebase` 建立專案並啟用：
  - `Firestore Database`
  - `Anonymous Authentication`

### 4. 啟動 Android 開發版

```bash
npx expo run:android
```

### 5. 啟動 Metro

```bash
npm start -- --clear
```

---

## APK 測試

若要提供隊友在 Android 裝置或模擬器上測試，可以打包 release APK。

目前 APK 輸出位置：

```text
android/app/build/outputs/apk/release/app-release.apk
```

---

## 專案目前狀態

AlongDo 現在已經不是單純的靜態畫面，而是具備：

- 任務 CRUD
- 群組建立 / 加入
- Firebase 雲端同步
- 地點搜尋與地圖顯示
- 路線規劃
- 外部 Google Maps 導航
- 天氣提醒

的可運作原型。

---

## 未來可延伸方向

- QR code 加入群組
- 正式登入系統（Google / Email）
- 任務編輯
- 更進階的路線最佳化
- 推播通知與背景提醒
- 更完整的群組權限管理
