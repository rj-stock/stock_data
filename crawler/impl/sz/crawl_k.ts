/**
 * 从深交所爬取标的 K 线数据。
 *
 * 1. 打开上交所页面 http://www.szse.cn/certificate/individual/index.html?code=000001，
 * 2. 在这个页面会显示标的的基本信息和分时图、日线图、周线图、月线图
 * 3. 点击日线发出 json 请求 http://www.szse.cn/api/market/ssjjhq/getHistoryData?random=0.35196138875325045&cycleType=32&marketId=1&code=000001
 *    响应结果是最近的 201 根 K 线数据
 * @module
 */
import { formatDateTime } from "../../../deps.ts"
import { CrawlInit, KCrawler } from "../../crawler.ts"
import { KData, KPeriod, StockKData } from "../../../types.ts"
import { userAgent } from "../../../browser.ts"
import { period2QueryParamValue } from "./_internal.ts"
import { writeTextFile } from "../_internal.ts"

type ResponseJson = {
  code: string // 值为 "0" 代表成功
  message: string
  data: {
    code: string
    name: string
    // [日期, 开盘价, 收盘价, 最低价, 最高价, 涨跌, 涨跌幅(-0.20%), 成交量(手), 成交额(元)]
    // ["2022-06-06", "9.38", "9.21", "9.12", "9.53", "-0.20", "-2.13", 174830, 161583797]
    picupdata: [[string, string, string, string, string, string, string, number, number]]
    // [ "2022-06-06", 174830, "minus" ]
    picdowndata: [[string, number, string]]
  }
}

/**
 * 从深交所爬取标的 K 线数据。
 */
const crawl: KCrawler = async (
  code: string,
  period = KPeriod.Day,
  init?: CrawlInit,
): Promise<StockKData> => {
  const random = Math.random()
  let url = `http://www.szse.cn/api/market/ssjjhq/getHistoryData?random=${random}&marketId=1&code=${code}`
  url += `&cycleType=${period2QueryParamValue(period)}`
  // console.log(url)
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "User-Agent": userAgent,
      "Host": "www.szse.cn",
      "Referer": `http://www.szse.cn/certificate/individual/index.html?code=${code}`,
    },
  })
  if (!response.ok) throw new Error(`从深交所获取 ${code} 数据失败：${response.status} ${response.statusText}`)
  const j = await response.json() as ResponseJson
  if (init?.debug) await writeTextFile(`temp/sz-${code}-${period}-res.json`, JSON.stringify(j))
  // {"code":"-1","data":{"code":null,"name":null,"picupdata":null,"picdowndata":null},"message":"历史K线数据获取失败"}
  if (j.code !== "0") throw new Error(`从深交所获取 ${code} 数据失败：${j.message}`)
  if (init?.debug) await writeTextFile(`temp/sz-${code}-${period}-res.json`, JSON.stringify(j))

  // 组合数据返回
  const stockData: StockKData = {
    ts: formatDateTime(new Date(), "yyyy-MM-ddTHH:mm:ss"),
    period,
    code,
    name: j.data.name,
    total: j.data.picupdata.length,
    dataCount: j.data.picupdata.length,
    data: j.data.picupdata.map(([d, o, c, l, h, _1, _2, v, a]) => {
      return {
        t: d,
        o: parseFloat(o),
        c: parseFloat(c),
        l: parseFloat(l),
        h: parseFloat(h),
        v: v * 100, // 手转股
        a,
      } as KData
    }),
  }
  return stockData
}

export default crawl
