import { test, expect, Page, Browser, ElementHandle } from '@playwright/test';
import { USERNAME, PWD } from './login'

export async function login(page: Page) {
	// 获取登录按钮
	const loginButton = await page.$('#s-top-loginbtn') as ElementHandle;
	// 点击
	await loginButton.click();

	// 等待登录框出现
	await page.waitForSelector('.tang-body')

	// 获取表单
	const form = await page.$('.pass-form.pass-form-normal') as ElementHandle;
	const useNameInput = await form.$('.pass-text-input-userName') as ElementHandle;
	await useNameInput.click();
	// 输入账号
	await page.keyboard.type(USERNAME);

	const pwdInput = await form.$('.pass-text-input-password') as ElementHandle;
	await pwdInput.click();
	await page.keyboard.type(PWD);

	const sumitButton = await form.$('.pass-form-item-submit') as ElementHandle;
	await sumitButton.click();

	// 等待页面稳定无网络请求
	await page.waitForLoadState('networkidle');
}

/**
 * 获取url上指定的query
 *
 * @param {string} url url
 * @param {string} variable query的key值
 */
export function getQueryVariable(url: string, variable: string) {
	var query = url.slice(url.indexOf('?'), url.length);
	var vars = query.split('&');
	for (var i = 0; i < vars.length; i++) {
		var pair = vars[i].split('=');
		if (pair[0] === variable) {
			return pair[1];
		}
	}
	return null;
}

/**
 * 检测his是否存在
 *
 * @param {Page} page page对象
 * @return {Boolean} his是否存在，true为存在，false为不存在
 */
export async function checkHis(page: Page) {
	const form = await page.$('#form') as ElementHandle;
	const his = await form.$('.bdsug') as ElementHandle;
	if (!his) return false;
	const res = await page.evaluate(() => {
		const his = document.querySelector('.bdsug') as Element;
		return window.getComputedStyle(his);
	});
	return res.display === 'block';
}

/**
 * 检测his中的query是否对齐
 *
 * @param {Page} page page对象
 */
export async function checkHisQuery(page: Page) {
	const form = await page.$('#form') as ElementHandle;
	const his = await form.$('.bdsug') as ElementHandle;

	// 监控his的li是否重叠
	// 取出所有的li
	const hisList = await his.$$('ul>li') as ElementHandle[];
	const liBoundingBox = [];
	for (const li of hisList) {
		const obj = await li.boundingBox();
		liBoundingBox.push(obj?.y);
	}

	// 去重
	const hisListSet = new Set(liBoundingBox);

	// 没有重复的y值
	return hisListSet.size === liBoundingBox.length;
}

/**
 * 创造历史记录
 *
 * @param {Page} page page对象
 * @param {number} count 历史记录条数
 */
export async function createHis(page: Page, count: number) {
	for (let i = 0; i < count; i++) {
		const searchBox = await page.waitForSelector('#kw') as ElementHandle;
		await searchBox.click();
		await page.keyboard.type("test");
		// 等待http请求的response
		await page.waitForResponse(response => response.url().indexOf('/sugrec') !== -1 && response.status() === 200);
		const searchBtn = await page.$('.s_btn_wr');

		// 设置点击位置
		await searchBtn?.click({
			position: {
				x: 10,
				y: 10
			}
		});

		// 等待请求完成
		await page.waitForResponse(response => response.url().indexOf('pc/pcsearch') !== -1 && response.status() === 200);
	}
}

/**
 * 打开his
 *
 * @param {Page} page page对象
 */
export async function openHis(page: Page) {
	const searchBox2 = await page.$('#kw') as ElementHandle;
	const box = await searchBox2.boundingBox();
	if (box) {
		await page.mouse.click(box.x + 10, box.y + 10);
	}

	// @ts-ignore
	for (const item of Array(5)) {
		await page.waitForTimeout(500);
		const res = await page.evaluate(() => {
			const his: Element | null = document.querySelector('.bdsug');
			if (his === null) {
				return -1;
			}
			return window.getComputedStyle(his);
		});
		if (res === -1 || res.display === 'block') {
			return;
		}
	}
}

/**
 * 在搜索设置中打开历史记录
 *
 * @param {Page} page page对象
 */
export async function openHisRecord(page: Page) {
	const setting = await page.$('#s-usersetting-top') as ElementHandle;
	await setting.hover();
	const searchSetting = await page.$('.setpref') as ElementHandle;
	await searchSetting.click();
	await page.waitForSelector('.pfpanel-bd');

	// 开启历史
	const displayBtn = await page.$('#sh_1') as ElementHandle;
	await displayBtn.click();
	await confirmSetting(page);
}

/**
 * 在搜索设置中确认
 *
 * @param {Page} page page对象
 */
export async function confirmSetting(page: Page) {
	const confirm = await page.$('.prefpanelgo') as ElementHandle;
	await confirm.click();
	await page.keyboard.down('Enter');

	// 等待设置框消失
	await page.waitForFunction(selector => !document.querySelector(selector), '.pfpanel-bd');

	// 等待刷新完成
	await page.waitForResponse(response => response.url().indexOf('/sugrec?prod=pc_hi') != -1 && response.status() === 200);
}

/**
 * 获取PC主页或结果页右上角设置中tts的状态
 *
 * @param {Page} page page对象
 * @return {number} 1为未打开，2为打开，3为错误
 */
export async function getTtsStatus(page: Page) {
	const res: number = await page.evaluate(() => {
		const openBtn = document.querySelector('.set-open-result-tts') as Element;
		const closeBtn = document.querySelector('.set-close-result-tts') as Element;
		const style1 = window.getComputedStyle(openBtn);
		const style2 = window.getComputedStyle(closeBtn);
		const text1 = document.querySelector('.set-open-result-tts>.set')?.innerHTML;
		const text2 = document.querySelector('.set-close-result-tts>.set')?.innerHTML;
		if (style1.display === 'inline-block' && style2.display === 'none' && text1 === '开启播报' && text2 === '关闭播报') {
			return 1;
		} else if (style1.display === 'none' && style2.display === 'inline-block' && text1 === '开启播报' && text2 === '关闭播报') {
			return 2;
		} else {
			return 3;
		}
	});
	return res;
}