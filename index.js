const cheerio = require("cheerio");
const axios = require("axios");
const fs = require('fs');
const url = 'https://www.muztorg.ru/category/elektrogitary';

async function getProductLinks(NumberOfPage) {
    const productLinks =[];
    for(let i=1; i<=NumberOfPage; i++) {
        const axiosCategoryPage = await axios.request({
            method: "GET",
            url: url+`?page=${i}`,
        })
        const categoryPage = cheerio.load(axiosCategoryPage.data);
        categoryPage('.catalog-card')
        .find('.catalog-card__link')
        .each((index, element) => {
            const productURL = 'https://www.muztorg.ru/' + categoryPage(element).attr("href") + '?view_tab=characteristics';
            productLinks.push(productURL)
       })
    }
    return productLinks;
}

async function getProductCharacteristicTitle() {
    const titles = ['URL', 'наименование', 'цена', 'изображение'];
    const axiosProductPage = await axios.request({
        method: "GET",
        url: 'https://www.muztorg.ru/produ%D1%81t/A121655?view_tab=characteristics',
    })
    const productPage = cheerio.load(axiosProductPage.data);
    productPage('.mt-product-characteristics__title')
        .find('div')
        .each((index, element) => {
            titles.push(productPage(element).text().replaceAll('\n', '').trim())
        })
        const filteredArray = titles.filter(function(el) {
            return el != '';
          });
    return filteredArray;
}

async function getProductCharacteristics(productLinks) {
    const title = await getProductCharacteristicTitle()
    const product = [];
    product.push(title)
    for(let i=0; i<productLinks.length; i++) {
        const axiosProductPage = await axios.request({
            method: "GET",
            url: productLinks[i],
        })
        const productPage = cheerio.load(axiosProductPage.data);
        const productInfo = [
            productLinks[i],
            productPage('.mt-product-head__column').find('.title-1').text(),
            productPage('.product-header-price__default-value').text(),
            productPage('.mt-product-gallery__thumbnail').find('img').attr('src'),
        ]
        productPage('.mt-product-characteristics__item')
        .find('.mt-product-characteristics__value')
        .each((index, element) => {
            productInfo.push(productPage(element).text().replaceAll('\n', '').trim())
        })
        product.push(productInfo);
    }
    return product;
}

(async () => {
    const NumberOfPage = 1;
    const productLinks = await getProductLinks(NumberOfPage);
    const productsArray = await getProductCharacteristics(productLinks)
    const productCSV = productsArray
        .map(product => product.join(', '))
        .join('\n')
    fs.appendFileSync('parse-result.csv', productCSV, 'utf-8')
})()