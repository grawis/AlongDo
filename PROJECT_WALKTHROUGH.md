# AlongDo 專案完整說明

## 1. 專案概述

AlongDo 是一款以「地點導向待辦」為核心概念的行動 App。它把一般待辦清單、群組協作、目前位置、路線規劃與天氣提醒整合在同一個流程中，讓使用者不只知道「要做什麼」，也知道「現在在哪裡、接下來去哪裡、要不要順路完成」。

專案的主要目標有三個：

1. 讓個人任務與團隊任務可以一起管理。
2. 讓任務可以和地點產生關聯，而不只是文字清單。
3. 讓使用者根據目前位置，快速得到附近任務、路線順序與天氣建議。

目前專案已經是一個可運作的原型 App，具備：

- 個人任務與團隊任務管理
- Firebase 雲端資料儲存
- 群組建立、邀請碼加入、成員列表
- 固定地址與彈性地點兩種任務模式
- Google Maps 地點搜尋與路線規劃
- 目前位置天氣提醒
- Android APK 打包測試

---

## 2. 開發環境與使用技術

## 2.1 開發環境

本專案主要使用以下環境與工具：

- `Node.js / npm`
- `Expo SDK 56`
- `React Native`
- `Android Studio Emulator`
- `Firebase Console`
- `Google Cloud Console`
- `Git / GitHub`

本機開發時，主要以 Android 模擬器進行測試；分享給隊友測試時，則使用 release APK。

---

## 2.2 前端、後端與資料層概念

這個專案沒有自己另外架一台傳統後端伺服器，例如 Node.js + Express。

它的架構比較適合這樣理解：

### 前端

前端是使用者看得到、點得到的 App 畫面與互動，主要包括：

- [App.js](/D:/AlongDo/App.js:1)
- [screens/](/D:/AlongDo/screens)
- [components/](/D:/AlongDo/components)

例如：

- 任務卡片怎麼顯示
- 按鈕怎麼切換狀態
- 地圖怎麼呈現
- 頁面怎麼排版

都屬於前端。

### 後端功能來源

這個專案的後端功能主要交由雲端服務提供：

- `Firebase Firestore`
  - 儲存任務、群組、群組成員資料
- `Firebase Anonymous Auth`
  - 提供裝置匿名身分
- `Google Maps Platform`
  - 地點搜尋、附近搜尋、路線規劃
- `Open-Meteo API`
  - 取得目前位置天氣資訊

### 資料整合層

專案中的 `services/` 資料夾扮演中間橋樑，負責把畫面層與雲端服務串起來。

主要檔案包括：

- [services/api.js](/D:/AlongDo/services/api.js:1)
- [services/firebase.js](/D:/AlongDo/services/firebase.js:1)
- [services/auth.js](/D:/AlongDo/services/auth.js:1)
- [services/googleMaps.js](/D:/AlongDo/services/googleMaps.js:1)
- [services/config.js](/D:/AlongDo/services/config.js:1)

---

## 2.3 主要技術

### Expo + React Native

用來建構整個行動 App UI 與互動流程。

### Firebase Firestore

用來儲存：

- 個人任務
- 團隊任務
- 群組
- 群組成員

### Firebase Anonymous Auth

讓每台裝置第一次開啟 App 時，先拿到一個匿名使用者身分。這個身分會透過 AsyncStorage 保留，避免每次重開 App 都變成新使用者。

### Google Maps Platform

本專案使用了幾個關鍵服務：

- `Maps SDK for Android`
- `Places API (New)`
- `Directions API`
- `Geocoding API`

用途分別是：

- 顯示 App 內地圖
- 搜尋固定地址地點
- 搜尋彈性地點的附近候選
- 規劃路線、回傳距離與時間

### Open-Meteo API

用來取得目前位置的天氣資料，例如：

- 天氣狀況
- 溫度
- 體感溫度
- 降雨機率
- 風速

### expo-location

用來：

- 取得目前位置
- 反向地理編碼
- 把經緯度轉成人類可讀的地區，例如 `台南市東區附近`

### react-native-maps

用來在 App 內顯示：

- 目前位置
- 任務點
- 路線規劃圖

---

## 2.4 Firebase 資料結構

目前 Firestore 主要使用以下 collections：

### `personalTasks`

儲存個人任務，例如：

- `title`
- `location`
- `exactAddress`
- `locationMode`
- `coordinates`
- `googlePlaceId`
- `status`
- `ownerUid`
- `createdAt`

### `groupTasks`

儲存團隊任務，例如：

