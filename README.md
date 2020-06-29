# Google Play - App Reviews Extractor (playappreviewsextractor)
Extract reviews for given google play app. Key features:
1. Automatically handles infinity scoll and "show more" links to load additional comments
2. Generate a file for each page load, to ensure optimum memory usage
3. uses puppeteer to use headless chrome to extract data faser


## Context
Read full details at my blog: https://www.vermanshul.com/2020/06/tool-google-play-comments-extractor.html

## Setup
1. Install NodeJS on your machine (download and install from https://nodejs.org/en/download/)
2. Install puppeteer on your machine (Refer installation steps from https://github.com/puppeteer/puppeteer) 
3. Download tool from https://github.com/toanshulverma/playappreviewsextractor (you can just download the file titled playappreviewsextractor.js)

## Usage
1. Open app page from google play website
2. Copy url from browser (to be used in step 4)
3. Navigate to folder where tool (step 3 in Setup above) is downloaded
4. Run following command (app url is parameterized)
node playappreviewsextractor <GOOGLE PLAY APP URL>

For example,

node playappreviewsextractor "https://play.google.com/store/apps/details?id=com.cynoteck.kidsFun2Write"

5. Run following command to merge app CSV files into one CSV file

(Windows)
        copy *.csv userreviews.csv 

          (Linux/ Mac)
        cat *.csv > userreviews.csv 

## Note:
1. I'm sure it can be further optimized to run faster, but I wanted to keep addition buffer for page reloads, to ensure as page gets larger (the app I had to use had around 1M reviews).
2. This can certainly be optimized for memory, as it seems to be eating RAM as new pages get loaded. I did extract each page as separate file, to help reduce memory consumption, but there can be additional improvements
3. A lot of CSS tags are hardcoded to identify right components. This may be impacted, as an when Google changes app code to use new tags