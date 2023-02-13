/**
 * Render the choose method page
 */
'use strict';

window.type = 'registration';
var searchFormId = 'colombia_search';
var searchFormKey = 'searchForm';
var searchRowIdKey = 'searchRowId';

var dept = util.getQueryParameter(util.departmentParam);
var pam = util.getQueryParameter(util.pamParam);

function display() {
    // put form registration here - launch Survey here
    $('#launch').click(launchFunction);
    $('#find').click(findFunction);

    var rcIdVal = odkCommon.getSessionVariable(rcIdSessionVariable);
    if (rcIdVal !== null && rcIdVal !== undefined && rcIdVal !== "") {
        $('#code').val(rcIdVal);
    }

    $('#barcode').on('click', doActionZxing);

    $('#enter').on('click', function() {
        var val = $('#code').val();

        odkCommon.setSessionVariable(rcIdSessionVariable, val);
        searchFunction(val);
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

function findFunction() {
    let searchRowId = util.genUUID();
    let searchJsonMap = {};

    // We also need to add group permission fields
    util.setJSONMap(searchJsonMap, '_row_owner', odkCommon.getActiveUser());
    util.setJSONMap(searchJsonMap, '_default_access', 'hidden');

    let defGrp = odkCommon.getSessionVariable(defaultGroupKey);
    util.setJSONMap(searchJsonMap, '_group_modify', defGrp);

    return new Promise( function(resolve, reject) {
        odkData.addRow(searchFormId, searchJsonMap, searchRowId, resolve, reject);
    }).then( function(result) {
        if (!result) {
            util.displayError('Unable to open Survey to generate unique code (rc_id).');
            return;
        }
        let searchDispatchStruct = {};

        util.setJSONMap(searchDispatchStruct, util.actionTypeKey, actionSearchRcId);
        util.setJSONMap(searchDispatchStruct, searchRowIdKey, searchRowId);
        util.setJSONMap(searchDispatchStruct, searchFormKey, searchFormId);
        odkTables.editRowWithSurvey(JSON.stringify(searchDispatchStruct), searchFormId, searchRowId, searchFormId, null);
    });
}

function searchFunction(val) {
    console.log('search function path entered');
    odkData.query(util.beneficiaryEntityTable, 'beneficiary_entity_id = ?', [val], null, null,
        null, null, null, null, true, searchCBSuccess,
        searchCBFailure);
}

function searchCBSuccess(result) {
    console.log('searchCBSuccess called with value' + result);
    if (result.getCount() === 0) {
        util.displayError(odkCommon.localizeText(locale, 'no_id_found'));
    } else {
        clearSessionVars();
        odkTables.openDetailWithListView(null, util.getBeneficiaryEntityCustomFormId(), result.getData(0, 'custom_beneficiary_entity_row_id'),
            'config/tables/' + util.beneficiaryEntityTable + '/html/relief/' + util.beneficiaryEntityTable + '_detail.html?type=' +
            encodeURIComponent(type) + '&rootRowId=' + encodeURIComponent(result.getRowId(0)) +
            '&' + util.departmentParam + '=' + encodeURIComponent(dept) +
            '&' + util.pamParam + '=' + encodeURIComponent(pam)
        );

    }
}

function searchCBFailure(error) {
    console.log('searchCBFailure called with error: ' + error);
}

function handleCallback(action, dispatchStr) {
    switch (dispatchStr[util.actionTypeKey]) {
        case actionLaunch:
            handleLaunchCallback(action, dispatchStr);
            break;
        case actionSearchRcId:
            handleSearchRcIdCallback(action, dispatchStr);
            break;
        default:
            console.log("Error: unrecognized action type in callback");
            break;
    }
}

function handleSearchRcIdCallback(action, dispatchStr) {

    console.log("Returned from launching: " + searchFormId);

    let rowId = dispatchStr[searchRowIdKey];
    if (rowId === null || rowId === undefined) {
        console.log('Error: no row id for rc_id search');
        return;
    }

    let searchForm = dispatchStr[searchFormKey];
    if (searchForm === null || searchForm === undefined) {
        console.log('Error: no search form found for rc_id search');
        return;
    }

    new Promise( function(resolve, reject) {
        odkData.arbitraryQuery(searchForm, 'SELECT rc_id FROM ' + searchForm + ' WHERE _id = ?', [rowId], null, null,
            resolve, reject);
    }).then( function(result) {
        if (result.getCount() !== 1) {
            console.log('Error: rc_id not found for _id: ' + rowId + ' in searchForm: ' + searchForm);
            return;
        }
        odkCommon.setSessionVariable(rcIdSessionVariable, result.getData(0, 'rc_id'));
        $('#code').val(result.getData(0, 'rc_id'));

        odkData.deleteRow(searchForm, null, rowId, deleteRcIdSuccess, deleteRcIdFailure);
    }).catch( function(reason) {
        console.log(reason);
    });
}

function deleteRcIdSuccess(result) {
    console.log('deleteRcIdSuccess called');

    console.log('deleteRcIdSuccess with result count: ' + result.getCount());
}

function deleteRcIdFailure(error) {
    console.log('deleteRcIdFailure called with error: ' + error);
}

function handleLaunchCallback(action, dispatchStr) {
    dataUtil.validateCustomTableEntry(action, dispatchStr, "beneficiary_entity", util.beneficiaryEntityTable)
      .then(function (validationOutcome) {
          if (validationOutcome) {
              var customRowId = action.jsonValue.result.instanceId;
              var customFormId = dispatchStr[util.customFormIdKey];
              var rootRowId = dispatchStr[util.rootRowIdKey];

              // We need to update the base table row with the beneficiary_entity_id/rc_id
              // that was calculated via the survey form id
              return new Promise(function(resolve, reject) {
                  odkData.query(customFormId, '_id = ?', [customRowId], null,
                    null, null, null, null, null, true, resolve, reject);
              }).then(function(result) {
                  var rcId = result.get('rc_id');
                  if (rcId === undefined || rcId === null || rcId === '') {
                      return Promise.all([
                          dataUtil.deleteRow(util.beneficiaryEntityTable, rootRowId),
                          dataUtil.deleteRow(customFormId, customRowId)
                      ]).then(function () {
                          return false;
                      });
                  }

                  // prevent duplicated registration
                  return new Promise(function (resolve, reject) {
                      odkData.query(
                        util.beneficiaryEntityTable,
                        'beneficiary_entity_id = ?',
                        [rcId],
                        null,
                        null,
                        null,
                        null,
                        1,
                        null,
                        true,
                        resolve,
                        reject
                      );
                  })
                    .then(function (result) {
                        if (result.getCount() === 0) {
                            return new Promise(function(resolve, reject) {
                                odkData.updateRow(
                                  util.beneficiaryEntityTable,
                                  { beneficiary_entity_id: rcId },
                                  rootRowId,
                                  resolve,
                                  reject
                                );
                            })
                              .then(function () {
                                  return true;
                              });
                        } else {
                            return Promise.all([
                                dataUtil.deleteRow(util.beneficiaryEntityTable, rootRowId),
                                dataUtil.deleteRow(customFormId, customRowId)
                            ])
                              .then(function () {
                                  odkCommon.setSessionVariable(rcIdSessionVariable, rcId);
                                  $('#code').val(rcId).focus();
                              })
                              .then(function () {
                                  return false;
                              });
                        }
                    });
              });
          } else {
              return false;
          }
      })
      .then(function(result) {
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
                            'config/tables/' + util.beneficiaryEntityTable + '/html/relief/' + util.beneficiaryEntityTable
                            + '_detail.html?type=' + encodeURIComponent(type)
                            + '&' + util.departmentParam + '=' + encodeURIComponent(dept)
                            + '&' + util.pamParam + '=' + encodeURIComponent(pam));

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
                        'config/tables/' + util.beneficiaryEntityTable + '/html/relief/' + util.beneficiaryEntityTable +
                        '_detail.html?type=delivery' +
                        '&' + util.departmentParam + '=' + encodeURIComponent(dept) +
                        '&' + util.pamParam + '=' + encodeURIComponent(pam));
                });
            }
        }
    });
}

