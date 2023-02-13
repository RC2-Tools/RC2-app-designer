/**
 * Render the choose method page
 */
'use strict';

var actionBarcode = 0;
var actionRegistration = 1;
var actionLaunch = 2;
var actionSearchRcId = 3;

var htmlFileNameValue = "delivery_start";
var userActionValue = "launchBarcode";

var barcodeSessionVariable = "barcodeVal";
var rcIdSessionVariable = "rcIdVal";

var myTimeoutVal = null;
var locale = odkCommon.getPreferredLocale();
var type = util.getQueryParameter('type');
var code;
var userKey = "user";
var defaultGroupKey = "defaultGroup";

function doActionZxing() {
    var dispatchStruct = JSON.stringify({
        [util.actionTypeKey]: actionBarcode,
        htmlPath: htmlFileNameValue,
        userAction: userActionValue
    });

    odkCommon.doAction(dispatchStruct, 'com.google.zxing.client.android.SCAN', null);
}

function populateChooseUser() {
    var rolesPromise = new Promise(function(resolve, reject) {
        odkData.getRoles(resolve, reject);
    });

    var defaultGroupPromise = new Promise(function(resolve, reject) {
        odkData.getDefaultGroup(resolve, reject);
    });

    return Promise.all([rolesPromise, defaultGroupPromise, populateSyncList()]).then(function(resultArray) {
        var roles = resultArray[0].getRoles();
        var filteredRoles = _.filter(roles, function (s) {
            return s.substring(0, 5) === 'GROUP';
        });
        var defaultGroupVal = odkCommon.getSessionVariable(defaultGroupKey) || resultArray[1].getDefaultGroup();
        odkCommon.setSessionVariable(defaultGroupKey, defaultGroupVal);

        var superUser = $.inArray('ROLE_SUPER_USER_TABLES', roles) > -1;
        if (superUser && filteredRoles.length > 0) {
			var selectgroup = document.getElementById('choose_user');
			selectgroup.style.visibility = 'visible';
            return util.renderSuperuserFeatures(function () {
                var chooseUserSelect = $('#choose_user');

                filteredRoles.forEach(function (item) {
                    chooseUserSelect.append($("<option/>").attr("value", item).text(item));
                });

                var regBtns = $('.menu-item > button');

                if (defaultGroupVal !== null && defaultGroupVal !== undefined && defaultGroupVal !== "" && filteredRoles.includes(defaultGroupVal)) {
                    chooseUserSelect.val(defaultGroupVal);
                } else {
                    regBtns.prop("disabled", true);
                }

                chooseUserSelect.on('change', function() {
                    if (chooseUserSelect.prop('selectedIndex') === 0) {
                        regBtns.prop("disabled", true);
                    } else {
                        odkCommon.setSessionVariable(defaultGroupKey, chooseUserSelect.val());
                        regBtns.prop("disabled", false);
                    }
                });
            });
        } else {
			var selectgroup = document.getElementById('choose_user');
			selectgroup.style.visibility = 'hidden';
            return Promise.resolve();
        }
    }, function(err) {
        console.log('promise failure with error: ' + err);
    })
}

