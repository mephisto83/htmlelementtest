import * as path from 'path';
import * as puppeteer from 'puppeteer';
import { isJsxOpeningElement, isParameter, isTypeNode } from 'typescript';
import { HTMLPaneUpdate, VisualElement, PaneProperties, } from './visual-element';
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var util = require('util');

function createPanelProperties(): PaneProperties {
    return {
        x_loc: 0,
        y_loc: 0,
        z_loc: 2000,
        x_rot: 0,
        y_rot: 0,
        z_rot: 0,
        x_scale: 1,
        y_scale: 1,
        z_scale: 1
    }
}
export default class WebCutter {

    static browser: puppeteer.Browser | null = null;
    static currentPage: puppeteer.Page | null = null;
    static async go(url: string) {
        if (!this.browser) {
            this.browser = await puppeteer.launch({ headless: false });
        }
        if (!this.currentPage) {
            this.currentPage = await this.browser.newPage();
            await this.setViewPortSize(this.currentPage);
        }
        await this.currentPage.goto(url);

    }
    static async setViewPortSize(page: puppeteer.Page, options?: { width: number, height: number }) {
        await page.setViewport({
            width: options ? options.width : 800,
            height: options ? options.height : 700,
            deviceScaleFactor: 1,
        });
    }
    static async takeScreenShotElement(id: string, folder: string): Promise<string> {
        return this.screenShotElement(this.currentPage, id, folder);
    }
    static async singlePane(): Promise<HTMLPaneUpdate> {
        if (!this.currentPage) {
            throw new Error('no current page');
        }

        return this.buildSinglePane(this.currentPage);
    }
    static async buildSinglePane(page: puppeteer.Page): Promise<HTMLPaneUpdate> {
        let pane: HTMLPaneUpdate = {
            elements: [],
            id: newGuid(),
            panelProperties: createPanelProperties()
        }
        let size = await page.evaluate(() => {
            let body = document.querySelector('body');

            return {
                height: body.getBoundingClientRect().height,
                width: body.getBoundingClientRect().width
            }
        });
        let bodyId = newGuid();
        let body = await this.fullScreen(page, bodyId, 'output');
        let visualElemenets = await this.findVisualElements(page);


        pane.elements.push({
            id: bodyId,
            type: 'image',
            properties: {
                src: body,
                height: size.height,
                width: size.width,
                backgroundColor: {
                    a: 0,
                    r: 0,
                    g: 0,
                    b: 0
                },
                color: {
                    a: 0,
                    r: 0,
                    g: 0,
                    b: 0
                },
                depth: 0,
                left: 0,
                top: 0,
                areas: []
            }
        })
        return pane;
    }
    static async buildPane(visualElements: VisualElement[]): Promise<HTMLPaneUpdate> {
        let pane: HTMLPaneUpdate = {
            elements: [],
            id: newGuid(),
            panelProperties: createPanelProperties()
        }
        for (let i = 0; i < visualElements.length; i++) {
            let item = visualElements[i];
            let src = await this.takeScreenShotElement(item.id, 'output');
            pane.elements.push({
                id: item.id,
                type: 'image',
                properties: {
                    height: item.dimensions.height,
                    width: item.dimensions.width,
                    depth: item.depth,
                    left: item.dimensions.left,
                    backgroundColor: { a: 0, b: 0, g: 0, r: 0 },
                    color: { a: 0, b: 0, g: 0, r: 0 },
                    top: item.dimensions.top,
                    src: src,
                    areas: []
                }
            })
        }
        return pane;
    }
    static async screenShotElement(page: puppeteer.Page, id: string, folder: string): Promise<string> {
        await page.waitForSelector(`[data-visual-id="${id}"]`);
        let element = await page.$(`[data-visual-id="${id}"]`);
        await element.screenshot({ path: path.join(folder, `${id}.png`) })

        return path.resolve(path.join(folder, `${id}.png`));
    }
    static async fullScreen(page: puppeteer.Page, id: string, folder: string): Promise<string> {
        await page.waitForSelector(`body`);
        let element = await page.$(`body`);
        await element.screenshot({ path: path.join(folder, `${id}.png`) })

        return path.resolve(path.join(folder, `${id}.png`));
    }

