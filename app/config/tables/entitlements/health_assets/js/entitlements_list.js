'use strict';

var LOG_TAG = 'entitlements_list: ';

var idxStart = -1;
var actionTypeKey = "actionTypeKey";
var actionAddCustomDelivery = 0;
var locale = odkCommon.getPreferredLocale();
var action = util.getQueryParameter('action');
var beneficiaryEntityId = util.getQueryParameter('beneficiary_entity_id');
var CAN_BE_DELIVERED = 'canBeDelivered';
var dept = util.getQueryParameter(util.departmentParam);
var pam = util.getQueryParameter(util.pamParam);

var display = function() {
    odkCommon.registerListener(function() {
        actionCBFn();
    });
    actionCBFn();
    resumeFn(0);
};

var resumeFn = function(fIdxStart) {
    var entitlementsResultSet = null;
    dataUtil.getViewData().then( function(result) {
        entitlementsResultSet = result;

        idxStart = fIdxStart;
        console.log('I', LOG_TAG + 'resumeFn called. idxStart: ' + idxStart);

        if (action === 'detail') {
            displayGroupDetail(idxStart, result);
        } else {
            displayGroup(idxStart, result);
        }

    }).catch( function(reason) {
        console.log('E', LOG_TAG +  LOG_TAG + "Failed to get view data: " + reason);
    });
};


function launchDeliveryDetailView(deliveryQueryPromise) {
    return deliveryQueryPromise
      .then(function(result) {
        if (result.getCount() > 0) {
            odkTables.openDetailView(
              null,
              util.deliveryTable,
              result.getData(0, "_id"),
              'config/tables/deliveries/health_assets/html/deliveries_detail.html'
            )
        }
      })
      .catch(function(reason) {
          console.log('E', LOG_TAG + "Failed to retrieve delivery: " + reason);
      });
}

function launchDeliveryDetailViewById(deliveryId) {
    console.log('I', LOG_TAG + "Launching delivery detail view for delivery: " + deliveryId);

    return launchDeliveryDetailView(new Promise(function(resolve, reject) {
        odkData.getRows(util.deliveryTable, deliveryId, resolve, reject);
    }));
}

function launchDeliveryDetailViewByEntitlement(entitlement_id) {
    console.log('I', LOG_TAG + "Launching delivery detail view for entitlement: " + entitlement_id);

    return launchDeliveryDetailView(new Promise(function (resolve, reject) {
        odkData.query(
          util.deliveryTable,
          'entitlement_id = ?',
          [entitlement_id],
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
    }));
}

/************************** Action callback workflow *********************************/

var actionCBFn = function() {
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
        case actionAddCustomDelivery:
            finishCustomDelivery(action, dispatchStr);
            odkCommon.removeFirstQueuedAction();
            break;
        default:
            console.log('E', LOG_TAG + "Error: unrecognized action type in callback");
    }
};

var finishCustomDelivery = function(action, dispatchStr) {
    if (dataUtil.validateCustomTableEntry(action, dispatchStr, "delivery", util.deliveryTable)) {
        // TODO: check to make sure that there are any entitlements left, otherwise return to previous screen
    }
};

/************************** UI Rending functions *********************************/

var displayGroup = function(idxStart, authorizationsResultSet) {
    console.log('I', LOG_TAG + 'displayGroup called. idxStart: ' + idxStart);

    /* If the list comes back empty, inform the user */
    if (authorizationsResultSet.getCount() === 0) {
        $('#title').addClass('d-none');
        $('#error').removeClass('d-none');
    } else {
        $('#title').removeClass('d-none');
        $('#error').addClass('d-none');
    }

    /* Number of rows displayed per 'chunk' - can modify this value */
    var chunk = 50;
    var i = idxStart;
    for (i; i < idxStart + chunk; i++) {
        if (i >= authorizationsResultSet.getCount()) {
            break;
        }

        var rowId = authorizationsResultSet.getRowId(i);

        listViewUtil.addListItem(
          authorizationsResultSet.getData(i, 'item_name'),
          entitlementsListOnClick(rowId, rowId, null),
          { rowId: rowId, id: rowId }
        );

        if (action === 'change_status') {
            var toggle = document.importNode(document.getElementById('listItemSwitchTemplate'), true);
            var leftToggle = toggle.querySelector('.toggle-left');
            leftToggle.addEventListener('click', changeStatusListener(rowId, 'ENABLED'));

            var rightToggle = toggle.querySelector('.toggle-right');
            rightToggle.addEventListener('click', changeStatusListener(rowId, 'DISABLED'));

            if (authorizationsResultSet.getData(i, 'status') === 'ENABLED') {
                leftToggle.classList.add('active');
            } else {
                rightToggle.classList.add('active');
            }

            document.getElementById(rowId).parentNode.appendChild(toggle);
        } else if (action === 'deliver') {
            idOnlyDeliveryPromise(rowId, authorizationsResultSet.getData(i, 'extra_field_entitlements'));
        }
    }
    if (i < authorizationsResultSet.getCount()) {
        setTimeout(resumeFn, 0, i);
    }
};

