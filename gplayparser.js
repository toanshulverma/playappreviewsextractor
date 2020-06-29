var scrlheight = 0;
var count = 0;
var hop_delay = 500;
var max_Hops = 10;

window.sanitizeString = function (desc) {
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



function generateCSV(){
    var lstLblNames = document.querySelectorAll(".kx8XBd > .X43Kjb");
    var lstDates = document.querySelectorAll(".kx8XBd > div > .p2TkOb");
    var lstComments = document.querySelectorAll(".bAhLNe > .UD7Dzf > span:first-child");
    var lstRatings = document.querySelectorAll(".kx8XBd > div > .nt2C1d > .pf5lIe > div");

    let csvContent = ""; //"data:text/csv;charset=utf-8,\r\n";

    for(var i=0; i < lstLblNames.length; i++){
        csvContent += sanitizeString(lstLblNames[i].innerText) + "," 
                        + lstRatings[i].querySelectorAll(".vQHuPe").length + "," 
                        + sanitizeString(lstDates[i].innerText) + "," 
                        + sanitizeString(lstComments[i].innerText) + "\r\n";
    }
    console.log('--- ' + csvContent);
    
    return csvContent;
}

function downloadCSV(csvFile, filename){
    var blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, filename);
    } else {
        var link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}

function loadAllComments(){

    if(scrlheight < document.body.scrollHeight && count < max_Hops){
        var showMorebutton = document.querySelectorAll(".RveJvd");
        if(showMorebutton && showMorebutton.length > 0 && showMorebutton[0].innerText === "SHOW MORE"){
            showMorebutton[0].click();  //click on show more button
        }
        else{
            window.scrollTo(0,document.body.scrollHeight);      //infinity scroll
        }
        count++;
        setTimeout(loadAllComments, hop_delay);
    }
    else{
        //all comments loaded   
        var csvContent = generateCSV();
        //downloadCSV(csvContent, "app_comments.csv");
        console.log('--- calling generateCSV = ' + csvContent);
    }
}

//console.log('------  loaded');