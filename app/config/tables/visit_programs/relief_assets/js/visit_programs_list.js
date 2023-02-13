/**
 * This is the file that will be creating the list view.
 */

'use strict';

var locale = odkCommon.getPreferredLocale();

var idxStart = -1;
var visitProgramsResultSet = {};
var visitActionTypeValue = 20;

/**
 * Use chunked list view for larger tables: We want to chunk the displays so
 * that there is less load time.
 */

/**
 * Called when page loads to display things (Nothing to edit here)
 */
var deliveriesCBSuccess = function(result) {
    visitProgramsResultSet = result;
    displayGroup(idxStart);
};

var deliveriesCBFailure = function(error) {

    console.log('visit_programs_list deliveriesCBFailure: ' + error);
};

var display = function() {
    odkCommon.registerListener(function() {
        actionCallback();
    });
    actionCallback();

    // TODO: very similar function in delivery.js
    document.getElementById('deliveryTab').addEventListener('click', function() {
        var rcId = util.getQueryParameter('rcId');

        new Promise(function (resolve, reject) {
            odkData.query(
              util.beneficiaryEntityTable,
              'beneficiary_entity_id = ? and (status = ? or status = ?)',
              [rcId, 'ENABLED', 'enabled'],
              null, null, null, null, null, null, true,
              resolve, reject
            );
        })
          .then(function (result) {
              if (result.getCount() === 0) {
                  util.displayError(odkCommon.localizeText(locale, "missing_beneficiary_notification"));
              } else if (result.getCount() === 1) {
                  odkTables.openDetailWithListView(
                    null,
                    util.getBeneficiaryEntityCustomFormId(),
                    result.getData(0, 'custom_beneficiary_entity_row_id'),
                    'config/tables/' + util.beneficiaryEntityTable + '/relief_assets/html/' + util.beneficiaryEntityTable + '_detail.html?type=delivery' +
                    '&rootRowId=' + encodeURIComponent(result.getRowId(0))
                  );
              } else {
                  odkTables.openTableToListView(
                    null,
                    util.beneficiaryEntityTable,
                    'beneficiary_entity_id = ? and (status = ? or status = ?)',
                    [rcId, 'ENABLED', 'enabled'],
                    'config/tables/beneficiary_entities/relief_assets/html/beneficiary_entities_list.html?type=delivery'
                  );
              }
          });
    });

    resumeFn(0);
};

var actionCallback = function () {
    var action = odkCommon.viewFirstQueuedAction();

    if (action === null || action === undefined) {
        // The queue is empty
        return;
    }

    var dispatchStr = JSON.parse(action.dispatchStruct);
    if (dispatchStr === null || dispatchStr === undefined) {
        odkCommon.removeFirstQueuedAction();
        return;
    }

    var actionType = dispatchStr[util.actionTypeKey];
    if (actionType === visitActionTypeValue) {
        visitCallback(action, dispatchStr);
        odkCommon.removeFirstQueuedAction();
    }
};

var visitCallback = function (action, dispatchStr) {
    var result = action.jsonValue.result || {};
    var customRowId = result['instanceId'];

    if (customRowId === undefined || customRowId === null) {
        var visitRootRowId = dispatchStr[util.rootRowIdKey];

        return new Promise(function (resolve, reject) {
            odkData.updateRow(
              util.visitsTable,
              {
                  custom_visit_row_id: null
              },
              visitRootRowId,
              resolve,
              reject
            )
        });
    }
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
    if (visitProgramsResultSet.getCount() === 0) {
        $('#title').addClass('d-none');
        $('#error').removeClass('d-none');
    } else {
        $('#title').removeClass('d-none');
        $('#error').addClass('d-none');
    }

    var isBeneficiarySpecificList = !!util.getQueryParameter('rcId');

    if (isBeneficiarySpecificList) {
        $('#deliveryVisitTabs').removeClass('d-none');
    } else {
        $('#deliveryVisitTabs').addClass('d-none');
    }

    /* Number of rows displayed per 'chunk' - can modify this value */
    var chunk = 50;
    for (var i = idxStart; i < idxStart + chunk; i++) {
        if (i >= visitProgramsResultSet.getCount()) {
            break;
        }

        var visitProgramName = visitProgramsResultSet.getData(i, 'name');

        if (isBeneficiarySpecificList) {
            var customVisitRowId = visitProgramsResultSet.getData(i, 'custom_visit_row_id');

            if (!!customVisitRowId) {
                // visit has been filled show summary

                listViewUtil.addListItem(
                  visitProgramName,
                  openVisitDetailViewOnClick(
                    visitProgramsResultSet.getData(i, 'custom_visit_table_id'),
                    visitProgramsResultSet.getData(i, 'custom_visit_form_id'),
                    customVisitRowId,
                    util.getQueryParameter('rcId')
                  ),
                  null,
                  null,
                  'unavailable'
                );
            } else {
                // launch Survey to fill visit

                listViewUtil.addListItem(
                  visitProgramName,
                  beneficiarySpecificVisitProgramOnClick(
                    visitProgramsResultSet.getData(i, 'visitRowId'),
                    visitProgramsResultSet.getData(i, 'status')
                  )
                );
            }
        } else {
            listViewUtil.addListItem(
              visitProgramName,
              visitProgramListOnClick(
                visitProgramsResultSet.getRowId(i),
                visitProgramsResultSet.getData(i, 'status')
              )
            );
        }
    }
    if (i < visitProgramsResultSet.getCount()) {
        setTimeout(resumeFn, 0, i);
    }
};

var visitProgramListOnClick = function (rowId, state) {
    if (state === 'ACTIVE' || state === 'INACTIVE') {
        return function () {
            console.log('clicked with rowId: ' + rowId);
            relief_util.getBeneficiariesListForVisit(rowId);
        };
    } else {
        var msg = odkCommon.localizeText(locale, 'visit_program_disabled');

        return function () {
            console.log('clicked with rowId: ' + rowId);
            util.displayError(msg);
        };
    }
};

var beneficiarySpecificVisitProgramOnClick = function (visitRowId, state) {
    if (state === 'ACTIVE' || state === 'INACTIVE') {
        return function () {
            console.log('clicked with rowId: ' + visitRowId);
            return util.triggerVisit(visitRowId, visitActionTypeValue, {})
        };
    } else {
        var msg = odkCommon.localizeText(locale, 'visit_program_disabled');

        return function () {
            console.log('clicked with rowId: ' + visitRowId);
            util.displayError(msg);
        };
    }
};

var openVisitDetailViewOnClick = function (customVisitTableId, customVisitFormId, customVisitRowId, rcId) {
    var viewQuery = '?rcId=' + encodeURIComponent(rcId) +
      '&tableId=' + encodeURIComponent(customVisitTableId) +
      '&formId=' + encodeURIComponent(customVisitFormId) +
      '&rowId=' + encodeURIComponent(customVisitRowId);

    return function () {
        odkTables.openDetailView(
          null,
          customVisitTableId,
          customVisitRowId,
          relief_util.resolveViewPath(util.visitsTable, 'detail') + viewQuery
        )
    }
}