    static async findVisualElements(page: puppeteer.Page) {
        const res: VisualElement[] = await page.evaluate(() => {
            function getDepth(el) {
                let count = 0;
                do {
                    let index = el.style.zIndex;
                    if (index) {
                        try {
                            index = index.split('').filter(v => `0123456789`.indexOf(v) === -1).join('');
                            count += parseInt(index);
                        } catch (e) {

                        }
                    }
                    el = el.parentElement;
                    count++;
                } while (el);

                return count;
            }
            function newGuid() {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    var r = Math.random() * 16 | 0,
                        v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            }
            document.body.parentElement.style.overflow = 'hidden'
            let allElements = document.querySelectorAll('*');
            let imagebased = ['background-image'];
            let styleProps = ['background-color', 'border-color', 'border-left-color'].concat(imagebased);
            let allCssProps = ['border-width', 'border-bottom-width', 'border-top-width', 'border-right-width', 'border-left-width'].concat(styleProps);
            let results = [];
            for (var i = 0; i < allElements.length; i++) {

                var para = allElements[i];
                if (para.nodeName === 'BODY') {
                    continue;
                }
                let computedStyle = window.getComputedStyle(para);
                let isVisual = styleProps.some((value) => {
                    let val = computedStyle.getPropertyValue(value);
                    console.log(`${value}:  ${val}`)
                    switch (value) {
                        case 'background-image':
                            return val !== 'none' && val;
                        case 'background-color':
                            return val !== 'rgba(0, 0, 0, 0)' && val;
                        case 'border-left-color':
                        case 'border-right-color':
                        case 'border-top-color':
                        case 'border-bottom-color':
                        case 'border-color':
                            let width = computedStyle.getPropertyValue(
                                'border-width'
                            )
                            console.log(`border-width ${width}`)
                            return val !== 'rgba(0, 0, 0, 0)' && width !== '' && width !== '0px' && val;
                    }
                    console.log('no match');
                    return false;
                }) || para.nodeName === "IMG";
                let isText = false;
                let temp_dimensions = para.getBoundingClientRect();
                let dimensions = {
                    x: temp_dimensions.x,
                    y: temp_dimensions.y,
                    bottom: temp_dimensions.bottom,
                    height: temp_dimensions.height,
                    left: temp_dimensions.left,
                    right: temp_dimensions.right,
                    top: temp_dimensions.top,
                    width: temp_dimensions.width
                }
                if (para.children) {
                    isText = true;
                    for (var j = 0; j < para.children.length; j++) {
                        let not = false;
                        let jchild = para.children[j];
                        if (!['BR'].some(v => v === jchild.nodeName)) {
                            not = true;
                            isText = false;
                        }
                        if (not) {
                            break;
                        }
                    }
                    if (isText) {
                        isText = !!para.innerHTML;
                    }
                    if (isText) {
                        para.classList.add('has-visual-style');
                        let dataId = newGuid();
                        if (!para.hasAttribute('data-visual-id')) {
                            para.setAttribute('data-visual-id', dataId)
                        }
                        else {
                            dataId = para.getAttribute('data-visual-id');
                        }
                        results.push({
                            id: dataId,
                            nodeType: para.nodeName,
                            type: 'text',
                            depth: getDepth(para),
                            dimensions,
                            text: para.innerHTML,
                            cssProps: ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'box-sizing', 'color', 'display',
                                'margin-block-end', 'margin-block-start', 'padding-bottom', 'text-size-adjust', 'text-align', 'text-transform',
                            ].filter((value) => {
                                return !!computedStyle.getPropertyValue(value)
                            }).map((value) => {
                                return {
                                    name: value,
                                    value: computedStyle.getPropertyValue(value)
                                }
                            })
                        })
                    }
                }
                console.log(`check is visual ${isVisual}`)
                console.log(`${para.nodeName}`)
                if (isVisual) {
                    para.classList.add('has-visual-style');
                    let dataId = newGuid();
                    if (!para.hasAttribute('data-visual-id')) {
                        para.setAttribute('data-visual-id', dataId)
                    }
                    else {
                        dataId = para.getAttribute('data-visual-id');
                    }
                    if (styleProps.some((value) => {
                        let val = computedStyle.getPropertyValue(value);
                        console.log(`[[${value}:  ${val} ${!!computedStyle.getPropertyValue(value)}]]`)
                        return !!computedStyle.getPropertyValue(value)
                    }) || para.nodeName === "IMG") {
                        results.push({
                            id: dataId,
                            type: 'image',
                            nodeType: para.nodeName,
                            depth: getDepth(para),
                            dimensions,
                            cssProps: allCssProps.filter((value) => {
                                return !!computedStyle.getPropertyValue(value)
                            }).map((value) => {
                                return {
                                    name: value,
                                    value: computedStyle.getPropertyValue(value)
                                }
                            })
                        })
                    }
                }
            }
            return results;
        })
        return res.filter(v => v.dimensions.width && v.dimensions.height);
    }
    static async currentVisualElements() {
        if (!this.currentPage) {
            throw new Error('no current page set')
        }
        return await this.findVisualElements(this.currentPage);
    }
    static async stop() {
        if (this.browser) {
            await this.browser.close();

        }
        this.browser = null;
    }
    static clients: any[] = [];
    static async startServer(callback: any) {
        let me = this;
        io.on('connection', function (socket: any) {
            me.clients.push(socket.id);
            var clientConnectedMsg = 'User connected ' + util.inspect(socket.id) + ', total: ' + me.clients.length;
            console.log(clientConnectedMsg);
            socket.on('disconnect', function () {
                me.clients.pop();
                var clientDisconnectedMsg = 'User disconnected ' + util.inspect(socket.id) + ', total: ' + me.clients.length;
                console.log(clientDisconnectedMsg);
            })

            setTimeout(() => {
                callback(io);
            }, 5000);
        });
        http.listen(3000, function () {
            console.log('listening on *:3000');
        });
    }
}


function newGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}