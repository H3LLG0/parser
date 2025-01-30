const puppeteer = require('puppeteer');
const fs = require('fs');
const csv = require('csv-stringify');
const url = 'https://www.muztorg.ru/category/elektrogitary';

(async () => {
    console.log('парсинг начался (ждать придется долго :/)')
    let start = performance.now();
    const browser = await puppeteer.launch({headless:false});
    const page = await browser.newPage();
    await page.goto(url);
    let Number_of_pages = 10; //можно распарсить все страницы, но это долго очень
    // await page.evaluate(() => {
    //     let number = document.querySelector('._last > a').innerText;
    //     return number;
    // })
    for(let i=1; i<=Number_of_pages; i++) {
        await page.goto(url+`?page=${i}`)
        let ArrayLinks = await page.evaluate(() => {
            let link = Array.from(document.querySelectorAll('.catalog-card__name'), el => el.href);
            return link;
        })
        let products__array = Array(ArrayLinks.length);
        for(let j = 0; j<ArrayLinks.length; j++) {
            await page.goto(ArrayLinks[j]);
            let product = await page.evaluate(()=> {
                let characteristics = Array.from(document.querySelectorAll('.mt-product-info__list > div > span'), el => el.innerText)
                let product_data = {
                    naming: document.querySelector('.title-1').innerText,
                    img: document.querySelector('.mt-product-gallery__image > img').src,
                    frets: characteristics[0],
                    strings: characteristics[1],
                    picups: characteristics[2],
                    neckMount: characteristics[3],
                    guitarNeck: characteristics[4],
                    deck: characteristics[5],
                }
                return product_data;
            })
            products__array[j] = product;
        }
        const dataCSV = products__array.reduce((acc, product) => {
            acc += `${product.naming}, ${product.img}, ${product.frets}, ${product.strings}, ${product.picups}, ${product.neckMount}, ${product.guitarNeck}, ${product.deck},\n`;
            return acc;
          }, 
        );
        fs.appendFileSync('parse-result.csv', dataCSV, 'utf-8')
    }
    browser.close();
    let end = performance.now();
    let time = end - start;
    console.log('Время парсинга = ' + time) + 'мс';

})()