function queryChainDownstream(passed_code) {
    searchFunction(passed_code);
}

function launchFunction() {
    console.log('launch form called');

    // We force registrations in Colombia in optional registration
    // but we are using optional registration mode because
    // we cannot guarantee that people have not already delivered something

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
    new Promise(function (resolve, reject) {
        var struct = {};
        //struct['beneficiary_entity_id'] = code;
        struct['custom_beneficiary_entity_form_id'] = customBEForm;
        struct['custom_beneficiary_entity_row_id'] = customRowId;
        struct['status'] = 'ENABLED';
        struct['status_reason'] = 'standard';
        struct['_group_modify'] = defaultGroup;
        struct['_default_access'] = 'HIDDEN';
        struct['_row_owner'] = user;
        struct['date_created'] = util.getCurrentOdkTimestamp();
        odkData.addRow(util.beneficiaryEntityTable, struct, rootRowId, resolve, reject);
    }).then(function (result) {
        var customDispatchStruct = {};
        var additionalFormsTupleArr = [];

        var additionalFormTuple = {
            [util.additionalCustomFormsObj.formIdKey]: util.getMemberCustomFormId(),
            [util.additionalCustomFormsObj.foreignReferenceKey]: 'custom_beneficiary_entity_row_id',
            [util.additionalCustomFormsObj.valueKey]: customRowId
        };
        additionalFormsTupleArr.push(additionalFormTuple);

        customDispatchStruct[util.additionalCustomFormsObj.dispatchKey] = additionalFormsTupleArr;

        console.log(customDispatchStruct);
        clearSessionVars();
        var jsonMap = {};
        util.setJSONMap(jsonMap, util.departmentParam, dept);
        util.setJSONMap(jsonMap, util.pamParam, pam);
        return dataUtil.createCustomRowFromBaseTable(rootRowId, customBEForm,
            customRowId, actionLaunch, customDispatchStruct, defaultGroup, 'HIDDEN', jsonMap);
    });

}
