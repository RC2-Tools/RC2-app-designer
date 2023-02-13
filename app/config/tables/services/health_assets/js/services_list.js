/**
 * This is the file that will be creating the list view.
 */

'use strict';
var LOG_TAG = 'services_list: ';

var locale = odkCommon.getPreferredLocale();

var idxStart = -1;
var servicesResultSet = {};
var serviceActionTypeValue = 556;
var actionTypeKey = "actionTypeKey";
var rcId = null;

/**
 * Use chunked list view for larger tables: We want to chunk the displays so
 * that there is less load time.
 */

/**
 * Called when page loads to display things (Nothing to edit here)
 */
var deliveriesCBSuccess = function(result) {
    servicesResultSet = result;
    displayGroup(idxStart);
};

var deliveriesCBFailure = function(error) {

    console.log('services_list deliveriesCBFailure: ' + error);
};

/**
 * Called when updating referral if services was based on referral
 */
var referralDBUpdateSuccess = function(result) {
    console.log('services_list referralDBUpdateSuccess: ' + result);
    
};

var referralDBUpdateFailure = function(error) {
    console.error('services_list referralDBUpdateFailure: ' + error);
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

    var actionType = dispatchStr[actionTypeKey];
    switch (actionType) {
        case serviceActionTypeValue:
            finishCustomBeneficiaryService(action, dispatchStr);
            odkCommon.removeFirstQueuedAction();
            break;
        default:
            console.log('E', LOG_TAG + "Error: unrecognized action type in callback");
    }
};

var finishCustomBeneficiaryService = function(action, dispatchStr) {
    dataUtil.validateCustomTableEntry(action, dispatchStr, "beneficiary_service", util.beneficiaryServicesTable)
      .then(function (result) {
	     console.log('services_list launch complete handle referrals ' + result);
     
          if (result) {
			  var referralRowId = dispatchStr['referralRowId']
			  console.log('ReferralRowId ' + referralRowId);
			  if (!(referralRowId === null || referralRowId === undefined)){
				console.log('Updating Referal Row');
				var updateStruct = {
					status: 'COMPLETE'
				}
				odkData.updateRow('referrals',updateStruct,referralRowId,referralDBUpdateSuccess,referralDBUpdateFailure);
			  }
              if (dispatchStr['endWithReferrals'] === true) {
		   	    console.log('services_list launch new referrals ');
                launchNewReferralsScreen();
              }
          }
      })
      .catch(function (e) {
          console.log(e);
      })
};

/**
 * Called when page loads to display things (Nothing to edit here)
 */
var resumeFn = function(fIdxStart) {
    odkData.getViewData(deliveriesCBSuccess, deliveriesCBFailure);

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

        if (isBeneficiarySpecificList) {

            listViewUtil.addListItem(
                serviceName,
                serviceListOnClick(servicesResultSet, i)
              );

        } else {
            
        }
    }
    if (i < servicesResultSet.getCount()) {
        setTimeout(resumeFn, 0, i);
    }
};

var serviceListOnClick = function (servicesResultSet, index) {
    return function () {
        return health_util.triggerService(servicesResultSet, index, util.getQueryParameter('beneficiaryEntityRowId'), serviceActionTypeValue, {});
    }
};

var openServiceDetailViewOnClick = function (customServiceTableId, customServiceFormId, serviceRowId, rcId) {
    var viewQuery = '?rcId=' + encodeURIComponent(rcId) +
      '&tableId=' + encodeURIComponent(customServiceTableId) +
      '&formId=' + encodeURIComponent(customServiceFormId) +
      '&rowId=' + encodeURIComponent(serviceRowId);

    return function () {
        odkTables.openDetailView(
          null,
          customServiceTableId,
          serviceRowId,
          health_util.resolveViewPath(util.servicesTable, 'detail') + viewQuery
        )
    }
}

function launchNewReferralsScreen() {
    var viewQuery = '?beneficiaryEntityRowId=' + encodeURIComponent(util.getQueryParameter('beneficiaryEntityRowId'));

    odkTables.openTableToListView(
      null,
      'services',
      null,
      null,
      util.resolveViewPath('services', 'new_referral', health_util.moduleDir) + viewQuery
    );
}
