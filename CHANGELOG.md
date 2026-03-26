# Today Stock Changelog

## 0.10.0 2026-03-26

- 增加同花顺板块代码支持
- 修正 debug 状态缺少 temp 目录导致的保存失败问题

## 0.9.2 2023-08-06

- Remove log url

## 0.9.1 2023-08-06

- 修正导出 crawlKFromJys 函数的错误

## 0.8.0 2023-08-06

- 增加股票市场标的数量统计例子
  > deno run --allow-net https://deno.land/x/stock_data/example/stock_stat.ts

## 0.7.0 2023-08-07

- 实现从上交所、深交所和北交所网站爬取所有股票列表和 K 线数据
- 增加从小熊同学 API 获取全部股票列表的实现

## 0.6.0 2023-04-20

- 修正 crawl_today_repeat 的 -c 参数自动解析为数字的错误
  > 会将 `-c 000123` 解析为数字 `123` 导致代码被缩短的错误

## 0.5.0 2023-04-20

- 修正 crawl_today_repeat 的参数帮助信息

## 0.4.0 2023-04-20

- crawl_today_repeat 运行时自动创建临时文件夹 temp

## 0.3.0 2023-04-20

- 修正 crawl_today_repeat 处理异常的错误
- 同花顺最后一根K线数据的循环抓取优化

## 0.2.0 2023-04-19

- 实现从同花顺爬取期货数据，相关方法统一在 `crawler/impl/ths/mod.ts` 中导出了

  | Function Name       | Remark                                |
  | ------------------- | ------------------------------------- |
  | `crawlAllK`         | 爬取所有 K 线数据，但没有成交金额     |
  | `crawlLast3600K`    | 爬取最后 3600 条 K 线数据，有成交金额 |
  | `crawlLast360K`     | 爬取最后 360 条 K 线数据，有成交金额  |
  | `crawlTodayAllTime` | 爬取最后交易日的所有分时数据          |
  | `crawlTodayLatestK` | 爬取最后交易日的最后那条 K 线的数据   |

- 添加循环爬取最后交易日的最后那条 K 线的数据的 CLI
  - 参数帮助：`-c 指定代码 -p 指定周期(day、week、month、year、minute1、minute5、minute30、minute60) -t 指定间隔秒数`
  ```shell
  deno run -A ./crawler/impl/ths/crawl_today_repeat.ts -c FG9999 -p minute1 -s 5
  ```
  > 代表每隔5秒抓取一次玻璃主连的最后 1 分钟数据

## 0.1.0 2023-04-16

- 实现从同花顺爬取股票数据
