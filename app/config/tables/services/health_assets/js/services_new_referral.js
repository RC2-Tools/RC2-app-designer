'use strict';

var LOG_TAG = 'referral list: '

var locale = odkCommon.getPreferredLocale();

var referralActionTypeValue = 1264;

var idxStart = -1;
var servicesResultSet = {};

var servicesCBSuccess = function(result) {
  servicesResultSet = result;
  displayGroup(idxStart);
};

var servicesCBFailure = function(error) {
  console.log('services_list servicesCBFailure: ' + error);
};

var display = function() {
      odkCommon.registerListener(function() {
        actionCallback();
    });
    actionCallback();
  
  resumeFn(0);

  document
    .getElementById('addReferralDone')
    .addEventListener('click', function () {
      odkCommon.closeWindow();
    });
};

var actionCallback = function() {
    var action = odkCommon.viewFirstQueuedAction();
    console.log('E', LOG_TAG + 'Referral callback entered with action: ' + action);

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

    var actionType = dispatchStr[util.actionTypeKey];
    switch (actionType) {
        case referralActionTypeValue:
            finishCustomReferral(action, dispatchStr);
            odkCommon.removeFirstQueuedAction();
            break;
        default:
            console.log('E', LOG_TAG + "Error: unrecognized action type in callback");
    }
};

var finishCustomReferral = function(action, dispatchStr) {
/*     dataUtil.validateCustomTableEntry(action, dispatchStr, "beneficiary_service", util.beneficiaryServicesTable)
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
      }) */
	  
	   // TODO: new util for non-error popup
      util.displayConfirm('Referral Created', function () {
        console.log('E', LOG_TAG + "successful creation");
      });
};

/**
 * Called when page loads to display things (Nothing to edit here)
 */
var resumeFn = function(fIdxStart) {
  odkData.getViewData(servicesCBSuccess, servicesCBFailure);

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

  var beneficiaryEntityRowId = util.getQueryParameter('beneficiaryEntityRowId');

  /* Number of rows displayed per 'chunk' - can modify this value */
  var chunk = 50;
  for (var i = idxStart; i < idxStart + chunk; i++) {
    if (i >= servicesResultSet.getCount()) {
      break;
    }

    let serviceName = servicesResultSet.getData(i, 'name');
	let referralFormId = servicesResultSet.getData(i, 'referral_form_id');

	console.log('E', LOG_TAG + "Referral: " + serviceName + " Referral Form: " + referralFormId);
	if(referralFormId == null || referralFormId == "") {
		console.log('E', LOG_TAG + "Referral has no custom form");
		listViewUtil.addListItem(
			serviceName,
		newReferralOnClick(servicesResultSet.getRowId(i), serviceName, beneficiaryEntityRowId),
		null,
		null 
		)
	} else {
		console.log('E', LOG_TAG + "Referral HAS a custom form");
	  listViewUtil.addListItem(
		serviceName,
		newReferralWithCustomForm(servicesResultSet, i, beneficiaryEntityRowId),
		null,
		null 
		)
	}
  }
  if (i < servicesResultSet.getCount()) {
    setTimeout(resumeFn, 0, i);
  }
};

var newReferralOnClick = function (serviceRowId, serviceName, beneficiaryEntityRowId) {
  // TODO: pass in custom form info

  var viewQuery = '?serviceRowId=' + encodeURIComponent(serviceRowId) +
    '&beneficiaryEntityRowId=' + encodeURIComponent(beneficiaryEntityRowId) +
    '&serviceName=' + encodeURIComponent(serviceName);

  return function () {
    odkTables.launchHTML(
      null,
      util.resolveViewPath('referrals', 'notes', health_util.moduleDir) + viewQuery
    )
  }
};

var newReferralWithCustomForm = function (servicesResultSet, index, beneficiaryEntityId) {
	return function() {
		return health_util.triggerCustomReferral(servicesResultSet, index, beneficiaryEntityId, referralActionTypeValue, {});
	};
};
	

