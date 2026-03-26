/**
 * 获取深交所全部股票列表。
 *
 * 来源：
 * 1. 打开深圳证券交易所主页，然后点击“市场数据/产品目录/股票>A股列表” http://www.szse.cn/market/product/stock/list/index.html
 * 2. 还有一个 json页请求
 *    http://www.szse.cn/api/report/ShowReport/data?SHOWTYPE=JSON&CATALOGID=1110&TABKEY=tab1&random=0.6941072494594465
 *    这个请求会返回最近20条的A+B股股票列表信息(含上市日期、行业、股本)，格式为：
 *    ```json
 *    [
 *      {
 *        error: null,
 *        metadata: {
 *          "pagesize": 20,      // 每页容量
 *          "pageno": 3,         // 当前页码
 *          "pagecount": 141,    // 总页数
 *          "recordcount": 2805, // 总条目数
 *          "subname": "2023-08-07 ",
 *          "pagetype": "tabs",
 *          "tabkey": "tab1",
 *          ...
 *        },
 *        data:[
 *          {
 *            "bk": "主板",           // 板块
 *            "agdm": "000001",       // A股代码
 *            // A股简称
 *            "agjc": "<a href='http://www.szse.cn/certificate/individual/index.html?code=000001' target='_blank'><u>平安银行</u></a>",
 *            "agssrq": "1991-04-03", // A股上市日期
 *            "agzgb": "194.05",      // A股总股本（亿股）
 *            "agltgb": "194.05",     // A股流通股本（亿股）
 *            "sshymc": "J 金融业",   // 所属行业
 *            "ylbz": "-",
 *            "sfjybjqcy": "-",
 *            "gskzjglx": "-"
 *          },
 *          ...
 *        ],
 *      },
 *      ...
 *    ]
 *    ```
 *    在页面下方可以点击进行前后分页
 * @module
 */
import { ListCrawler } from "../../crawler.ts"
import { StockBase } from "../../../types.ts"
import { delay, pathExistsSync } from "../../../deps.ts"
import { writeTextFile } from "../_internal.ts"
type Metadata = {
  // 每页容量
  pagesize: number
  // 当前页码
  pageno: number
  // 总页数
  pagecount: number
  // 总条目数
  recordcount: number
}
type DataItem = {
  // 标的代码
  agdm: string
  // 标的简称（格式为 <a ...><u>平安银行</u></a>）
  agjc: string
  // 上市日期 yyyy-MM-dd
  agssrq: string
}
type ResponseItem = { metadata: Metadata; data: Array<DataItem>; error: string | null }

/** 从 "<a ...><u>平安银行</u></a>" 中解析出标的名称 */
function polishingName(agjc: string): string {
  return agjc.split("u>")[1].split("<")[0]
}

/** 爬取指定页的标的列表数据 */
async function crawlOnePage(pageNo: number, debug = false): Promise<ResponseItem> {
  let url = `http://www.szse.cn/api/report/ShowReport/data?random=${Date.now()}&SHOWTYPE=JSON&CATALOGID=1110`
  url += "&TABKEY=tab1"
  url += `&PAGENO=${pageNo}`
  // console.log(`page ${pageNo}, url=${url}`)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`从深交所获取 page ${pageNo} 股票清单失败：${response.status} ${response.statusText}`)
  }

  const j = await response.json() as Array<ResponseItem>
  if (debug) {
    await writeTextFile(`temp/sz/sz-list-res-page${pageNo}.js`, JSON.stringify(j, null, 2))
  }
  if (j.length !== 4 || j[3].error) throw new Error("从深交所获取 page ${pageNo} 股票清单失败：" + j[0]?.error)
  return j[0]
}

/**
 * 获取全部股票列表
 * @param debug 是否将响应的 body 保存到 temp/sh-list-res.js 文件
 * @param getStartDate 是否获取标的的上市日期
 * @returns
 */
const crawl: ListCrawler = async (debug = false): Promise<StockBase[]> => {
  const all = []
  // 爬取第一页
  const r = await crawlOnePage(1, debug)
  // 解析数据
  all.push(...r.data.map(({ agdm, agjc }: DataItem) => ({ code: agdm, name: polishingName(agjc) } as StockBase)))

  // 递归爬取其余页
  // 实测深交所对密集请求很快就会被封掉无法成功，需要约10分钟后才会回复
  for (let pageNo = 2; pageNo <= r.metadata.pagecount; pageNo++) {
    // 暂停一下再爬取否则会被秒封
    await delay(51)

    let r
    try {
      // 发出请求
      r = await crawlOnePage(pageNo, debug)
    } catch (_e) {
      // 出错后暂停 500 ms 再试一次
      await delay(500)
      r = await crawlOnePage(pageNo, debug)
    }
    // 解析数据
    if (r) {
      all.push(...r.data.map(({ agdm, agjc }: DataItem) => ({ code: agdm, name: polishingName(agjc) } as StockBase)))
    }
  }

  // console.log(`total=${r.metadata.recordcount}`)
  return all
}

export default crawl
