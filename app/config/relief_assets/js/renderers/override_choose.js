/**
 * Render the choose method page
 */
'use strict';

function display() {
    var barcodeVal = odkCommon.getSessionVariable(barcodeSessionVariable);
    if (barcodeVal !== null && barcodeVal !== undefined && barcodeVal !== "") {
        $('#code').val(barcodeVal);
    }

    $('#barcode').on('click', doActionZxing);

    $('#enter').on('click', function() {
        var val = $('#code').val();

        odkCommon.setSessionVariable(barcodeSessionVariable, val);
        queryChain(val);
    });

    var user = odkCommon.getActiveUser();
    odkCommon.setSessionVariable(userKey, user);
    console.log("Active User:" + user);

    myTimeoutVal = setTimeout(callBackFn, 1000);

    odkCommon.registerListener(callBackFn);

    // Call the registered callback in case the notification occurred before the page finished
    // loading
    callBackFn();
}

function handleCallback() {
    console.log("Error: unrecognized action type in callback");
}

function queryChainDownstream(passed_code) {
    if (type === 'override_beneficiary_entity_status') {
        beneficiaryEntityStatusFunction();
    } else if (type === 'override_ent_status') {
        entitlementStatusFunction();
    }
}

function beneficiaryEntityStatusFunction() {
    console.log('entered regoverride path');

    if (code !== "" && code !== undefined && code !== null) {
        odkData.query(util.beneficiaryEntityTable, 'beneficiary_entity_id = ?', [code],
                      null, null, null, null, null, null, true,
                      regOverrideBenSuccess, regOverrideBenFailure);
    }
}

function regOverrideBenSuccess(result) {
    if (result.getCount() === 1) {
        clearSessionVars();
        odkTables.openDetailView(null, util.getBeneficiaryEntityCustomFormId(), result.getData(0, 'custom_beneficiary_entity_row_id'),
            'config/tables/' + util.beneficiaryEntityTable + '/relief_assets/html/' + util.beneficiaryEntityTable + '_detail.html?type=' +
            encodeURIComponent(type) + '&rootRowId=' + encodeURIComponent(result.getRowId(0)));
    } else if (result.getCount() > 1) {
        clearSessionVars();
        odkTables.openTableToListView(null, util.beneficiaryEntityTable,
                                      'beneficiary_entity_id = ?',
                                      [code],
                                      'config/tables/' + util.beneficiaryEntityTable + '/relief_assets/html/' + util.beneficiaryEntityTable + '_list.html?type=' +
                                      encodeURIComponent(type));
    } else {
        util.displayError(odkCommon.localizeText(locale, "missing_beneficiary_notification"));
    }
}

function regOverrideBenFailure(error) {
    console.log('regOverrideFailure with error : ' + error)
}

function entitlementStatusFunction() {
    new Promise( function(resolve, reject) {
        odkData.query(util.beneficiaryEntityTable, 'beneficiary_entity_id = ?',
            [code], null, null, null, null, null, null, true, resolve, reject)
    }).then( function(result) {
        if (result.getCount() === 0) {
            util.displayError(odkCommon.localizeText(locale, "missing_beneficiary_notification"));
        } else {
            clearSessionVars();
            odkTables.openDetailWithListView(null, util.getBeneficiaryEntityCustomFormId(), result.getData(0, 'custom_beneficiary_entity_row_id'),
                'config/tables/' + util.beneficiaryEntityTable + '/relief_assets/html/' + util.beneficiaryEntityTable + '_detail.html?type='
                + encodeURIComponent(type) + '&rootRowId=' + encodeURIComponent(result.getRowId(0)));
        }
    });
}
