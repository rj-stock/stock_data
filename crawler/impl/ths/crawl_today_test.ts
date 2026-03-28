import { KPeriod, LatestKData } from "../../../types.ts"
import crawl from "./crawl_today.ts"

async function crawl2File(code: string, period = KPeriod.Day, debug = false): Promise<LatestKData> {
  const stockData = await crawl(code, period, { debug })
  if (debug) await Deno.writeTextFile(`temp/10jqka-v6-line-today-${code}-${period}.json`, JSON.stringify(stockData, null, 2))
  return stockData
}

// 股票：600000
Deno.test("600000 today k of year", async () => {
  await crawl2File("600000", KPeriod.Year, false)
})
Deno.test("600000 today k of quarter", async () => {
  await crawl2File("600000", KPeriod.Quarter, false)
})
Deno.test("600000 today k of month", async () => {
  await crawl2File("600000", KPeriod.Month, false)
})
Deno.test("600000 today k of week", async () => {
  await crawl2File("600000", KPeriod.Week, false)
})
Deno.test("600000 today k of day", async () => {
  await crawl2File("600000", KPeriod.Day, false)
})
Deno.test("600000 today k of 1 minute", async () => {
  await crawl2File("600000", KPeriod.Minute1, false)
})
Deno.test("600000 today k of 5 minutes", async () => {
  await crawl2File("600000", KPeriod.Minute5, false)
})
Deno.test("600000 today k of 30 minutes", async () => {
  await crawl2File("600000", KPeriod.Minute30, false)
})
Deno.test("600000 today k of 60 minutes", async () => {
  await crawl2File("600000", KPeriod.Minute60, false)
})

// 期货：玻璃主连
Deno.test("FG9999 today k of year", async () => {
  await crawl2File("FG9999", KPeriod.Year, false)
})
Deno.test("FG9999 today k of quarter", async () => {
  await crawl2File("FG9999", KPeriod.Quarter, false)
})
Deno.test("FG9999 today k of month", async () => {
  await crawl2File("FG9999", KPeriod.Month, false)
})
Deno.test("FG9999 today k of week", async () => {
  await crawl2File("FG9999", KPeriod.Week, false)
})
Deno.test("FG9999 today k of day", async () => {
  await crawl2File("FG9999", KPeriod.Day, true)
})
Deno.test("FG9999 today k of 1 minute", async () => {
  await crawl2File("FG9999", KPeriod.Minute1, false)
})
Deno.test("FG9999 today k of 5 minutes", async () => {
  await crawl2File("FG9999", KPeriod.Minute5, false)
})
Deno.test("FG9999 today k of 30 minutes", async () => {
  await crawl2File("FG9999", KPeriod.Minute30, false)
})
Deno.test("FG9999 today k of 60 minutes", async () => {
  await crawl2File("FG9999", KPeriod.Minute60, false)
})