- `title`
- `location`
- `exactAddress`
- `locationMode`
- `coordinates`
- `googlePlaceId`
- `groupId`
- `groupName`
- `ownerUid`
- `ownerName`
- `status`
- `claimedByUid`
- `claimedByName`
- `completedByUid`
- `completedByName`
- `createdAt`

### `groups`

儲存群組資料，例如：

- `name`
- `inviteCode`
- `enabled`
- `createdByUid`
- `createdAt`

### `groupMembers`

儲存群組成員資料，例如：

- `groupId`
- `uid`
- `nickname`
- `role`
- `joinedAt`

---

## 3. 系統整體邏輯

App 啟動後的大致流程如下：

1. 先透過 Firebase Anonymous Auth 取得裝置使用者身分。
2. 從 Firestore 載入：
   - 個人任務
   - 群組
   - 群組成員
   - 團隊任務
3. 如果使用者進一步取得目前位置，App 會把這組位置存在 `App.js` 中，作為共用位置狀態。
4. `附近任務`、`路線規劃`、`天氣提醒` 都會共用這組位置，而不是各自重新抓一次。
5. 群組、任務、成員資料變動時，App 會重新同步對應的 Firestore 資料。

---

## 4. 功能頁面詳細說明

以下每個頁面都分成三個部分說明：

1. 如何操作
2. 有哪些功能與顯示
3. 技術上如何實現

---

## 4.1 首頁

### 如何操作

- 開啟 App 後預設進入首頁。
- 首頁主要用來快速理解 App 狀態，不需要太多操作。

### 有哪些功能與顯示

- 最上方顯示 AlongDo 主視覺
- 顯示簡短的 App 說明
- 顯示任務摘要
  - 個人任務總數
  - 個人待處理
  - 個人進行中
  - 啟用中群組
  - 團隊待處理
  - 團隊進行中
- 頁面底部顯示：
  - 目前裝置身分
  - 目前位置

### 技術上如何實現

- 畫面檔案在 [screens/HomeScreen.js](/D:/AlongDo/screens/HomeScreen.js:1)
- 首頁資料來自 [App.js](/D:/AlongDo/App.js:1) 傳入的：
  - `personalTasks`
  - `groupTasks`
  - `groups`
  - `currentUser`
  - `sharedLocationLabel`
- 首頁本身不直接呼叫 API，而是使用已載入好的全域狀態做摘要計算。

---

## 4.2 我的任務

### 如何操作

- 點底部分頁進入 `我的任務`
- 點任務卡片可切換狀態
- 點卡片內的刪除按鈕可刪除任務

### 有哪些功能與顯示

- 顯示所有個人任務
- 顯示任務標題
- 顯示任務地點
- 若是固定地址，顯示詳細地址
- 顯示任務模式
- 顯示任務狀態

目前狀態循環為：

- `待處理 -> 進行中 -> 已完成 -> 待處理`

### 技術上如何實現

- 畫面檔案：
  - [screens/MyTasksScreen.js](/D:/AlongDo/screens/MyTasksScreen.js:1)
  - [components/TaskCard.js](/D:/AlongDo/components/TaskCard.js:1)
- 資料來源：
  - `fetchPersonalTasks(uid)`
- 狀態更新：
  - `updatePersonalTaskStatus(taskId, status)`
- 刪除任務：
  - `deletePersonalTask(taskId)`
- 所有操作都會同步寫入 Firestore 的 `personalTasks`。

---

## 4.3 團隊任務

### 如何操作

- 點底部分頁進入 `團隊任務`
- 點團隊任務卡片可切換狀態
- 點卡片內刪除按鈕可刪除任務

### 有哪些功能與顯示

- 顯示目前啟用群組的團隊任務
- 顯示群組名稱
- 顯示任務地點與地址
- 顯示目前狀態
- 顯示：
  - `目前處理者`
  - 或 `完成者`

### 技術上如何實現

- 畫面檔案：
  - [screens/GroupTasksScreen.js](/D:/AlongDo/screens/GroupTasksScreen.js:1)
  - [components/TaskCard.js](/D:/AlongDo/components/TaskCard.js:1)
- 資料來源：
  - `fetchGroupTasks(groupIds)`
- 狀態更新：
  - `updateGroupTaskStatus(taskId, status, actor)`

#### 狀態邏輯

- `待處理 -> 進行中`
  - 記錄是誰開始處理
- `進行中 -> 已完成`
  - 只有同一位處理者可以完成
- `已完成 -> 待處理`
  - 會清掉本次處理者與完成者資訊

#### 協作限制

- 如果任務已被其他成員設為 `進行中`
- 其他人不能直接把它切換掉

