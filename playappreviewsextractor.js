const puppeteer = require('puppeteer');
const fs = require('fs');

function run () {

    return new Promise(async (resolve, reject) => {
        
        try {

            var start = new Date()
            var hrstart = process.hrtime();
            
            const browser = await puppeteer.launch({ dumpio : false});
            const page = await browser.newPage();

            const hop_delay = 1000;
            const max_Hops = 10000;
            const max_no_progress_attempt = 5;

            var scrlheight = -1;
            var pageCount = 0;
            var page_height = 0;
            var no_progress_attempt = 0;
            
            //default value
            var appLink = 'https://play.google.com/store/apps/details?id=nic.goi.aarogyasetu&hl=en_US';

            if(process.argv.length > 2){
                appLink = process.argv[2];  //extract url from command line
            }

            await page.goto(appLink + "&showAllReviews=true"); 
            await page.setViewport({width: 1920, height: 1080});    //use desktop resolution
            
            //select sort option to newest comments (to show them in chronological order)
            await page.click('div.ry3kXd', {delay: 100});
            await page.keyboard.press('ArrowUp', {delay: 100});
            await page.keyboard.press('ArrowUp', {delay: 100});
            await page.keyboard.press('Enter', {delay: 100});

            
            while( pageCount <= max_Hops && no_progress_attempt < max_no_progress_attempt){
                
                //increment counter if no results retreived, else reset counter to 0
                no_progress_attempt = (scrlheight == page_height) ? (no_progress_attempt + 1) : 0;

                //console.log('---------- scrlheight  = ' + scrlheight);
                //console.log('---------- page_height = ' + page_height);

                //add delay for additional data load
                pageCount++;

                //extract data
                var csvContent = await page.evaluate(() => {
                    
                    var lstLblNames = document.querySelectorAll(".kx8XBd > .X43Kjb");
                    var lstDates = document.querySelectorAll(".kx8XBd > div > .p2TkOb");
                    var lstComments = document.querySelectorAll(".bAhLNe > .UD7Dzf > span:first-child");
                    var lstRatings = document.querySelectorAll(".kx8XBd > div > .nt2C1d > .pf5lIe > div");

                    let csvContent = ""; 
                    
                    //restart work from last batch
                    for(var i = 0; i < lstLblNames.length; i++){
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
                    }

                    // remove extracted (processed) nodes to save memory
                    document.querySelectorAll("[jsname=fk8dgd]").forEach( function(item){ item.innerHTML = '' });

                    return csvContent;
                });

                // get new page height (before reload of page)
                var bodyHeight = await page.evaluateHandle(() => document.body.scrollHeight);
                scrlheight = await bodyHeight.jsonValue();

                if(csvContent.length > 0){
                    //write file for each hop to save intermediate work
                    
                    fs.writeFile('playreviews' + pageCount + '.csv', csvContent, function(err) {
                        if(err){
                            console.log('----- error while writing extract file. error = ' + err);
                        }
                    });
                }

                await page.evaluate(() => {
                    
                    var showMorebutton = document.querySelectorAll(".RveJvd");

                    // if "show more" button is displayed, invoke click
                    if(showMorebutton && showMorebutton.length > 0 && showMorebutton[0].innerText === "SHOW MORE"){
                        showMorebutton[0].click();  //click on show more button
                    }
                    else{
                        // handle infinity scroll
                        window.scrollTo(0,0);                               // scroll to top
                        window.scrollTo(0,document.body.scrollHeight);      // scroll to bottom
                    }
                });

                await page.waitFor(hop_delay);

                // get new page height (after content reload)
                var bodyHeight = await page.evaluateHandle(() => document.body.scrollHeight);
                page_height = await bodyHeight.jsonValue();
            }

            // show informative message if process exited due to no more content
            if(no_progress_attempt >= max_no_progress_attempt){
                console.log('Exiting as no more page loads available');
            }

            // end browsing session
            browser.close();

            // calculate and display overall processing time
            var end = new Date() - start,
            hrend = process.hrtime(hrstart);
            console.info('Execution time: %dms', end)
            console.info('Execution time (hr): %ds %dms', hrend[0], hrend[1] / 1000000);
            

            return resolve();
        } catch (e) {
            return reject(e);
        }
    });
}
run().then(console.log).catch(console.error);