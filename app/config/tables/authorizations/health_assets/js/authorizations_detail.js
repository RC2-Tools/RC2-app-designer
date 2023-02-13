'use strict';

var locale = odkCommon.getPreferredLocale();

var display = function() {
    console.log('rending authorization detail view');
	var displayPromise = new Promise( function(resolve, reject) {
	    odkData.getViewData(resolve, reject);
    }).then( function(result) {
        util.populateDetailView(result, "field_list", locale, []);
    });

	displayPromise.catch( function(error) {
        console.log('display failure with error: ' + error);
    });

	return displayPromise;
};
