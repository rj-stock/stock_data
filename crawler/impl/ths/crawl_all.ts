/**
 * 从同花顺数据中心打开页面 http://stockpage.10jqka.com.cn/300025/ 收集的数据请求地址。
 *
 * 这个 url 爬取的数据缺点是没有成交金额。
 *
 * 1. 打开页面 http://stockpage.10jqka.com.cn/300025/ ，然后点“日K”并切换到“不复权”，发出下面的数据请求：
 * 2. https://d.10jqka.com.cn/v6/line/hs_300025/${sp}/all.js|today.js
 *
 * 其中:
 * | dd | type  | Remark
 * |----|-------|--------
 * | 00 | 日 K  | 不复权
 * | 10 | 周 K  | 不复权
 * | 20 | 月 K  | 不复权
 * | 90 | 季 K  | 不复权
 * | 80 | 年 K  | 不复权
 * | 60 | 1分钟  | 不复权
 * | 30 | 5分钟  | 不复权
 * |    | 15分钟 | 不复权
 * | 40 | 30分钟 | 不复权
 * | 50 | 60分钟 | 不复权
 * |
 * | 01 | 日 K | 前复权
 * | 11 | 周 K | 前复权
 * | 21 | 月 K | 前复权
 * |
 * | 02 | 日 K | 后复权
 * | 12 | 周 K | 后复权
 * | 22 | 月 K | 后复权
 *
 * @module
 */
import { formatDateTime, parseJsonp } from "../../../deps.ts"
import { CrawlInit, KCrawler } from "../../crawler.ts"
import { KData, KPeriod, StockKData } from "../../../types.ts"
import { code2LineUrlPath, period2LineUrlPath, thsRequestInit, ts2IsoStandard } from "./internal.ts"
import { writeTextFile } from "../_internal.ts"

type ResponsJson = {
  // 个股名称，如浦发银行 "\u6d66\u53d1\u94f6\u884c"
  name: string
  // 此周期首个数据的起始日期或时间：年月季周日周期的格式为 yyyyMMdd、分钟周期的格式为 yyyyMMddHHmm
  start: string
  // 总K线个数
  total: string
  // 格式为 [[年份的 yyyy 数字,年份的K线个数],...]，年份值由小到大
  // 如 60000 的 [[1999,  36], [2000, 237],..., [2022, 242], [2023, 68]]
  sortYear: [[number, number]]
  // 格式为交易日的 MMdd 格式用逗号连接的字符串，年份需要从 sortYear 中取
  // 按逗号分割后其长度值应与 total 的值相等
  dates: string
  // 成交量(股票为股数、期货为手数)的逗号字符串连接，如 "15007900,...,19475694"
  // 按逗号分割后其长度值应与 total 的值相等
  volumn: string
  // price 字段内价格的值对应的乘数，为 100，如实际价格为 7.25 在 price 中显示为 725
  priceFactor: number
  // 各个K线数据的字符串连接，如 "2700,250,280,75,2753,5,85,18,...,720,2,9,5,725,3,6,2"
  // "最低价x100,(开盘价-最低价)x100,(最高价-最低价)x100,(收盘价-最低价)x100,..."
  // 每根K线占用4个位置，按逗号分割后其长度值应与 totalx4 的值相等
  price: string
}

/**
 * 同花顺股票、期货数据器爬取实现。
 *
 * 1. 打开页面 http://stockpage.10jqka.com.cn/300025/ 然后点“日K”并切换到不复权，发出下面的数据请求
 * 2. https://d.10jqka.com.cn/v6/line/hs_300025/00/all.js
 */
const crawl: KCrawler = async (code: string, period = KPeriod.Day, { debug }: CrawlInit = {}): Promise<StockKData> => {
  const type = code2LineUrlPath(code)
  const sp = period2LineUrlPath(period)
  const url = `http://d.10jqka.com.cn/v6/line/${type}_${code}/${sp}/all.js?ts=${Date.now()}`
  const response = await fetch(url, thsRequestInit)
  if (!response.ok) throw new Error(`从同花顺获取 "${code}" 数据失败：${response.status} ${response.statusText}`)

  /**
   * 响应体数据结构例子: quotebridge_v6_line_hs_600000_00_all({
   *   "total":"5559","start":"19991110",
   *   "name":"\u6d66\u53d1\u94f6\u884c",
   *   "sortYear":[[1999,36],...,[2023,68]],
   *   "priceFactor":100,
   *   "price":"...,720,2,9,5,725,3,6,2",
   *   "volumn":"...,25074604",
   *   "afterVolumn":"...",
   *   "dates":"1110,...,0414",
   *   "issuePrice":"","marketType":"HS_stock_sh",
   * })
   */
  const txt = await response.text()
  if (debug) await writeTextFile(`temp/10jqka-v6-line-all-${code}-${period}.js`, txt)

  const j = parseJsonp(txt) as ResponsJson
  const dates = j.dates.split(",")
  const volumns = j.volumn.split(",")
  const prices = j.price.split(",")
  const yearKCounts = j.sortYear
  const total = parseInt(j.total)
  const priceFactor = j.priceFactor
  // console.log(`${code} all ${period} k total=${j.total}`)
  // console.log("priceFactor=" + priceFactor)
  if (dates.length !== total || volumns.length !== total || prices.length !== total * 4) {
    throw new Error("检测到同花顺返回错误的数据结构")
  }

  // 解析K线数据
  const kDatas: KData[] = []
  let yc = 0
  for (const [year, count] of yearKCounts) {
    for (let j = 0; j < count; j++) {
      const i = yc + j
      const MMdd = dates[i]
      const k = i * 4
      const [low10, dOpen, dHigh, dClose] = [
        parseInt(prices[k]),
        parseInt(prices[k + 1]),
        parseInt(prices[k + 2]),
        parseInt(prices[k + 3]),
      ]

      kDatas.push({
        t: ts2IsoStandard(`${year}${MMdd}`),
        l: low10 / priceFactor,
        o: (low10 + dOpen) / priceFactor,
        h: (low10 + dHigh) / priceFactor,
        c: (low10 + dClose) / priceFactor,
        /** 成交量(股) */
        v: parseInt(volumns[i]),
        /** NO 成交额(元) */
        a: 0,
      })
    }
    yc += count
  }

  // 组合数据返回
  const stockData: StockKData = {
    ts: formatDateTime(new Date(), "yyyy-MM-ddTHH:mm:ss"),
    period,
    code,
    name: j.name,
    start: ts2IsoStandard(j.start),
    total: parseInt(j.total),
    dataCount: kDatas.length,
    data: kDatas,
  }
  return stockData
}

export default crawl