這個限制透過 `claimedByUid` 與目前使用者 `uid` 進行判斷。

---

## 4.4 群組

### 如何操作

在 `群組` 頁可以做三件事：

1. 建立新群組
2. 用邀請碼加入群組
3. 切換群組啟用 / 停用

另外，每個群組也可以：

- 顯示目前成員

### 有哪些功能與顯示

- 建立群組表單
- 邀請碼加入群組表單
- 群組卡片顯示：
  - 群組名稱
  - 群組內自己的暱稱
  - 角色
  - 邀請碼
  - 啟用狀態
  - 顯示目前成員按鈕

### 技術上如何實現

- 畫面檔案：
  - [screens/GroupsScreen.js](/D:/AlongDo/screens/GroupsScreen.js:1)
- 主要 API：
  - `createGroup({ name, nickname }, uid)`
  - `joinGroupByInviteCode({ inviteCode, nickname }, uid)`
  - `fetchGroups(uid)`
  - `fetchGroupMembers(groupId)`
  - `updateGroupEnabled(groupId, enabled)`

#### 群組資料邏輯

- `groups` 存群組主資料
- `groupMembers` 存群組成員關聯
- 每位使用者可以在不同群組裡有不同暱稱

#### 啟用 / 停用邏輯

- 只有 `enabled = true` 的群組會被視為目前可用群組
- 停用群組後：
  - `團隊任務`
  - `附近任務`
  - `路線規劃`
  - `天氣提醒`
  都不會再看到該群組任務

---

## 4.5 新增任務

### 如何操作

在 `新增任務` 頁可以：

1. 選擇任務類型
   - 個人任務
   - 團隊任務
2. 輸入任務名稱
3. 選擇地點模式
   - 彈性地點
   - 固定地址
4. 如果是團隊任務，選擇群組
5. 送出建立任務

### 有哪些功能與顯示

- 個人 / 團隊任務切換
- 彈性地點 / 固定地址切換
- 團隊任務的群組選擇
- 固定地址的 Google 搜尋結果
- 任務建立按鈕

### 技術上如何實現

- 畫面檔案：
  - [screens/AddTaskScreen.js](/D:/AlongDo/screens/AddTaskScreen.js:1)

#### 固定地址模式

- 會透過 `searchPlaceCandidates(query)`
- 呼叫 [services/googleMaps.js](/D:/AlongDo/services/googleMaps.js:1) 中的 Places API (New) 搜尋候選地點
- 選定後會存下：
  - `exactAddress`
  - `coordinates`
  - `googlePlaceId`

#### 彈性地點模式

- 只先儲存地點需求名稱
- 真正對應到哪個實際地點，會在附近任務或路線規劃時再解析

#### 任務建立

- 個人任務：
  - `createPersonalTask(task, uid)`
- 團隊任務：
  - `createGroupTask(task, uid)`

---

## 4.6 附近任務

### 如何操作

- 點 `取得目前位置並更新附近任務`
- App 會使用目前共用位置
- 然後列出附近任務與地圖預覽

### 有哪些功能與顯示

- 顯示目前位置
- 顯示附近任務數量
- 地圖上顯示：
  - 目前位置
  - 任務地點
- 顯示附近任務清單

### 技術上如何實現

- 畫面檔案：
  - [screens/NearbySimulationScreen.js](/D:/AlongDo/screens/NearbySimulationScreen.js:1)
- 位置來源：
  - [App.js](/D:/AlongDo/App.js:1) 的 `sharedLocation`
- 任務解析邏輯：
  - `resolveTasksForCurrentLocation(tasks, currentCoords)`

#### 附近的定義

目前彈性地點搜尋預設範圍約為：

- `1500 公尺`

也就是約 `1.5 公里` 內。

#### 彈性地點解析邏輯

- 例如輸入 `全聯`、`便利商店`
- 系統會以目前位置為中心搜尋附近候選
- 目前會優先取第一筆結果作為最近候選點

---

## 4.7 路線規劃

### 如何操作

1. 進入 `路線規劃`
2. 選取任務
3. 按 `使用目前位置規劃`
4. 查看地圖與規劃結果
5. 可按 `用 Google Maps 開啟導航`

### 有哪些功能與顯示

- 顯示目前位置
- 顯示選取任務列表
- 地圖顯示：
  - `起` 點
  - `1、2、3...` 任務順序點
  - 路線 polyline
- 顯示：
  - 總距離
  - 預估時間
  - 每筆任務順序
- 可一鍵跳轉 Google Maps 導航

### 技術上如何實現