function populateSyncList() {
    console.log('entered registration sync path');

    var newMergedEntities = $('#newSinceSyncCount');
    var newBeneficiaryEntitiesPromise = new Promise( function(resolve, reject) {
        odkData.arbitraryQuery(util.beneficiaryEntityTable, 'SELECT count(*) AS total FROM ' +
          util.beneficiaryEntityTable + ' WHERE _sync_state = ?', ['new_row'],
          null, null, resolve, reject);
    });

    var updatedMergedEntities = $('#editedSinceSyncCount');
    var updatedBeneficiaryEntitiesPromise = new Promise( function(resolve, reject) {
        odkData.arbitraryQuery(util.beneficiaryEntityTable, 'SELECT count(*) AS total FROM ' +
          util.beneficiaryEntityTable + ' WHERE _sync_state = ? OR _sync_state = ?',
          ['changed', 'in_conflict'], null, null, resolve, reject);
    });

    if (util.getRegistrationMode() === 'INDIVIDUAL') {
        return Promise.all([newBeneficiaryEntitiesPromise, updatedBeneficiaryEntitiesPromise]).then( function(resultArr) {
            newMergedEntities.text(odkCommon.localizeText(locale, 'new_since_sync') + ': ' + resultArr[0].get('total'));
            updatedMergedEntities.text(odkCommon.localizeText(locale, 'edited_since_sync') + ': ' + resultArr[1].get('total'));
        });
    } else {
        var newMembersPromise = new Promise( function(resolve, reject) {
            odkData.arbitraryQuery(util.membersTable, 'SELECT count(*) AS total FROM ' +
              util.membersTable + ' WHERE _sync_state = ?', ['new_row'],
              null, null, resolve, reject);
        });

        var updatedMembersPromise = new Promise( function(resolve, reject) {
            odkData.arbitraryQuery(util.membersTable, 'SELECT count(*) AS total FROM ' +
              util.membersTable + ' WHERE _sync_state = ? OR _sync_state = ?',
              ['changed', 'in_conflict'], null, null, resolve, reject);
        });

        return Promise.all([newBeneficiaryEntitiesPromise,
            updatedBeneficiaryEntitiesPromise,
            newMembersPromise,
            updatedMembersPromise]).then( function(resultArr) {
            newMergedEntities.text(odkCommon.localizeText(locale, 'new_hh_mem_since_sync') + ': '
              + resultArr[0].get('total') + ' [' + resultArr[2].get('total') + ']');
            updatedMergedEntities.text(odkCommon.localizeText(locale, 'edited_hh_mem_since_sync') + ': '
              + resultArr[1].get('total') + ' [' + resultArr[3].get('total') + ']');
        });
    }
}

function callBackFn () {
    var action = odkCommon.viewFirstQueuedAction();
    console.log('callback entered with action: ' + action);

    if (action === null || action === undefined) {
        // The queue is empty
        return;
    }

    var dispatchStr = JSON.parse(action.dispatchStruct);
    if (dispatchStr === null || dispatchStr === undefined) {
        console.log('Error: missing dispatch struct');
        odkCommon.removeFirstQueuedAction();
        return;
    }

    var actionType = dispatchStr[util.actionTypeKey];
    console.log('callBackFn: actionType: ' + actionType);

    if (actionType === actionBarcode) {
        handleBarcodeCallback(action, dispatchStr);
    } else {
        handleCallback(action, dispatchStr);
    }

    odkCommon.removeFirstQueuedAction();
}

function handleBarcodeCallback(action, dispatchStr) {
    console.log("Barcode action occured");

    var actionStr = dispatchStr["userAction"];
    if (actionStr === null || actionStr === undefined ||
        !(actionStr === userActionValue)) {
        console.log('Error: missing or incorrect action string' + actionStr);
        return;
    }

    var htmlPath = dispatchStr["htmlPath"];
    if (htmlPath === null || htmlPath === undefined ||
        !(htmlPath === htmlFileNameValue)) {
        console.log('Error: missing or incorrect htmlPath string' + htmlPath);
        return;
    }

    console.log("callBackFn: action: " + actionStr + " htmlPath: " + htmlPath);

    if (action.jsonValue.status === -1) {
        clearTimeout(myTimeoutVal);
        var scanned = action.jsonValue.result.SCAN_RESULT;
        $('#code').val(scanned);
        odkCommon.setSessionVariable(barcodeSessionVariable, scanned);
        queryChain(scanned);
    }
}

function queryChain(passed_code) {
    code = passed_code;
    if (code === null || code === undefined || code === "") {
        util.displayError(odkCommon.localizeText(locale, "enter_beneficiary_entity_id"));
        return;
    }

    queryChainDownstream(passed_code);
}

function clearSessionVars() {
    odkCommon.setSessionVariable(barcodeSessionVariable, null);
    odkCommon.setSessionVariable(rcIdSessionVariable, null);
}
