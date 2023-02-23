'use strict';
var idxStart = -1;
var distResultSet = {};
var actionDistReport = "distributionReport";
var actionTypeKey = "actionTypeKey";


var distCBSuccess = function(result) {
    distResultSet = result;
    if (distResultSet.getCount() === 0) {
        $('#title').addClass('d-none');
        $('#error').removeClass('d-none');
    } else {
        $('#title').removeClass('d-none');
        $('#error').addClass('d-none');

        displayGroup(idxStart);
    }
};

var distCBFailure = function(error) {

    console.log('distribution_list_field_report distCBFailure: ' + error);
};

var display = function() {

    odkCommon.registerListener(function() {
        callBackFn();
    });

    // Call the registered callback in case the notification occured before the page finished
    // loading
    callBackFn();
    resumeFn(0);
};

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

    var actionType = dispatchStr[actionTypeKey];
    console.log('callBackFn: actionType: ' + actionType);

    switch (actionType) {
        case actionDistReport:
            handleDistReportCallback(action, dispatchStr);
            odkCommon.removeFirstQueuedAction();
            break;
        default:
            console.log("Unrecognized action type in callback");
            odkCommon.removeFirstQueuedAction();
            break;
    }
}

var handleDistReportCallback = function(action, dispatchStr) {
    if (dataUtil.validateCustomTableEntry(action, dispatchStr, "distribution report", util.distributionReportTable)) {
        // TODO: UI changes on successful completion?
    }
};


var resumeFn = function(fIdxStart) {
    var joinQuery = "SELECT * FROM " + util.distributionTable + ' t1 LEFT JOIN ' + util.distributionReportTable +
        ' t2 ON (t1.summary_version=t2.report_version OR (t1.summary_version IS NULL AND t2.report_version IS NULL)) ' +
        'AND t1._id=t2.distribution_id WHERE t1.summary_form_id IS NOT NULL';

    odkData.arbitraryQuery(util.distributionTable, joinQuery, [], null, null,
        distCBSuccess, distCBFailure);

    idxStart = fIdxStart;
    console.log('resumeFn called. idxStart: ' + idxStart);
};

var displayGroup = function(idxStart) {
    console.log('displayGroup called. idxStart: ' + idxStart);

    /* Number of rows displayed per 'chunk' - can modify this value */
    console.log(distResultSet.getColumns());
    var chunk = 50;
    for (var i = idxStart; i < idxStart + chunk; i++) {
        if (i >= distResultSet.getCount()) {
            break;
        }

        listViewUtil.addListItem(
          distResultSet.getData(i, 'name'),
          fieldReportOnClick,
          {
              rowId: distResultSet.getRowId(i),
              summaryFormId: distResultSet.getData(i, "summary_form_id"),
              reportVersion: distResultSet.getData(i, "report_version")
          }
        );
    }

    if (i < distResultSet.getCount()) {
        setTimeout(resumeFn, 0, i);
    }

};

var fieldReportOnClick = function (evt) {
    var targetElem = $(evt.target);
    var rowId = targetElem.attr('rowId');
    var reportVersion = targetElem.attr('reportVersion');
    var summaryFormId = targetElem.attr('summaryFormId');
    console.log("rowId: " + rowId);
    console.log("summaryFormId: " + summaryFormId);
    console.log("reportVersion: " + reportVersion);

    console.log('clicked with rowId: ' + rowId);
    // make sure we retrieved the rowId
    if (rowId !== null && rowId !== undefined) {
        // we'll pass null as the relative path to use the default file
        new Promise(function(resolve, reject) {
            var sel = "distribution_id = ?";
            var selArgs = [rowId];
            if (reportVersion !== null && reportVersion !== undefined) {
                sel += " AND report_version = ?";
                selArgs.push(reportVersion);
            }
            odkData.query(util.distributionReportTable, sel, selArgs,
              null, null, null, null, null, null, true, resolve, reject);
        }).then( function (result) {
            if (result.getCount() > 0) {
                odkTables.editRowWithSurvey(null, result.get('summary_form_id'),
                  result.get('summary_row_id'), result.get('summary_form_id'), null);
            } else {
                var rootRowId = util.genUUID();
                var customReportRowId = util.genUUID();
                return new Promise( function(resolve, reject) {
                    var jsonMap = {};
                    util.setJSONMap(jsonMap, "distribution_id", rowId);
                    util.setJSONMap(jsonMap, "user", odkCommon.getActiveUser());
                    util.setJSONMap(jsonMap, "report_version", reportVersion);
                    util.setJSONMap(jsonMap, "summary_form_id", summaryFormId);
                    util.setJSONMap(jsonMap, "summary_row_id", customReportRowId);
                    util.setJSONMap(jsonMap, "date_created", util.getCurrentOdkTimestamp());
                    odkData.addRow(util.distributionReportTable, jsonMap, rootRowId, resolve, reject);
                }).then( function(result) {
                    // passing in group read only to not break method
                    return dataUtil.createCustomRowFromBaseEntry(result, "summary_form_id", "summary_row_id",
                      actionDistReport, null, '_group_read_only', null);
                });
            }
        });
    }
};