- 畫面檔案：
  - [screens/RoutePlannerScreen.js](/D:/AlongDo/screens/RoutePlannerScreen.js:1)
- 路線計算：
  - `planRoute(selectedIds, uid, groupIds, currentCoords)`

#### 路線處理流程

1. 先取得目前選中的任務
2. 對彈性地點任務做附近實際地點解析
3. 產生任務順序
4. 呼叫 Google Directions API
5. 回傳：
   - 總距離
   - 總時間
   - polyline 路線

#### 地圖顯示

- 使用 `react-native-maps`
- 使用 `Marker` 與 `Polyline`
- 自動 `fitToCoordinates` 讓整條路線可見

#### Google Maps 外部導航

- 使用 `https://www.google.com/maps/dir/?api=1`
- 帶入：
  - `origin`
  - `destination`
  - `waypoints`

---

## 4.8 天氣提醒

### 如何操作

- 進入 `天氣提醒`
- 按 `取得目前位置天氣提醒`

### 有哪些功能與顯示

- 顯示地區
- 顯示時區
- 顯示天氣狀況
- 顯示目前溫度
- 顯示體感溫度
- 顯示降雨機率
- 顯示風速
- 顯示出門建議
- 顯示受影響任務

### 技術上如何實現

- 畫面檔案：
  - [screens/WeatherReminderScreen.js](/D:/AlongDo/screens/WeatherReminderScreen.js:1)
- 天氣資料來源：
  - `fetchWeather(currentCoords, tasks)` in [services/api.js](/D:/AlongDo/services/api.js:1)
- 天氣 API：
  - `Open-Meteo Forecast API`

#### 地區顯示

- 使用 `expo-location` 的 `reverseGeocodeAsync`
- 轉成像 `台南市東區附近` 這種可讀地區
- 同時保留時區，例如 `Asia/Taipei`

#### 提醒邏輯

目前會根據：

- 降雨機率
- 溫度
- 風速
- 是否有未完成任務
- 是否有固定地址任務
- 是否有彈性地點任務

來產生提醒內容。

#### 受影響任務

目前會從未完成任務中挑出前幾筆顯示，作為天氣提醒參考。

---

## 5. 共用位置邏輯

本專案目前位置採用「App 全域共用」方式。

也就是：

- `附近任務`
- `路線規劃`
- `天氣提醒`

共用同一組 `sharedLocation` 與 `sharedLocationLabel`。

好處是：

- 不用每換一頁就重新抓位置
- 使用者按一次即可讓多個功能共用
- 減少模擬器定位偶發不同步的問題

只有使用者再次按下取得位置按鈕時，才會更新成新的位置。

---

## 6. 畫面與配色設計

美術部分目前採用：

- 白色為主體背景
- 很淺的藍色作為主視覺輔助色
- 保留少量綠色作為成功或狀態辨識色

設計方向以：

- 乾淨
- 清楚
- 容易閱讀
- 不過度花俏

為主。

App icon 則使用使用者提供的裁切版本，並同步到 Android launcher icon。

---

## 7. 目前已完成的核心能力

目前 AlongDo 已完成以下核心功能：

- Firebase 匿名登入
- Firestore 任務與群組資料同步
- 個人任務新增、刪除、狀態切換
- 團隊任務新增、刪除、狀態切換
- 團隊任務處理者 / 完成者標記
- 群組建立
- 邀請碼加入群組
- 群組成員列表
- 群組啟用 / 停用
- 固定地址地點搜尋
- 彈性地點附近解析
- 附近任務地圖預覽
- 路線規劃與 Google Maps 導航
- 目前位置天氣提醒
- Android APK 打包給他人測試

---

## 8. 後續可延伸方向

目前這個版本已足夠作為課堂展示或多人測試原型，之後仍可延伸：

- QR code 加入群組
- 正式登入系統（Google / Email）
- 群組角色權限細化
- 任務編輯功能
- 更精細的天氣影響任務判斷
- 更進階的路線最佳化
- iOS 版本支援

---

## 9. 結論

AlongDo 目前已經不是單純靜態畫面，而是一個具備：

- 雲端資料儲存
- 群組協作
- 地點搜尋
- 路線規劃
- 天氣提醒

的完整原型 App。

它最核心的特色在於：

把「待辦事項」從純文字清單，提升成會根據位置、群組、路線與天氣一起思考的行動任務管理工具。

如果要向隊員或老師說明這個專案，可以把它概括成一句話：

> AlongDo 是一款結合待辦管理、群組協作、地點搜尋、路線規劃與天氣提醒的地點導向任務 App，目標是讓使用者更有效率地完成日常與團隊任務。
