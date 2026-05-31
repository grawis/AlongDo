# AlongDo

AlongDo 是一個以「地點」為核心的待辦事項 App 原型，使用 `Expo + React Native` 開發。  
它的目標不是只有記下任務，而是幫使用者把任務和實際地點連起來，像是：

- 去最近的全聯買東西
- 到固定地址交文件
- 幫群組處理共同任務

目前這個專案仍以原型驗證為主，資料多數還是 mock / 本機 state，但已經可以展示定位、Google Maps 顯示、固定地址搜尋，以及彈性地點與固定地址兩種任務模式。

## 目前功能

- 首頁摘要：顯示個人任務、團隊任務、群組狀態
- 我的任務：查看個人任務列表
- 團隊任務：查看團隊任務，並可切換任務狀態
- 群組管理：查看群組、切換群組是否啟用
- 新增任務：
  - 任務類型：個人任務 / 團隊任務
  - 地點模式：彈性地點 / 固定地址
  - 固定地址可用 Google 地點搜尋並從地圖或清單選點
- 附近任務：
  - 取得目前定位
  - 在地圖上顯示目前位置與任務位置
  - 彈性地點任務可依目前位置解析附近實際地點
- 路線規劃：模擬多筆任務的執行順序
- 天氣提醒：目前為 mock 資料

## 地點模式說明

### 彈性地點

適合像這種需求：

- 全聯
- 便利商店
- 五金行

這種任務不綁死某一間店，而是之後依照使用者當下位置，去找附近最符合的地點。

### 固定地址

適合像這種需求：

- 成大資工系館
- 7-ELEVEN 成大門市
- 某個指定地址

這種任務建立後會固定綁定一個真實地點，就算使用者移動到別的城市，這筆任務還是會指向原本那個位置。

## 技術架構

- `Expo`
- `React Native`
- `expo-location`
- `react-native-maps`
- `Google Maps Platform`
  - Maps SDK for Android
  - Places API (New)
  - Directions API

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
├─ PROJECT_SPEC.md
├─ CURRENT_STATUS.md
└─ README.md
```

## 本機執行方式

### 1. 安裝套件

```bash
npm install
```

### 2. 建立 `.env`

請在專案根目錄建立 `.env`，內容如下：

```env
GOOGLE_MAPS_API_KEY=你的_Google_Maps_API_Key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=你的_Google_Maps_API_Key
```

目前這兩個欄位先都填同一把 key，方便原生地圖顯示和 JS 端 Places 搜尋共用。

### 3. 啟動 Android 開發版

```bash
npx expo run:android
```

如果你只是啟動 Metro：

```bash
npm start -- --clear
```

那通常比較適合在已經 build 好的情況下重新載入 JS，但只要你有改到 `app.config.js`、Maps key、原生地圖設定，建議直接重新跑：

```bash
npx expo run:android
```

## Google Cloud 需求

請在 Google Cloud 專案中啟用以下 API：

- `Maps SDK for Android`
- `Places API (New)`
- `Directions API`

另外需要：

- 啟用 Billing
- 建立新的 API key
- 不要把 key 推上 GitHub

## GitHub 使用方式

### 第一次上傳

```bash
git init
git branch -M main
git add .
git commit -m "Initial AlongDo project snapshot"
git remote add origin https://github.com/你的帳號/AlongDo.git
git push -u origin main
```

### 之後每次更新

```bash
git status
git add .
git commit -m "這次改動的說明"
git push
```

### 建議 commit 訊息

- `完成固定地址搜尋`
- `加入地圖候選點選擇`
- `調整新增任務流程`
- `完成附近任務定位顯示`

## 安全注意事項

這個專案一定要避免把敏感資料推到 GitHub。

請確認以下檔案或資料夾不要進版控：

- `.env`
- `node_modules/`
- `dist/`
- `android/`

目前 `.gitignore` 已經應該至少包含：

```gitignore
node_modules/
.expo/
.env
.env.local
dist/
android/
android/app/build/
```

## 目前限制

- 尚未接 Firebase / 正式後端資料庫
- 任務資料目前仍以 mock 與前端 state 為主
- 天氣提醒尚未接真實天氣 API
- 路線規劃仍是原型流程，還可再強化

## 下一步方向

- 接 Firebase 儲存任務、群組與同步資料
- 讓彈性地點任務在路線規劃中更完整地解析最近地點
- 補齊固定地址與地圖互動體驗
- 整理未使用畫面與舊檔案

## 備註

如果你是這個專案的維護者，建議每完成一個功能就立刻 commit 一次。  
這樣之後要回溯版本、比較功能差異，會輕鬆很多。
