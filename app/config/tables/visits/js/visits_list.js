/**
 * This is the file that will be creating the list view.
 */

'use strict';

var idxStart = -1;
var visitsResultSet = {};
var visitActionTypeValue = 10;

/**
 * Use chunked list view for larger tables: We want to chunk the displays so
 * that there is less load time.
 */

/**
 * Called when page loads to display things (Nothing to edit here)
 */
var deliveriesCBSuccess = function(result) {
    visitsResultSet = result;
    displayGroup(idxStart);
};

var deliveriesCBFailure = function(error) {

    console.log('visits_list deliveriesCBFailure: ' + error);
};

var display = function() {
  odkCommon.registerListener(function() {
    actionCallback();
  });
  actionCallback();

  document
    .getElementById('visitListSearch')
    .addEventListener('click', filterVisits);

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
    if (visitsResultSet.getCount() === 0) {
      $('#title').addClass('d-none');
      $('#error').removeClass('d-none');
      $('#visitSearchDiv').addClass('d-none');
    } else {
      $('#title').removeClass('d-none');
      $('#error').addClass('d-none');
      $('#visitSearchDiv').removeClass('d-none');
    }

    /* Number of rows displayed per 'chunk' - can modify this value */
    var chunk = 50;
    for (var i = idxStart; i < idxStart + chunk; i++) {
      if (i >= visitsResultSet.getCount()) {
        break;
      }

      var rcId = visitsResultSet.getData(i, 'rcId') || '';

      var customVisitRowId = visitsResultSet.getData(i, 'customVisitRowId');
      var isVisitFilled = !!customVisitRowId;

      var onClickHandler;
      if (isVisitFilled) {
        onClickHandler = openVisitDetailViewOnClick(
          visitsResultSet.getData(i, 'customVisitTableId'),
          visitsResultSet.getData(i, 'customVisitTableId'),
          customVisitRowId,
          rcId
        );
      } else {
        onClickHandler = makeVisitsListOnClick(visitsResultSet.getData(i, '_id'))
      }

      listViewUtil.addListItem(
        'RC #: ' + rcId,
        onClickHandler,
        { "data-rcid": rcId },
        null,
        isVisitFilled ? 'unavailable' : null
      );
    }

    if (i < visitsResultSet.getCount()) {
        setTimeout(resumeFn, 0, i);
    }
};

// TODO: this should requery instead
var filterVisits = function () {
  var searchStr = document.getElementById("search-input").value.trim();

  var items = document.getElementsByClassName('list-view-item');
  for (var i = 0; i < items.length; i++) {
    var rcId = items[i].querySelector('.item_space').dataset.rcid;

    if (rcId !== searchStr) {
      items[i].hidden = true;
    } else {
      items[i].hidden = false;
    }
  }
};

var makeVisitsListOnClick = function (rowId) {
  return function () {
    console.log('clicked with rowId: ' + rowId);

    return util.triggerVisit(rowId, visitActionTypeValue, {});
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
      util.resolveViewPath(util.visitsTable, 'detail') + viewQuery
    )
  }
}
