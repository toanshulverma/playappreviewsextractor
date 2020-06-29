const puppeteer = require('puppeteer');
const fs = require('fs');

function run () {
    return new Promise(async (resolve, reject) => {
        try {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            //console.log('----process.argv[0] = ' + process.argv[0]);
            //var path = process.argv[0];

            /*
            var sanitizeString_local = function (desc) {
                var itemDesc;
                if (desc) {
                    itemDesc = desc.replace(/(\r\n|\n|\r|\s+|\t|&nbsp;)/gm,' ');
                    itemDesc = itemDesc.replace(/,/g, '');
                    itemDesc = itemDesc.replace(/"/g, '""');
                    itemDesc = itemDesc.replace(/'/g, '\'');
                    itemDesc = itemDesc.replace(/ +(?= )/g,'');
                } else {
                    itemDesc = '';
                }
                return itemDesc;
            }
            */

            //await page.exposeFunction('sanitizeString', val => val.replace(/(\r\n|\n|\r|\s+|\t|&nbsp;)/gm,' ').replace(/,/g, '').replace(/"/g, '""').replace(/"/g, '""').replace(/'/g, '\'').replace(/ +(?= )/g,''));
            
            await page.goto("https://play.google.com/store/apps/details?id=nic.goi.aarogyasetu&hl=en_US&showAllReviews=true");
            await page.setViewport({width: 1920, height: 1080});
            
            //select sort option to newest comments (to show them in chronological order)
            await page.click('div.ry3kXd', {delay: 100});
            await page.keyboard.press('ArrowUp', {delay: 100});
            await page.keyboard.press('ArrowUp', {delay: 100});
            await page.keyboard.press('Enter', {delay: 100});

            //take screenshot
            //await page.screenshot({path: 'sample.png'});

            var scrlheight = -1;
            var count = 0;
            var hop_delay = 1500;
            var max_Hops = 1000;
            var page_height = 0;
            
            var urls = '';
            // scrlheight < page_height &&
            
            while( count < max_Hops){
                
                console.log('---(' + count + ')------ scrlheight = ' + scrlheight);
                console.log('---(' + count + ')------  page_height = ' + page_height);
                page.waitFor(100);
                scrlheight = page_height;

                urls = await page.evaluate(() => {
                    
                    //var test= 'is function avilable = ' + (window.loadAllComments !== undefined);
                    //loadAllComments();
                    //return test;
                    var showMorebutton = document.querySelectorAll(".RveJvd");
                    if(showMorebutton && showMorebutton.length > 0 && showMorebutton[0].innerText === "SHOW MORE"){
                        showMorebutton[0].click();  //click on show more button
                    }
                    else{
                        window.scrollTo(0,document.body.scrollHeight);      //infinity scroll
                    }
                });

                await page.waitFor(hop_delay);
                
                // get new page height
                var bodyHeight = await page.evaluateHandle(() => document.body.scrollHeight);
                page_height = await bodyHeight.jsonValue();
                
                count++;

                //extract data
                var csvContent = await page.evaluate(() => {
                    
                    if(window.processedItems == undefined) window.processedItems = 0;

                    var lstLblNames = document.querySelectorAll(".kx8XBd > .X43Kjb");
                    var lstDates = document.querySelectorAll(".kx8XBd > div > .p2TkOb");
                    var lstComments = document.querySelectorAll(".bAhLNe > .UD7Dzf > span:first-child");
                    var lstRatings = document.querySelectorAll(".kx8XBd > div > .nt2C1d > .pf5lIe > div");
                
                    let csvContent = ""; 
                
                    for(var i = window.processedItems; i < lstLblNames.length; i++){
                        /*csvContent += sanitizeString(lstLblNames[i].innerText) + "," 
                                        + lstRatings[i].querySelectorAll(".vQHuPe").length + "," 
                                        + sanitizeString(lstDates[i].innerText) + "," 
                                        + sanitizeString(lstComments[i].innerText) + "\r\n";*/

                        var valName = lstLblNames[i].innerText.replace(/(\r\n|\n|\r|\s+|\t|&nbsp;)/gm,' ').replace(/,/g, '').replace(/"/g, '""').replace(/"/g, '""').replace(/'/g, '\'').replace(/ +(?= )/g,'');
                        var valDate = lstDates[i].innerText.replace(/(\r\n|\n|\r|\s+|\t|&nbsp;)/gm,' ').replace(/,/g, '').replace(/"/g, '""').replace(/"/g, '""').replace(/'/g, '\'').replace(/ +(?= )/g,'');
                        var valComments = lstComments[i].innerText.replace(/(\r\n|\n|\r|\s+|\t|&nbsp;)/gm,' ').replace(/,/g, '').replace(/"/g, '""').replace(/"/g, '""').replace(/'/g, '\'').replace(/ +(?= )/g,'');

                        csvContent += valName + ","
                        + lstRatings[i].querySelectorAll(".vQHuPe").length + "," 
                        + valDate + "," 
                        + valComments + "\r\n";

                        window.processedItems++;
                    }
                    
                    return csvContent;
                });

                fs.writeFile('playreviews' + count + '.csv', csvContent, function(err) {
                    if(err){
                        console.log('----- error while writing extract file. error = ' + err);
                    }
                });
            }

            console.log('---(' + count + ')------ scrlheight = ' + scrlheight);
            console.log('---(' + count + ')------  page_height = ' + page_height);

            

            // await page.screenshot({path: 'sample.png', fullPage : true});

            browser.close();
            return resolve(urls);
        } catch (e) {
            return reject(e);
        }
    })
}
run().then(console.log).catch(console.error);