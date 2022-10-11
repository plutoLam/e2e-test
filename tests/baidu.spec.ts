/**
 * @file PC首页-搜索历史
 * @author plutoLam
 */


import { test, Browser, Page, chromium, ElementHandle, expect } from '@playwright/test';

import { login, createHis, openHis, checkHis, checkHisQuery, confirmSetting, openHisRecord } from '../utils/common';

let page: Page;
let browser: Browser;

test.beforeAll(async () => {
  browser = await chromium.launch({
    headless: false
  });
  const context = await browser.newContext();
  page = await context.newPage();
});

test('搜索历史测试', async () => {
  const indexUrl = 'https://www.baidu.com/'
  await page.goto(indexUrl);


  await login(page)
  await openHisRecord(page);
  await createHis(page, 5);
  await page.goto(indexUrl);
  await openHis(page);

  expect(await checkHis(page)).toBe(true);
  expect(await checkHisQuery(page)).toBe(true);

  // 关闭历史按钮
  const closeHisBtn = await page.$('.setup_storeSug') as ElementHandle;
  expect(closeHisBtn).toBeTruthy();



  // 关闭历史
  await closeHisBtn.click();
  // 等待设置框出现
  await page.waitForSelector('.pfpanel-bd');
  const closeBtn = await page.$('#sh_2') as ElementHandle;
  await closeBtn.click();
  await confirmSetting(page);
  await openHis(page);
  expect(await checkHis(page)).toBe(false);
  await openHisRecord(page);

  // 点击更多历史去个人中心
  await openHis(page);
  await page.waitForTimeout(3000);
  // 更多历史按钮
  const moreHisBtn = await page.$('.more_storeSug') as ElementHandle;
  expect(moreHisBtn).toBeTruthy();

  // 不能跳多页面，goto到href
  const href = await moreHisBtn.getAttribute('href') ?? '';
  expect(href).toBeTruthy();
  await page.goto(href);

  await page.waitForLoadState();

  // 拿到今天最后一条记录
  const historyBox = await page.$('div[class^="history-box"]') as ElementHandle;
  const historyBoxLi = await historyBox.$('ul>li') as ElementHandle;

  // 删除记录
  await historyBoxLi.hover();
  const deleteBtn = await historyBoxLi.$('i') as ElementHandle;
  await deleteBtn.click();
  await page.waitForResponse(response => response.url().indexOf('/data/usrdelete') !== -1 && response.status() === 200);

  // 回到首页
  await page.goto(indexUrl);

  await openHis(page);

  // 删除历史按钮
  const deleteHisBtn = await page.$('.del_all_storeSug') as ElementHandle;
  expect(deleteHisBtn).toBeTruthy();
  await deleteHisBtn.click();
  await page.waitForResponse(response => response.url().indexOf('data/usrclear') !== -1 && response.status() === 200);
});

test.afterAll(async () => {
  await browser.close();
});

