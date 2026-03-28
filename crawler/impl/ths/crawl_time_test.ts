import { StockTimeData } from "../../../types.ts"
import crawl from "./crawl_time.ts"

async function crawl2File(code: string, debug = false): Promise<StockTimeData> {
  const stockData = await crawl(code, debug)
  if (debug) await Deno.writeTextFile(`temp/10jqka-v6-time-last-${code}.json`, JSON.stringify(stockData, null, 2))
  return stockData
}

// 沪市
Deno.test("600000 last time data", async () => {
  await crawl2File("600000", false)
})
Deno.test("688001 last time data", async () => {
  await crawl2File("688001", false)
})

// 深市
Deno.test("000001 last time data", async () => {
  await crawl2File("000001", false)
})
Deno.test("300001 last time data", async () => {
  await crawl2File("300001", false)
})

// 北交所
Deno.test("430047 last time data", async () => {
  await crawl2File("430047", false)
})
Deno.test("830799 last time data", async () => {
  await crawl2File("830799", false)
})

// 上期所
Deno.test("sn9999 last time data", async () => {
  // sn7777 - 沪锡连续
  // sn8888 - 沪锡指数
  // sn9999 - 沪锡主连
  await crawl2File("sn9999", false)
})

// 郑商所
Deno.test("sn9999 last time data", async () => {
  // FG7777 - 玻璃连续
  // FG8888 - 玻璃指数
  // FG9999 - 玻璃主连
  await crawl2File("FG9999", false)
})

// 大商所
Deno.test("sn9999 last time data", async () => {
  // a7777 - 豆一连续
  // a8888 - 豆一指数
  // a9999 - 豆一主连
  await crawl2File("a9999", true)
})
