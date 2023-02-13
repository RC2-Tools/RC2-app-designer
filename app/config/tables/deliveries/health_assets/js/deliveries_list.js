/**
 * This is the file that will be creating the list view.
 */

'use strict';

var locale = odkCommon.getPreferredLocale();
var idxStart = -1;
var deliveriesResultSet = {};

/**
 * Use chunked list view for larger tables: We want to chunk the displays so
 * that there is less load time.
 */

/**
 * Called when page loads to display things (Nothing to edit here)
 */
var deliveriesCBSuccess = function(result) {
    deliveriesResultSet = result;

    return (function() {
        displayGroup(idxStart);
    }());
};

var deliveriesCBFailure = function(error) {

    console.log('deliveries_list deliveriesCBFailure: ' + error);
};

var display = function() {
  resumeFn(0);
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
    if (deliveriesResultSet.getCount() === 0) {
      $('#title').addClass('d-none');
      $('#error').removeClass('d-none');
    } else {
      $('#title').removeClass('d-none');
      $('#error').addClass('d-none');
    }

    var labelPrefix;
    if (util.getWorkflowMode() === util.workflow.none) {
      labelPrefix = odkCommon.localizeText(locale, 'distribution_name') + ' : ';
    } else {
      labelPrefix = odkCommon.localizeText(locale, 'item_name') + ' : ';
    }
    var detailPrefix = odkCommon.localizeText(locale, 'beneficiary_entity_id') + ' : ';
    var onclickHandler = deliveryOnClickFactory(deliveriesResultSet.getTableId());

    /* Number of rows displayed per 'chunk' - can modify this value */
    var chunk = 50;
    for (var i = idxStart; i < idxStart + chunk; i++) {
      if (i >= deliveriesResultSet.getCount()) {
        break;
      }

      var itemLabel;
      if (util.getWorkflowMode() === util.workflow.none) {
        itemLabel = labelPrefix + deliveriesResultSet.getData(i, 'distribution_name');
      } else {
        itemLabel = labelPrefix + deliveriesResultSet.getData(i, 'item_name');
      }

      listViewUtil.addListItem(
        itemLabel,
        onclickHandler,
        { rowId: deliveriesResultSet.getRowId(i) },
        [ detailPrefix + deliveriesResultSet.getData(i, 'beneficiary_entity_id') ]
      );
    }
    if (i < deliveriesResultSet.getCount()) {
        setTimeout(resumeFn, 0, i);
    }
};

var deliveryOnClickFactory = function (tableId) {
  return function (evt) {
    var rowId = $(evt.target).attr('rowId');
    console.log('clicked with rowId: ' + rowId);
    // make sure we retrieved the rowId
    if (rowId !== null && rowId !== undefined) {
      // we'll pass null as the relative path to use the default file
      odkTables.openDetailView(
        null,
        tableId,
        rowId,
        'config/tables/deliveries/health_assets/html/deliveries_detail.html');
    }
  }
};
