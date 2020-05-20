// The script is expected to fill the table with the latest close and 5 day changes of desired stocks. Then markdown text will be provided based on script. 
let table = base.getTable("Stocks");
let nameField = table.getField("Name");
let closeField = table.getField("Last close");
let changeField = table.getField("Change");
let result = await table.selectRecordsAsync();
//Empty Array for future use to gather stock tickers.
let tickers = [];

// loop through result.records, get ticker value in each row x Field: 'Name'. Push those values to new array. 
for (let record of result.records) {
    let stockTicker = record.getCellValue(nameField)
    tickers.push(stockTicker);
};
//Will give us length of Array for future use in script
let length = tickers.length;

//Loop through each ticker in the tickers array and fetch api information for that ticker. Add the newly acquired data into the tickers array in the correct spot.
for (let i = 0; i < length; i++){
    //Fetching the data from api with the 6 most recent trading day info.
    let apiResponse = await fetch('https://financialmodelingprep.com/api/v3/historical-price-full/'+tickers[i]+'?timeseries=6')
    .then(res => res.json())
    .then(data => tickers[i] = data);
};
//Create three empty Arrays where we will push information within the upcoming loop.
let finalNumbers = [];
let symbols = [];
let closePrice = [];

// Loop through each ticker in the tickers array. Gather necessary information from the nested Array called 'historical' and perform calculations to ...
//Get all the info needed for the markdown output later. Then update the close field for each record.
for (let i = 0; i < length; i++){
    let getClose = (tickers[i].historical[0].close);
    //push the close price amount to the closePrice array.
    closePrice.push(getClose);
    //Grab symbol info
    let getSymbol = (tickers[i].symbol);
    symbols.push(getSymbol);
    let fiveAgoClose = (tickers[i].historical[5].close);
    // Will use the (Y2-Y1)/Y1 formula, need to get numerator value for easy calculations.
    let numerator = (getClose - fiveAgoClose);
    let percentChange = (numerator/fiveAgoClose);
    let roundedNum = Number(percentChange.toFixed(4));
    //Push the new rounded numbers for percent change to the finalNumbers array.
    finalNumbers.push(roundedNum);
    let recordId = result.records[i].id
    //loop through each record and update the cell values within the Last close field.
    await table.updateRecordAsync(recordId,{
        "Last close": closePrice[i],
    });
};
//loop through each record and update the cell values within the Change Field
for (let i = 0; i < length; i++){
    let recordId = result.records[i].id
    await table.updateRecordAsync(recordId, {
        "Change": finalNumbers[i],
    });
};

//Math.max does not take the greatest difference from 0, rather the number that is greatest in magnitude is computed. Created this variable for future comparison.
var relativeMaxValue = Math.max.apply(null, finalNumbers);

// Get absolute max value of the array finalNumbers, will use the realtiveMaxValue and absMaxValue for logic in Markdown statement
var absMaxValue = Math.max.apply(null, finalNumbers.map(Math.abs)) * 100;
// For Edge case safety we will convert the absMaxValue to a number again.
var maxValue = Number(absMaxValue);

//Fresh grab of all the table records with the newly added information.
let query = await table.selectRecordsAsync()

// Loop through each record within the table. Find the 'Stock ticker' of the record for the biggest % change in the past 5 days. Then..
// Assign largest stock move in past 5 days to 'biggest name' given various possible table situations.
for (let record of query.records) {
    var changeValue = record.getCellValue("Change");
    var flippedAmount = Math.abs(changeValue) * 100;
    var adjFlippedAmount = Number(flippedAmount.toFixed(2));

    //Seeing if the gathered 'changeValue' is equivalent to maxValue upfront.
    //If the adjFlippedAmount is equivalent to maxValue it is because the symbol with the largest change was negative (down). 
    if (changeValue == maxValue){
        var biggestName = record.getCellValue("Name")
    } else if (adjFlippedAmount == maxValue) {
        var biggestName = record.getCellValue("Name")
    } else {
        var biggestName = 'ERROR, run again!'
    };
};

//Markdown Text with the amount of records updated and Biggest change ticker/amount.
output.markdown('Updated ' + length + ' records.');

//Logic to find if the biggest change was actually up or down. Next take the result and incoporate into markdown.
if (relativeMaxValue == absMaxValue) {
    output.markdown('Biggest Change: $' + biggestName + ' is up ' + maxValue + '%.')
} else if (relativeMaxValue < absMaxValue) {
    output.markdown('Biggest Change: $' + biggestName+ ' is down ' + maxValue + '%.')
} else {
    output.markdown('Biggest Change: $' + biggestName + ' is up ' + maxValue + '%.')
};