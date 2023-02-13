/**
 * Render the choose method page
 */
'use strict';

window.type = 'new_ent';
var entDefaultGroupKey = "entDefaultGroup";

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

    $('#view_details').on('click', function() {
        clearSessionVars();
        odkTables.openDetailView(
          null,
          util.authorizationTable,
          util.getQueryParameter('authorization_id'),
          'config/tables/authorizations/relief_assets/html/' + util.authorizationTable + '_detail.html');
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

function queryChainDownstream() {
    $('#search_results').text('');
    odkData.query(util.beneficiaryEntityTable, 'beneficiary_entity_id = ?',
                  [code],
                  null, null, null, null, null, null, true, benEntOverrideCBSuccess,
                  benEntOverrideCBFailure);
}

function benEntOverrideCBSuccess(result) {
    if (result.getCount() !== 0) {
        var entDefaultGroup = result.getData(0, '_group_modify');
        odkCommon.setSessionVariable(entDefaultGroupKey, entDefaultGroup);
        odkData.query(util.authorizationTable, '_id = ?',
                      [util.getQueryParameter('authorization_id')], null, null, null, null, null,
                      null, true, restrictOverridesCheckSuccess, restrictOverridesCheckFailure);
    } else {
        util.displayError(odkCommon.localizeText(locale, "missing_beneficiary_notification"));
    }
}

function benEntOverrideCBFailure(error) {
    console.log('failed with error: ' + error);
}

function restrictOverridesCheckSuccess(result) {
    var overrideRestriction = result.getData(0, 'extra_field_entitlements').toUpperCase();
    console.log(overrideRestriction.toUpperCase());

    if (overrideRestriction === 'ONE') {
        odkData.query(util.entitlementTable, 'beneficiary_entity_id = ? and authorization_id = ?',
            [code, util.getQueryParameter('authorization_id')], null, null, null, null, null,
            null, true, entCheckCBSuccess, entCheckCBFailure);
    } else if (overrideRestriction === 'MANY') {
        createOverrideCBSuccess(result);
    } else {
        // 'NONE' case, also acts as default
        // this case should not happen since ONE and MANY cases were the only ones not filtered in the previous authorization list view
        return;

    }
}

function restrictOverridesCheckFailure(error) {
    console.log('restrict override failure with error: ' + error);
}

function entCheckCBSuccess(result) {
    if (result.getCount() > 1 || (result.getCount() === 1 && result.getData(0, 'is_override') === 'TRUE')) {
        util.displayError(odkCommon.localizeText(locale, "already_qualifies_override"));
    } else {
        odkData.query(util.authorizationTable, '_id = ?',
            [util.getQueryParameter('authorization_id')],
            null, null, null, null, null, null, true, createOverrideCBSuccess,
            createOverrideCBFailure);
    }
}

function entCheckCBFailure(error) {
    console.log('scanCBFailure with error:' + error);
}

function createOverrideCBSuccess(result) {
    var defaultGroup = odkCommon.getSessionVariable(entDefaultGroupKey);
    var user = odkCommon.getSessionVariable(userKey);

    var struct = {};

//TODO: would member ID be set here? is that a separate path? (post MVP)

    struct['authorization_id'] = result.get('_id');
    struct['distribution_name'] = result.get('distribution_name');
    struct['authorization_type'] = result.get('type');
    struct['item_id'] = result.get('item_id');
    struct['item_name'] = result.get('item_name');
    struct['item_description'] = result.get('item_description');
    struct['beneficiary_entity_id'] = code;
    struct['is_override'] = 'TRUE';
    struct['status'] = 'ENABLED';
    struct['_default_access'] = 'HIDDEN';
    struct['_row_owner'] = user;
    struct['_group_read_only'] = defaultGroup;
    struct['date_created'] = util.getCurrentOdkTimestamp();
    odkData.addRow(util.entitlementTable, struct, util.genUUID(), addDistCBSuccess, addDistCBFailure);
}

function createOverrideCBFailure(error) {
    console.log('createOverride failed with error: ' + error);
}

var addDistCBSuccess = function(result) {
    $('#search_results').text(odkCommon.localizeText(locale, "entitlement_creation_success"));
};

var addDistCBFailure = function(error) {
    console.log('addDistCBFailure: ' + error);
};
