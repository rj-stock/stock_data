import { assert, assertEquals } from "../../../deps.ts"
import { KPeriod, StockKData } from "../../../types.ts"
import { CrawlInit } from "../../crawler.ts"
import crawl from "./crawl_k.ts"

async function crawl2File(code: string, period = KPeriod.Day, init?: CrawlInit): Promise<StockKData> {
  const stockK = await crawl(code, period, init)
  if (init?.debug) await Deno.writeTextFile(`temp/sz-${code}-${period}.json`, JSON.stringify(stockK, null, 2))
  return stockK
}

Deno.test("000001 day k all", async () => {
  const list = await crawl2File("000001", KPeriod.Day, { debug: true })
  assertEquals(list.code, "000001")
  assertEquals(list.name, "平安银行")
  assert(list.total >= 201, `expected >= 201 actual ${list.total}`)
  assertEquals(list.dataCount, list.total)
})

Deno.test("000001 week k all", async () => {
  const list = await crawl2File("000001", KPeriod.Week, { debug: true, start: 0 })
  assertEquals(list.code, "000001")
  assertEquals(list.name, "平安银行")
  assert(list.total >= 201, `expected >= 201 actual ${list.total}`)
  assertEquals(list.dataCount, list.total)
})

Deno.test("000001 month k all", async () => {
  const list = await crawl2File("000001", KPeriod.Month, { debug: true, start: 0 })
  assertEquals(list.code, "000001")
  assertEquals(list.name, "平安银行")
  assert(list.total >= 201, `expected >= 201 actual ${list.total}`)
  assertEquals(list.dataCount, list.total)
})

Deno.test("000001 quarter k all", async () => {
  const list = await crawl2File("000001", KPeriod.Quarter, { debug: true, start: 0 })
  assertEquals(list.code, "000001")
  assertEquals(list.name, "平安银行")
  assert(list.total >= 130, `expected >= 130 actual ${list.total}`)
  assertEquals(list.dataCount, list.total)
})

Deno.test("000001 year k all", async () => {
  const list = await crawl2File("000001", KPeriod.Year, { debug: true, start: 0 })
  assertEquals(list.code, "000001")
  assertEquals(list.name, "平安银行")
  assert(list.total >= 33, `expected >= 33 actual ${list.total}`)
  assertEquals(list.dataCount, list.total)
})
