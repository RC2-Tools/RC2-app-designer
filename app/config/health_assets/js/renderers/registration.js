/**
 * Render the choose method page
 */
'use strict';

window.type = 'registration';

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

    return populateChooseUser()
      .then(function () {
          myTimeoutVal = setTimeout(callBackFn, 1000);

          odkCommon.registerListener(callBackFn);

          // Call the registered callback in case the notification occurred before the page finished
          // loading
          callBackFn();
      });
}

function handleCallback(action, dispathStr) {
    handleRegistrationCallback(action, dispathStr);
}

function handleRegistrationCallback(action, dispatchStr) {
  dataUtil.validateCustomTableEntry(action, dispatchStr, "beneficiary_entity", util.beneficiaryEntityTable).then( function(result) {
    if (result) {
      var customRowId = action.jsonValue.result.instanceId;
      var rootRowId = dispatchStr[util.rootRowIdKey];
      if (util.getRegistrationMode() === "HOUSEHOLD") {
        dataUtil.selfHealMembers(rootRowId, customRowId)
          .then( function(result) {
            clearSessionVars();
            if (result) {
              console.log("added base member rows");
            } else {
              console.log("no members were created");
            }
            clearSessionVars();
            odkTables.openDetailWithListView(null, util.getBeneficiaryEntityCustomFormId(), customRowId,
              'config/tables/' + util.beneficiaryEntityTable + '/health_assets/html/' + util.beneficiaryEntityTable
              + '_detail.html?type=' + encodeURIComponent(type));

          }).catch( function(error) {
          console.log(error);
        });
      } else if (util.getRegistrationMode() === "INDIVIDUAL") {

        // need to verify why it is necessary to add a base member row when in individual mode
        var jsonMap = {};
        util.setJSONMap(jsonMap, '_row_owner', odkCommon.getActiveUser());
        util.setJSONMap(jsonMap, "beneficiary_entity_row_id", rootRowId);
        util.setJSONMap(jsonMap, "date_created", util.getCurrentOdkTimestamp());
        util.setJSONMap(jsonMap, "status", 'ENABLED');
        util.setJSONMap(jsonMap, "_group_modify", odkCommon.getSessionVariable(defaultGroupKey));
        util.setJSONMap(jsonMap, "_default_access", "HIDDEN");

        new Promise( function(resolve, reject) {
          odkData.addRow(util.membersTable, jsonMap, util.genUUID(), resolve, reject);
        }).then( function(result) {
          clearSessionVars();
          odkTables.openDetailWithListView(null, util.getBeneficiaryEntityCustomFormId(), customRowId,
            'config/tables/' + util.beneficiaryEntityTable + '/health_assets/html/' + util.beneficiaryEntityTable +
            '_detail.html?type=delivery');
        });
      }
    }
  });
}

function queryChainDownstream() {
    registrationFunction();
}

function registrationFunction() {
  console.log('registration function path entered');
  odkData.query(util.beneficiaryEntityTable, 'beneficiary_entity_id = ?', [code], null, null,
    null, null, null, null, true, registrationBCheckCBSuccess,
    registrationBCheckCBFailure);
}

function registrationBCheckCBSuccess(result) {
  console.log('registrationBCheckCBSuccess called with value' + result);
  if (result.getCount() === 0) {
    odkData.query(util.entitlementTable, 'beneficiary_entity_id = ?', [code], null, null,
      null, null, null, null, true, registrationVoucherCBSuccess,
      registrationVoucherCBFailure);
  } else {
    util.displayError(odkCommon.localizeText(locale, "id_unavailable"));
    clearSessionVars();
    odkTables.openDetailWithListView(null, util.getBeneficiaryEntityCustomFormId(), result.getData(0, 'custom_beneficiary_entity_row_id'),
      'config/tables/' + util.beneficiaryEntityTable + '/health_assets/html/' + util.beneficiaryEntityTable + '_detail.html?type=' +
      encodeURIComponent(type) + '&rootRowId=' + encodeURIComponent(result.getRowId(0)));

  }
}

function registrationBCheckCBFailure(error) {
  console.log('registrationBCheckCBFailure called with error: ' + error);
}

function registrationVoucherCBSuccess(result) {

  //TODO: if in OPTIONAL_REGISTRATION WORKFLOW_MODE we do not force them to register the beneficiary_entity_id before delivering
  // in REGISTRATION_REQUIRED we would force them to

  var voucherResultSet = result;
  if (voucherResultSet.getCount() === 0) {
    $('#search_results').text(odkCommon.localizeText(locale, "id_available"));
  } else {
    $('#search_results').text(odkCommon.localizeText(locale, "voucher_detected"));
  }

  var defaultGroup = odkCommon.getSessionVariable(defaultGroupKey);
  var user = odkCommon.getSessionVariable(userKey);

  // TODO: verify that custom beneficiary entity table exists
  var customBEForm = util.getBeneficiaryEntityCustomFormId();
  if (customBEForm === undefined || customBEForm === null || customBEForm === "") {
    // should we provide a ui to register without survey?
    util.displayError(odkCommon.localizeText(locale, 'be_custom_form_undefined'));
    return;
  }
  var customRowId = util.genUUID();
  var rootRowId = util.genUUID();
  new Promise( function(resolve, reject) {
    var struct = {};
    struct['beneficiary_entity_id'] = code;
    struct['custom_beneficiary_entity_form_id'] = customBEForm;
    struct['custom_beneficiary_entity_row_id'] = customRowId;
    struct['status'] = 'ENABLED';
    struct['status_reason'] = 'standard';
    struct['_group_modify'] = defaultGroup;
    struct['_default_access'] = 'HIDDEN';
    struct['_row_owner'] = user;
    struct['date_created'] = util.getCurrentOdkTimestamp();
    odkData.addRow(util.beneficiaryEntityTable, struct, rootRowId, resolve, reject);
  }).then( function(result) {
    var customDispatchStruct = {};
    var additionalFormsTupleArr = [];

    var additionalFormTuple = {[util.additionalCustomFormsObj.formIdKey] : util.getMemberCustomFormId(), [util.additionalCustomFormsObj.foreignReferenceKey] : 'custom_beneficiary_entity_row_id', [util.additionalCustomFormsObj.valueKey] : customRowId};
    additionalFormsTupleArr.push(additionalFormTuple);

    customDispatchStruct[util.additionalCustomFormsObj.dispatchKey] = additionalFormsTupleArr;

    console.log(customDispatchStruct);
    clearSessionVars();
    return dataUtil.createCustomRowFromBaseEntry(result, 'custom_beneficiary_entity_form_id',
      'custom_beneficiary_entity_row_id', actionRegistration, customDispatchStruct, "_group_modify", null);
  });
}

function registrationVoucherCBFailure(error) {
  console.log('registrationVoucherCBFailure called with error: ' + error);
}