var displayGroupDetail = function (idxStart, authorizationsDelResultSet) {
    console.log('I', LOG_TAG + 'displayGroupDetail called. idxStart: ' + idxStart);

    /* If the list comes back empty, inform the user */
    if (authorizationsDelResultSet.getCount() === 0) {
        $('#title').addClass('d-none');
        $('#error').removeClass('d-none');
    } else {
        $('#title').removeClass('d-none');
        $('#error').addClass('d-none');
    }

    /* Number of rows displayed per 'chunk' - can modify this value */
    var chunk = 50;
    var i = idxStart;
    for (i; i < idxStart + chunk; i++) {
        if (i >= authorizationsDelResultSet.getCount()) {
            break;
        }

        listViewUtil.addListItem(
          authorizationsDelResultSet.getData(i, 'item_name'),
          entitlementsListOnClick(
            authorizationsDelResultSet.getRowId(i),
            authorizationsDelResultSet.getData(i, 'auth_id'),
            authorizationsDelResultSet.getData(i, 'del_id')
          ),
          {
              rowId: authorizationsDelResultSet.getData(i, 'auth_id'),
              id: authorizationsDelResultSet.getData(i, 'del_id')
          }
        );

        if (action === 'detail') {
            idOnlyDeliveryDetailPromise(
              authorizationsDelResultSet.getData(i, 'custom_delivery_form_id'),
              authorizationsDelResultSet.getData(i, 'custom_delivery_row_id')
            );
        }
    }
    if (i < authorizationsDelResultSet.getCount()) {
        setTimeout(resumeFn, 0, i);
    }
};

var changeStatusListener = function (id, status) {
    return function () {
        return new Promise( function(resolve, reject) {
            var targetTable;
            if (util.getWorkflowMode() === util.workflow.idOnly) {
                targetTable = util.authorizationTable;
            } else {
                targetTable = util.entitlementTable;
            }

            odkData.updateRow(targetTable, {'status' : status}, id,
              resolve, reject);
        }).then( function(result) {
            console.log('Update success: ' + result);
        }).catch( function(reason) {
            console.log('Update failure: ' + reason);
        });
    }
};

var idOnlyDeliveryPromise = function (rowId, extraEnt) {
    // TODO: arbitrary query instead
    new Promise(function (resolve, reject) {
        odkData.query(util.deliveryTable, 'beneficiary_entity_id = ? AND authorization_id = ?',
          [beneficiaryEntityId, rowId], null, null,
          null, null, null, null, true, resolve, reject);
    }).then( function(result) {
        console.log(result);
        var anchorElement = $(jqSelector(rowId));
        // Extra field entitlement values - NONE, ONE, MANY
        if (result.getCount() > 0) {
            anchorElement.parent().addClass('unavailable');

            var extraNotEligible = extraEnt === 'NONE' || (extraEnt === 'ONE' && result.getCount() >= 2);
            anchorElement.data(CAN_BE_DELIVERED, !extraNotEligible);
        } else {
            anchorElement.parent().addClass('available');
            anchorElement.data(CAN_BE_DELIVERED, true);
        }
    }).catch( function(reason) {
        console.log(reason);
    });
};

var idOnlyDeliveryDetailPromise = function (customDeliveryFormId, customDeliveryRowId) {
    // TODO: arbitrary query instead
    if (customDeliveryFormId !== null && customDeliveryFormId !== undefined) {
        var sqlCmd =
          'SELECT \n' +
          customDeliveryFormId + '.pam, \n' +
          customDeliveryFormId + '.activity_date, \n' +
          util.deliveryTable + '.authorization_id, \n' +
          util.deliveryTable + '._id \n' +
          'FROM ' + customDeliveryFormId + ' \n' +
          '   INNER JOIN ' + util.deliveryTable + ' ON ' + util.deliveryTable +
          '.custom_delivery_row_id = ' + customDeliveryFormId + '._id\n' +
          'WHERE ' + util.deliveryTable + '.custom_delivery_row_id = ?';

        new Promise(function (resolve, reject) {
            odkData.arbitraryQuery(util.deliveryTable, sqlCmd, [customDeliveryRowId], null, null, resolve, reject);
        }).then(function (result) {
            if (result && result.getCount() === 1) {
                $(jqSelector(result.get('_id')))
                  .parent()
                  .find('.detail')
                  .append($('<span/>').text(result.get('activity_date')))
                  .append($('<span/>').text(result.get('pam')));
            }
        }).catch(function (reason) {
            console.log(reason);
        });
    }
};

// Our UUID function uses ':' and jQuery doesn't like it
function jqSelector( myid ) {
    return "#" + myid.replace( /(:|\.|\[|\]|,|=|@)/g, "\\$1" );
}

var entitlementsListOnClick = function (entId, authId, delId) {
    return function () {
        if (action === 'detail' || action === 'deliver') {
            console.log('I', LOG_TAG + 'clicked with ' + JSON.stringify({entId: entId, authId: authId, delId: delId}));
            if (action === 'detail') {
                if (util.getWorkflowMode() === util.workflow.idOnly) {
                    launchDeliveryDetailViewById(delId);
                } else {
                    launchDeliveryDetailViewByEntitlement(entId);
                }
            } else if (action === 'deliver') {
                if (util.getWorkflowMode() === util.workflow.idOnly) {
                    var canDeliver = $(jqSelector(entId)).data(CAN_BE_DELIVERED);
                    if (canDeliver === true) {
                        var jsonMap = {};
                        util.setJSONMap(jsonMap, util.departmentParam, dept);
                        util.setJSONMap(jsonMap, util.pamParam, pam);
                        healthDataUtil.triggerAuthorizationDelivery(authId, beneficiaryEntityId,
                          actionAddCustomDelivery, jsonMap);
                    } else {
                        util.displayError(odkCommon.localizeText(locale, 'beneficiary_not_entitled'));
                    }
                } else {
                    healthDataUtil.triggerEntitlementDelivery(entId, actionAddCustomDelivery);
                }
            }
        }
    }
};
