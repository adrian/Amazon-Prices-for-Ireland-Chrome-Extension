(function() {
    const IRISH_VAT_RATE = 0.21;
    const UK_VAT_RATE = 0.20;
    
    function getNode(xpath) {
        var xpath_result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);    
        return xpath_result.singleNodeValue;
    }

    // Determine if the product listed on the current page is a book
    // This is done by searching for a node with the text "ISBN:"
    function isBook() {
        var elems = document.getElementsByTagName("b");
        var j = 0;
        var k = 0;
        var isBook = false;
    
        while (!isBook && j < elems.length) {
            var price = elems[j];
            k = 0;
            while (!isBook && k < price.childNodes.length) {
                var currNode = price.childNodes[k];
                if (currNode.nodeType == 3) {
                    if (currNode.nodeValue == "ISBN-10:") {
                        isBook = true;
                    }
                }
                k++;
            }
            j++;
        }
    
        return isBook;
    }

    // Return a string containing the Irish price
    function calculateIrishPrice(gbpPrice, gbpToEurRate) {
    
        var irishVatRate = IRISH_VAT_RATE;
        var ukVatRate = UK_VAT_RATE;
        // Amazon add on about .03% for something else.
        // Waste management charge perhaps (http://www.weeeregister.ie)?
        var extraCharge = 0.03;
    
        // Books don't have VAT
        if (isBook()) {
            irishVatRate = 0;
            ukVatRate = 0;
            extraCharge = 0;
        }
    
        console.log("Using the Irish VAT rate: " + irishVatRate);
        console.log("Using the UK VAT rate: " + ukVatRate);
        console.log("Using the \"extraCharge\" rate: " + extraCharge);
        console.log("Using the GBP to EUR FX rate: " + gbpToEurRate);
        console.log("Using the GBP Price: " + gbpPrice);
    
        var gbpExVATPrice = gbpPrice * (1 - ukVatRate);
        var euroPrice = gbpExVATPrice * gbpToEurRate;
        var irishPrice = euroPrice * ((1 + irishVatRate) + extraCharge);
    
        return irishPrice.toFixed(2);
    }
    
    function updatePageWithIrishPrice(gbpToEurRate) {
        if (gbpToEurRate != null) {
            // Find the GBP price
            var gbpPriceNode = getNode("//tbody/tr/td/b[@class='priceLarge']");
            if (gbpPriceNode != null) {
                // strip off the pound sign and comma
                var priceInGBP = parseFloat(gbpPriceNode.innerHTML.replace(/\u00A3/, "").replace(/,/, ""));
                console.log("priceInGBP: " + priceInGBP);

                // Get the ex-VAT price, convert to EUR and add on the irish VAT
                var irishPrice = calculateIrishPrice(priceInGBP, gbpToEurRate);
                console.log("irishPrice: " + irishPrice);

                // Get the TBODY node under which we're going to put a new TR with the irish price
                // This node is 3 levels up from the GBP price node
                var pricingTBodyNode = gbpPriceNode.parentNode.parentNode.parentNode;

                // Get the TR containing the GBP price. We're going to clone this node
                var gbpPriceTRNode = gbpPriceNode.parentNode.parentNode;

                // Create a new TR, populate it with the Irish price and add it to the TBODY
                var irishPriceNode = gbpPriceTRNode.cloneNode(true);
                irishPriceNode.cells[0].innerHTML = "Irish Price:";
                irishPriceNode.cells[1].innerHTML = "<b class=\"priceLarge\">\u20ac" + irishPrice + "</b> approximately. " + shippingMessage(priceInGBP);
                pricingTBodyNode.appendChild(irishPriceNode);
            } else {
                console.log("Couldn't find the price node");
            }
        } else {
            console.log("Problem retrieving exchange rate");
        }
    }
    
    function shippingMessage(priceInGBP) {
        message = "";
        if (priceInGBP >= 25) {
            message = "May be eligible for free delivery with <a href=\"http://www.amazon.co.uk/gp/help/customer/display.html/?nodeId=200355380\"><b>Super Saver Delivery</b></a>.";
        } else {
            message = "Not including <a href=\"http://www.amazon.co.uk/gp/help/customer/display.html?ie=UTF8&nodeId=200395880\">shipping</a>.";
        }
        return message;
    }

    // Send a message back to the extenstion to retrieve the latest GBP to EUR exchange rate    
    chrome.extension.sendRequest({'action' : 'fetchExchangeRate'}, updatePageWithIrishPrice);
})();
