import { KPeriod, StockKData } from "../../../types.ts"
import crawl from "./crawl_all.ts"

async function crawl2File(code: string, period = KPeriod.Day, debug = false): Promise<StockKData> {
  const stockK = await crawl(code, period, { debug })
  if (debug) await Deno.writeTextFile(`temp/10jqka-v6-line-all-${code}-${period}.json`, JSON.stringify(stockK, null, 2))
  return stockK
}

// 股票：600000
Deno.test("600000 all year k", async () => {
  await crawl2File("600000", KPeriod.Year, false)
})
Deno.test("600000 all quarter k", async () => {
  await crawl2File("600000", KPeriod.Quarter, false)
})
Deno.test("600000 all month k", async () => {
  await crawl2File("600000", KPeriod.Month, false)
})
Deno.test("600000 all week k", async () => {
  await crawl2File("600000", KPeriod.Week, false)
})
Deno.test("600000 all day k", async () => {
  await crawl2File("600000", KPeriod.Day, false)
})
Deno.test("600000 all 1 minute k", async () => {
  await crawl2File("600000", KPeriod.Minute1, false)
})
Deno.test("600000 all 5 minutes k", async () => {
  await crawl2File("600000", KPeriod.Minute5, false)
})
Deno.test("600000 all 30 minutes k", async () => {
  await crawl2File("600000", KPeriod.Minute30, false)
})
Deno.test("600000 all 60 minutes k", async () => {
  await crawl2File("600000", KPeriod.Minute60, false)
})

// 期货：玻璃主连
Deno.test("FG9999 all year k", async () => {
  await crawl2File("FG9999", KPeriod.Year, false)
})
Deno.test("FG9999 all quarter k", async () => {
  await crawl2File("FG9999", KPeriod.Quarter, false)
})
Deno.test("FG9999 all month k", async () => {
  await crawl2File("FG9999", KPeriod.Month, false)
})
Deno.test("FG9999 all week k", async () => {
  await crawl2File("FG9999", KPeriod.Week, false)
})
Deno.test("FG9999 all day k", async () => {
  await crawl2File("FG9999", KPeriod.Day, false)
})
Deno.test("FG9999 all 1 minute k", async () => {
  await crawl2File("FG9999", KPeriod.Minute1, false)
})
Deno.test("FG9999 all 5 minutes k", async () => {
  await crawl2File("FG9999", KPeriod.Minute5, false)
})
Deno.test("FG9999 all 30 minutes k", async () => {
  await crawl2File("FG9999", KPeriod.Minute30, false)
})
Deno.test("FG9999 all 60 minutes k", async () => {
  await crawl2File("FG9999", KPeriod.Minute60, false)
})
