/**
 * Render the beneficiary_service_detail page
 */

'use strict';


var locale = odkCommon.getPreferredLocale();
var customResultSet;

// Note that the call to open this detail view will be for the custom beneficiary entity table so that
// pressing the edit button in the top right will open the appropriate form.
function display() {
    var exclusionList = [];

    return new Promise( function(resolve, reject) {
        // retrieve custom row data
        odkData.getViewData(resolve, reject);
    }).then( function(result) {
        var keyValuePairs = {};
        var resultSets = [result];

        util.populateDetailViewArbitrary(resultSets, keyValuePairs, "field_list", locale, exclusionList);
    }).catch( function(reason) {
        console.log('failed with message: ' + reason);
    })
}
