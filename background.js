const GBP_TO_EUR_RATE = 'gbp_to_eur_rate';
const DATE_LAST_RETRIEVED = 'date_rate_last_retrieved';

function todayAsString() {
    var todayDate = new Date();
    return todayDate.getDate() + '/' + todayDate.getMonth() + '/' + todayDate.getFullYear();
}

/**
 * Fetch the latest GBP to EUR exchange rate by issuing a GET request to
 * http://download.finance.yahoo.com
 *
 * @param callback Function If the response from fetching url has a
 *     HTTP status of 200, this function is called with a JSON decoded
 *     response. Otherwise, this function is called with null.
 */
function fetchExchangeRate(callback) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(data) {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                console.log('xhr.responseText - ' + xhr.responseText);
                var rate = parseFloat(xhr.responseText.replace(/[\r\n]/g, ""));
                console.log('parsed rate - ' + rate);
                // The amount added to rate below is to account for a
                // difference between the GBP to EURO rate retrieved from
                // Yahoo and the one Amazon will use. It's not exact but
                // reflects an average markup Amazon applies to the open
                // market rate
                rate = rate + 0.04;
                gbpToEurRate = rate;
                localStorage.setItem(GBP_TO_EUR_RATE, rate.toString());
                localStorage.setItem(DATE_LAST_RETRIEVED, todayAsString());
                callback(gbpToEurRate);
            } else {
                callback(null);
            }
        }
    }

    var url = 'http://download.finance.yahoo.com/d/quotes.csv?s=GBPEUR=X&f=l1&e=.csv';
    xhr.open('GET', url, true);
    xhr.send();
};

/**
 * Handles data sent via chrome.extension.sendRequest().
 * @param request Object Data sent in the request.
 * @param sender Object Origin of the request.
 * @param callback Function The method to call when the request completes.
 */
function onMessage(message, sender, callback) {
    if (message == 'fetchExchangeRate') {
        var gbpToEurRate = localStorage.getItem(GBP_TO_EUR_RATE);
        var dateRateLastRetrieved = localStorage.getItem(DATE_LAST_RETRIEVED);
        if (gbpToEurRate == null || dateRateLastRetrieved != todayAsString()) {
            fetchExchangeRate(callback);
        } else {
            callback(gbpToEurRate);
        }
    }
};

// Wire up the listener
chrome.runtime.onMessage.addListener(onMessage);
