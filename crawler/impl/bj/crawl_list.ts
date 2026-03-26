/**
 * 获取北交所全部股票列表。
 *
 * 来源：
 * 1. 打开北京证券交易所主页，然后点击“产品/股票列表” https://www.bse.cn/nq/listedcompany.html
 * 2. 页面会发出获取股票列表的 jsonp 请求(post)
 *    https://www.bse.cn/nqxxController/nqxxCnzq.do?callback=jQuery331_1691398089201
 *    这个请求会返回最近20条的股票列表信息(含上市日期、行业、股本)，jsonp 的值为长度为 1 数组，
 *    这个数组元素 0 的值的格式为：
 *    ```json
 *      {
 *        firstPage: true,
 *        lastPage: false,
 *        number: 0,
 *        numberOfElements: 20, // 当前返回的条目数
 *        size: 20,             // 页容量
 *        sort: null,
 *        totalElements: 210,   // 总条目数
 *        totalPages: 11,       // 总页数
 *        content:[
 *          {
 *            "xxzqdm": "430017",       // 代码
 *            "xxzqjc": "星昊医药",     // 简称
 *            "fxssrq": "20230531",     // 上市日期
 *            "xxzgb": 122577200,       // 总股本（股）
 *            "xxfxsgb": 63055240,      // 流通股本（股）
 *            "xxhyzl": "医药制造业",   // 所属行业
 *            "xxssdq": "北京市",       // 地区
 *            ...
 *          },
 *          ...
 *        ],
 *      },
 *      ...
 *    ]
 *    ```
 *    在页面下方可以点击进行前后分页，使用 POST FormData 的方式提交页码参数 page，格式为：
 *    application/x-www-form-urlencoded; charset=UTF-8
 *    “page=2&typejb=T&xxfcbj%5B%5D=2&xxzqdm=&sortfield=xxzqdm&sorttype=asc”
 *    实际测试改为 get 请求，将参数附加到 url 后也是可以的，如：
 *    https://www.bse.cn/nqxxController/nqxxCnzq.do?callback=jQuery&typejb=T&xxfcbj[]=2&page=1
 *    page 是从 0 开始的。
 * @module
 */
import { ListCrawler } from "../../crawler.ts"
import { StockBase } from "../../../types.ts"
import { delay, parseJsonp, pathExistsSync } from "../../../deps.ts"
import { writeTextFile } from "../_internal.ts"
type ResponseItem = {
  // 每页容量
  size: number
  // 当前页码
  number: number
  // 当前返回的条目数
  numberOfElements: number
  // 总页数
  totalPages: number
  // 总条目数
  totalElements: number
  // 标的列表
  content: [DataItem]
}
type DataItem = {
  // 代码
  xxzqdm: string
  // 简称
  xxzqjc: string
  // 上市日期
  fxssrq: string
  // 总股本（股）
  xxzgb: number
  // 流通股本（股）
  xxfxsgb: number
  // 所属行业
  xxhyzl: string
  // 地区
  xxssdq: string
}

/**
 * 爬取指定页的标的列表数据。
 *
 * 4开头的股票是从主板退到三板的股票、8开头的股票是没上市过的，挂牌在三板交易的股票
 */
async function crawlOnePage(pageNo: number, debug = false): Promise<ResponseItem> {
  let url = `https://www.bse.cn/nqxxController/nqxxCnzq.do?callback=jQuery331_${Date.now()}`
  url += "&typejb=T&xxfcbj[]=2"
  url += `&page=${pageNo - 1}`
  // console.log(`page ${pageNo}, url=${url}`)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`从北交所获取 page ${pageNo} 股票清单失败：${response.status} ${response.statusText}`)
  }

  const txt = await response.text()
  if (debug) {
    await writeTextFile(`temp/bj/bj-list-res-page${pageNo}.js`, txt)
  }
  const j = parseJsonp(txt) as [ResponseItem]
  if (j.length !== 1 || !j[0].numberOfElements) throw new Error("从北交所获取 page ${pageNo} 股票清单失败")
  return j[0]
}

/**
 * 获取全部股票列表
 * @param debug 是否将响应的 body 保存到 temp/bj-list-res.js 文件
 * @returns
 */
const crawl: ListCrawler = async (debug = false): Promise<StockBase[]> => {
  const all = []
  // 爬取第一页
  const r = await crawlOnePage(1, debug)
  // 解析数据
  all.push(...r.content.map(({ xxzqdm, xxzqjc }: DataItem) => ({ code: xxzqdm, name: xxzqjc } as StockBase)))

  // 递归爬取其余页
  for (let pageNo = 2; pageNo <= r.totalPages; pageNo++) {
    // 暂停一下再爬取背面封
    // await delay(51)

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
      all.push(...r.content.map(({ xxzqdm, xxzqjc }: DataItem) => ({ code: xxzqdm, name: xxzqjc } as StockBase)))
    }
  }

  // console.log(`total=${r.totalElements}`)
  return all
}

export default crawl
