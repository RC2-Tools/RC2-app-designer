/**
 * Render the choose method page
 */
'use strict';

window.type = 'delivery';

function display() {
    var titleElem = document.getElementById('title');
    if (util.getWorkflowMode() === util.workflow.none) {
        titleElem.dataset['localize'] = 'enter_beneficiary_entity_id';
    } else {
        titleElem.dataset['localize'] = 'delivery_title';
    }

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

    return populateSyncList()
        .then(function () {
          myTimeoutVal = setTimeout(callBackFn, 1000);

          odkCommon.registerListener(callBackFn);

          // Call the registered callback in case the notification occurred before the page finished
          // loading
          callBackFn();
        });
}

function handleCallback() {
    console.log("Error: unrecognized action type in callback");
}

function queryChainDownstream() {
    if (util.getWorkflowMode() === util.workflow.none) {
        tokenDeliveryFunction();
    } else {
        deliveryFunction();
    }
}

function tokenDeliveryFunction() {
    // Could put this reconciliation function throughout the app
    console.log('entered token delivery function');
    var activeAuthorization;

    dataUtil
      .reconcileTokenAuthorizations()
      .then(dataUtil.getCurrentTokenAuthorizations)
      .then(function (result) {
          console.log(result);
          activeAuthorization = result;
          if (activeAuthorization.getCount() === 1) {
              return new Promise(function (resolve, reject) {
                  odkData.query(
                    util.deliveryTable,
                    'beneficiary_entity_id = ? AND authorization_id = ?',
                    [code, activeAuthorization.getRowId(0)],
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    true,
                    resolve,
                    reject
                  );
              });
          } else if (activeAuthorization.getCount() === 0) {
              var noActiveAuth = odkCommon.localizeText(locale, 'no_active_authorizations');

              util.displayError(noActiveAuth);
              return Promise.reject(noActiveAuth);
          } else {
              //this should never happen
              var internalError = odkCommon.localizeText(locale, 'internal_error');

              util.displayError(internalError);
              return Promise.reject(internalError);
          }
      })
      .then(function (result) {
          console.log(result);
          if (result != null) {
              if (result.getCount() === 0) {
                  console.log('Performing simple delivery');
                  clearSessionVars();
                  odkTables.launchHTML(
                    null,
                    'config/relief_assets/html/deliver.html' +
                    '?authorization_id=' + encodeURIComponent(activeAuthorization.getRowId(0)) +
                    '&beneficiary_entity_id=' + encodeURIComponent(code)
                  );
              } else {
                  util.displayError(odkCommon.localizeText(locale, 'beneficiary_already_received'));
              }
          }
      })
      .catch(function (reason) {
          console.log(reason);
      });
}

function deliveryFunction() {
    odkData.query(util.beneficiaryEntityTable, 'beneficiary_entity_id = ? and (status = ? or status = ?)', [code, 'ENABLED', 'enabled'], null,
                           null, null, null, null, null, true, deliveryBCheckCBSuccess, deliveryBCheckCBFailure);
}

function deliveryBCheckCBSuccess(result) {
    console.log('deliveryBCheckCBSuccess called');
    if (result.getCount() === 0) {
        odkData.query(util.beneficiaryEntityTable, 'beneficiary_entity_id = ? and (status = ? or status = ?)', [code, 'DISABLED', 'disabled'],
                          null, null, null, null, null, null, true,
                          deliveryDisabledCBSuccess, deliveryDisabledCBFailure);
    } else if (result.getCount() === 1) {
        // double check that this is the case
        clearSessionVars();
        odkTables.openDetailWithListView(null, util.getBeneficiaryEntityCustomFormId(), result.getData(0, 'custom_beneficiary_entity_row_id'),
                                             'config/tables/' + util.beneficiaryEntityTable + '/relief_assets/html/' + util.beneficiaryEntityTable + '_detail.html?type=' +
                                             encodeURIComponent(type) + '&rootRowId=' + encodeURIComponent(result.getRowId(0)));
    } else {
        clearSessionVars();
        odkTables.openTableToListView(
                                      null,
                                      util.beneficiaryEntityTable, 'beneficiary_entity_id = ? and (status = ? or status = ?)', [code,'ENABLED', 'enabled'],
                                      'config/tables/beneficiary_entities/relief_assets/html/beneficiary_entities_list.html?type=' + type);
    }
}

function deliveryBCheckCBFailure(error) {
    console.log('deliveryBCheckCBFailure called with error: ' + error);
}

function deliveryDisabledCBSuccess(result) {
    console.log('disabledCB called');
    if (result.getCount() > 0) {
        util.displayError(odkCommon.localizeText(locale, "disabled_beneficiary_notification"));
    } else {
      if (util.getWorkflowMode() === util.workflow.optional) {
        // We are in Voucher mode: check for deliveries for this beneficiary
        var voucherPromise = new Promise( function(resolve, reject) {
          odkData.query(util.entitlementTable, 'beneficiary_entity_id = ?', [code], null, null, null, null, null, null, true, resolve, reject);
        }).then (function(entitlement_result) {
          // If there are deliveries for this beneficiary, we still want to give that option
          if (entitlement_result.getCount() > 0) {
              clearSessionVars();
              // opening an arbitrary row. hacky fix to the fact that you need to send in a row to open detail with list.
              // in this case the detail view is null because its an optional er
            odkTables.openDetailWithListView(null, util.authorizationTable, entitlement_result.getData(0, 'authorization_id'),
                                             'config/tables/' + util.beneficiaryEntityTable + '/relief_assets/html/' + util.beneficiaryEntityTable + '_detail.html?type=unregistered_voucher' +
                                             '&beneficiary_entity_id=' + encodeURIComponent(code));
          } else {
              util.displayError(odkCommon.localizeText(locale, "missing_beneficiary_notification"));
          }
        });

        voucherPromise.catch(function(reason) {
          console.log(reason);
        });

      } else {
        // We are not in voucher mode and there is no beneficiary, enabled or disabled
          util.displayError(odkCommon.localizeText(locale, "missing_beneficiary_notification"));
      }

    }
}

function deliveryDisabledCBFailure(error) {
    console.log('disableCB failed with error: ' + error);
}
