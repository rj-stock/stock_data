import { assertStrictEquals } from "../../../deps.ts"
import { StockBase } from "../../../types.ts"
import crawl from "./crawl_list.ts"

Deno.test("all stock list", async () => {
  const list: StockBase[] = await crawl(true)
  // 2023-04-22 total=5309
  console.log(`total=${list.length}`)
  assertStrictEquals(list[0].code, "600000")
  assertStrictEquals(list[0].name, "浦发银行")

  // 仅沪深主板、科创板、创业板
  list.forEach(({ code }) =>
    assertStrictEquals(code.startsWith("0") || code.startsWith("3") || code.startsWith("6"), true)
  )
})
