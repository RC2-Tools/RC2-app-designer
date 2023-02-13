/**
 * This is the file that will be creating the list view.
 */

'use strict';
var LOG_TAG = 'services_list: ';

var locale = odkCommon.getPreferredLocale();
var idxStart = -1;
var servicesResultSet = {};


/**
 * Use chunked list view for larger tables: We want to chunk the displays so
 * that there is less load time.
 */

/**
 * Called when page loads to display things (Nothing to edit here)
 */
var referralsListCBSuccess = function(result) {
    servicesResultSet = result;
    displayGroup(idxStart);
};

var referralsListCBFailure = function(error) {
    console.log('services_all_referrals referralsListCBFailure: ' + error);
};

var display = function() {
    odkCommon.registerListener(function() {
        actionCallback();
    });
    actionCallback();

    resumeFn(0);
};

var actionCallback = function() {
    var action = odkCommon.viewFirstQueuedAction();
    console.log('E', LOG_TAG + 'callback entered with action: ' + action);

    if (action === null || action === undefined) {
        // The queue is empty
        return;
    }

    var dispatchStr = JSON.parse(action.dispatchStruct);
    if (dispatchStr === null || dispatchStr === undefined) {
        console.log('E', LOG_TAG + 'Error: missing dispatch struct');
        odkCommon.removeFirstQueuedAction();
        return;
    }

};

/**
 * Called when page loads to display things (Nothing to edit here)
 */
var resumeFn = function(fIdxStart) {
    odkData.getViewData(referralsListCBSuccess, referralsListCBFailure);

    idxStart = fIdxStart;
    console.log('resumeFn called. idxStart: ' + idxStart);
};

/**
 * Displays the list view in chunks or groups. Number of list entries per chunk
 * can be modified. The list view is designed so that each row in the table is
 * represented as a list item. If you touch a particular list item, it will
 * expand with more details (that you choose to include). Clicking on this
 * expanded portion will take you to the more detailed view.
 */
var displayGroup = function(idxStart) {
    console.log('displayGroup called. idxStart: ' + idxStart);

    /* If the list comes back empty, inform the user */
    if (servicesResultSet.getCount() === 0) {
        $('#title').addClass('d-none');
        $('#error').removeClass('d-none');
    } else {
        $('#title').removeClass('d-none');
        $('#error').addClass('d-none');
    }

	var rcId = util.getQueryParameter('rcId');

    var isBeneficiarySpecificList = !!util.getQueryParameter('rcId');

    if (isBeneficiarySpecificList) {
        $('#deliveryServiceTabs').removeClass('d-none');
    } else {
        $('#deliveryServiceTabs').addClass('d-none');
    }

    /* Number of rows displayed per 'chunk' - can modify this value */
    var chunk = 50;
    for (var i = idxStart; i < idxStart + chunk; i++) {
        if (i >= servicesResultSet.getCount()) {
            break;
        }

        var serviceName = servicesResultSet.getData(i, 'name');
		var referralRowId = servicesResultSet.getData(i,'referral_row_id');
        console.log('Service: '+ serviceName + ' rowId: ' + referralRowId);
        listViewUtil.addListItem(serviceName,referralListOnClick(referralRowId, rcId));
    }
    if (i < servicesResultSet.getCount()) {
        setTimeout(resumeFn, 0, i);
    }
};

var referralListOnClick = function (referralRowId, rcId) {
    return function () {
		console.log('clicked: ' + referralRowId);
        var viewQuery = '?rcId=' + encodeURIComponent(rcId) +
				'&referralRowId=' + encodeURIComponent(referralRowId);

		odkTables.openDetailView(
			null,
			'referrals',
			referralRowId,
			'config/tables/referrals/health_assets/html/referrals_notes.html' + viewQuery
		);
    }
};



