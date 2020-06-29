const puppeteer = require('puppeteer');
const fs = require('fs');

function run () {
    return new Promise(async (resolve, reject) => {
        try {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            
            //default value
            var appLink = 'https://play.google.com/store/apps/details?id=nic.goi.aarogyasetu&hl=en_US';

            if(process.argv.length > 2){
                appLink = process.argv[2];  //extract url from command line
            }

            await page.goto(appLink + "&showAllReviews=true"); 
            await page.setViewport({width: 1920, height: 1080});
            
            //select sort option to newest comments (to show them in chronological order)
            await page.click('div.ry3kXd', {delay: 100});
            await page.keyboard.press('ArrowUp', {delay: 100});
            await page.keyboard.press('ArrowUp', {delay: 100});
            await page.keyboard.press('Enter', {delay: 100});

            const hop_delay = 1500;
            const max_Hops = 1000;
            const max_no_progress_attempt = 5;

            var scrlheight = -1;
            var pageCount = 0;
            var page_height = 0;
            var no_progress_attempt = 0;
            
            
            var urls = '';
            
            while( pageCount <= max_Hops && no_progress_attempt < max_no_progress_attempt){
                
                page.waitFor(100);

                if(scrlheight == page_height){
                    no_progress_attempt++;
                }

                scrlheight = page_height;

                urls = await page.evaluate(() => {
                    
                    var showMorebutton = document.querySelectorAll(".RveJvd");

                    // if "show more" button is displayed, invoke click
                    if(showMorebutton && showMorebutton.length > 0 && showMorebutton[0].innerText === "SHOW MORE"){
                        showMorebutton[0].click();  //click on show more button
                    }
                    else{
                        window.scrollTo(0,document.body.scrollHeight);      //infinity scroll
                    }
                });
                
                //add delay for additional data load
                await page.waitFor(hop_delay);
                
                // get new page height
                var bodyHeight = await page.evaluateHandle(() => document.body.scrollHeight);
                page_height = await bodyHeight.jsonValue();
                
                pageCount++;

                //extract data
                var csvContent = await page.evaluate(() => {
                    
                    //collate count of records processed
                    if(window.processedItems == undefined) window.processedItems = 0;

                    var lstLblNames = document.querySelectorAll(".kx8XBd > .X43Kjb");
                    var lstDates = document.querySelectorAll(".kx8XBd > div > .p2TkOb");
                    var lstComments = document.querySelectorAll(".bAhLNe > .UD7Dzf > span:first-child");
                    var lstRatings = document.querySelectorAll(".kx8XBd > div > .nt2C1d > .pf5lIe > div");
                
                    let csvContent = ""; 
                    
                    //restart work from last batch
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

                if(csvContent.length > 0){
                    //write file for each hop to save intermediate work
                    
                    fs.writeFile('playreviews' + pageCount + '.csv', csvContent, function(err) {
                        if(err){
                            console.log('----- error while writing extract file. error = ' + err);
                        }
                    });
                }
            }

            // show informative message if process exited due to no more content
            if(no_progress_attempt >= max_no_progress_attempt){
                console.log('Exiting as no more page loads available');
            }

            browser.close();
            return resolve(urls);
        } catch (e) {
            return reject(e);
        }
    })
}
run().then(console.log).catch(console.error);