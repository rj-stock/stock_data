import { KPeriod, StockKData } from "../../../types.ts"
import { writeTextFile } from "../_internal.ts"
import crawl from "./crawl_last360.ts"

async function crawl2File(code: string, period = KPeriod.Day, debug = false): Promise<StockKData> {
  const stockData = await crawl(code, period, debug)
  await writeTextFile(`temp/10jqka-v6-line-last360-${code}-${period}.json`, JSON.stringify(stockData, null, 2))
  return stockData
}

// 股票：600000
Deno.test("600000 last 360 k of year", async () => {
  await crawl2File("600000", KPeriod.Year, false)
})
Deno.test("600000 last 360 k of quarter", async () => {
  await crawl2File("600000", KPeriod.Quarter, false)
})
Deno.test("600000 last 360 k of month", async () => {
  await crawl2File("600000", KPeriod.Month, false)
})
Deno.test("600000 last 360 k of week", async () => {
  await crawl2File("600000", KPeriod.Week, false)
})
Deno.test("600000 last 360 k of day", async () => {
  await crawl2File("600000", KPeriod.Day, false)
})
Deno.test("600000 last 360 k of 1 minute", async () => {
  await crawl2File("600000", KPeriod.Minute1, false)
})
Deno.test("600000 last 360 k of 5 minutes", async () => {
  await crawl2File("600000", KPeriod.Minute5, false)
})
Deno.test("600000 last 360 k of 30 minutes", async () => {
  await crawl2File("600000", KPeriod.Minute30, false)
})
Deno.test("600000 last 360 k of 60 minutes", async () => {
  await crawl2File("600000", KPeriod.Minute60, false)
})

// 板块
Deno.test("881153 last 360 k of day", async () => {
  await crawl2File("881153", KPeriod.Day, false)
})

// 期货：玻璃主连
Deno.test("FG9999 last 360 year k", async () => {
  await crawl2File("FG9999", KPeriod.Year, false)
})
Deno.test("FG9999 last 360 quarter k", async () => {
  await crawl2File("FG9999", KPeriod.Quarter, false)
})
Deno.test("FG9999 last 360 month k", async () => {
  await crawl2File("FG9999", KPeriod.Month, false)
})
Deno.test("FG9999 last 360 week k", async () => {
  await crawl2File("FG9999", KPeriod.Week, false)
})
Deno.test("FG9999 last 360 day k", async () => {
  await crawl2File("FG9999", KPeriod.Day, false)
})
Deno.test("FG9999 last 360 1 minute k", async () => {
  await crawl2File("FG9999", KPeriod.Minute1, false)
})
Deno.test("FG9999 last 360 5 minutes k", async () => {
  await crawl2File("FG9999", KPeriod.Minute5, false)
})
Deno.test("FG9999 last 360 30 minutes k", async () => {
  await crawl2File("FG9999", KPeriod.Minute30, false)
})
Deno.test("FG9999 last 360 60 minutes k", async () => {
  await crawl2File("FG9999", KPeriod.Minute60, false)
})
