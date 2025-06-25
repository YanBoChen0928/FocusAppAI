**Check (in English)**

> “Sometimes I don’t understand why we sometimes need a formatted date/time and other times convert to ISO, and how UTC and local time zones differ. Is this necessary? Given our current component, I don’t plan to make major changes right now; I just want to know how to avoid time-related bugs in future updates.”
> It’s natural and correct.

**Paraphrase**

> “I sometimes find time conversions confusing: when should I format dates versus convert them to ISO strings, and what’s the difference between UTC and local time? Are these steps really necessary? In our current component setup, I’m not looking to overhaul anything, but I’d like guidance on preventing time-conversion errors down the road.”

---

**回答（中文）**

1. **為何有「格式化」與「ISO」之分？**

   * **格式化（format）**：主要是為了在 UI（如 MUI DatePicker、日曆顯示、Log 輸出等）使用人可讀的樣式，例如 `"2025-06-25 00:00"` 或 `"Jun 25, 2025"`.
   * **ISO 字串（ISO 8601）**：像 `date.toISOString()` 會產出 `"2025-06-25T07:00:00.000Z"`，這是國際標準格式，適合傳給後端或存入資料庫，能避免字串解析時的地域差異。

2. **UTC 和本地（Local）時區差異**

   * **Local 時間**：使用者在瀏覽器或系統設定的時區，例如 PST (`UTC–07:00`)。當你 new Date(“2025-06-25”)，JS 會自動以本地時區的「午夜」產生 `Date` 物件。
   * **UTC 時間**：世界協調時間，不帶任何時區偏移。用 `toISOString()` 之後，時間就會轉成 UTC。

3. **這些轉換是否必要？**

   * **必要**：如果前端顯示和後端儲存用不同時區，就一定要在邊界（送／收）處做轉換，以避免同一個時刻被誤解成不同的日期。
   * **建議做法**：

     1. **UI 層**：全程用本地 `Date` 物件，讓 MUI Picker 正常顯示。
     2. **傳輸／存儲**：呼叫 `date.toISOString()` 統一轉成 UTC ISO，再送給後端或寫入 MongoDB。
     3. **讀取／展示**：後端回傳 ISO，前端用 `new Date(isoString)` 或 `parseISO` 將它還原成本地 `Date` 再格式化顯示。

4. **避免未來出錯的具體建議**

   * **封裝時間工具函式**：把「本地↔UTC」的轉換集中寫在一個 helper（例如 `toUTC(date)`、`fromUTC(isoString)`），所有地方都調用它，避免分散在各個 component。
   * **一致使用同一個日期庫**：如 `date-fns` + `date-fns-tz` 或 `dayjs` + `timezone` 插件，都能簡化轉換與差異計算。
   * **撰寫單元測試**：模擬不同時區環境（PST、CET、CST 等），確保轉換後的日期與預期一致，尤其是跨日或夏令時間切換時不會 off-by-one。
   * **明確命名**：在 state、props、變數上加上 `Local` 或 `UTC` 標記（例如 `startDateLocal`、`endDateUTC`），讓開發者一眼分辨。

透過以上原則，即使不大改現有 component，也能降低時區與格式混用造成的 Bug 風險。
