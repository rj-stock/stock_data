// 股票数据器接口定义

import { KPeriod, LatestKData, StockBase, StockKData, StockTimeData } from "../types.ts"

/**
 * 爬取的额外配置参数。
 *
 * - start 和 end 都忽略爬取默认 K 线数
 * - start=-2 和 end=-1(或无end) 查最后交易日
 * - start=-10 爬取最近 9 根 K 线
 */
export type CrawlInit = {
  /** 设置为 true 一般用于将响应的 body 保存到文件方便自查核对 */
  debug?: boolean
  /** K线查询的起始索引号，上市第一天的索引为 0，负数代表反向位置(最后交易日为 -2) */
  start?: number
  /** K线查询的结束索引号(不含)，上市第一天的索引为 0，负数代表反向位置(最后交易日为 -2) */
  end?: number
}

/** 爬取股票的 K 线数据集 */
export type KCrawler = (code: string, period: KPeriod, init?: CrawlInit) => Promise<StockKData>

/** 爬取股票最后交易日的分时数据 */
export type TimeCrawler = (code: string, debug?: boolean) => Promise<StockTimeData>

/** 爬取股票最后一个周期的 K 数据 */
export type LatestKCrawler = (code: string, period?: KPeriod, init?: { debug?: boolean }) => Promise<LatestKData>

/** 爬取所有股票列表 */
export type ListCrawler = (debug?: boolean) => Promise<StockBase[]>
