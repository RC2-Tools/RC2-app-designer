'use strict';

var idxStart = -1;
var membersResultSet = {};
var locale = odkCommon.getPreferredLocale();

var display = function() {
    return resumeFn(0);
};

/**
 * Called when page loads to display things (Nothing to edit here)
 */
var resumeFn = function(fIdxStart) {
    var renderPromise = new Promise( function(resolve, reject) {
        odkData.getViewData(resolve, reject);
    }).then( function(result) {
        membersResultSet = result;

        return displayGroup(idxStart);
    });


    idxStart = fIdxStart;
    console.log('resumeFn called. idxStart: ' + idxStart);
    return renderPromise;
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
    if (membersResultSet.getCount() === 0) {
        $('#title').addClass('d-none');
        $('#error').removeClass('d-none');
    } else {
        $('#title').removeClass('d-none');
        $('#error').addClass('d-none');
    }

    var searchParam = util.getQueryParameter('searchParam');
    var localizedSearchParam = !!searchParam ? odkCommon.localizeText(locale, searchParam) || searchParam : null;

    /* Number of rows displayed per 'chunk' - can modify this value */
    var dbActions = [];
    var chunk = 50;
    for (var i = idxStart; i < idxStart + chunk; i++) {
        if (i >= membersResultSet.getCount()) {
            break;
        }

        var memberDetail = null;
        // first_last_name is included in the default label
        if (!!searchParam && searchParam !== 'first_last_name') {
            memberDetail = [
                localizedSearchParam + ': ' + membersResultSet.getData(i, 'searchResult')
            ]
        }

        listViewUtil.addListItem(
          '', // set by setMemberName
          membersOnClick,
          {
              rowId: membersResultSet.getRowId(i),
              customRowId: membersResultSet.getData(i, 'custom_member_row_id'),
              id: membersResultSet.getData(i, '_id'),
              householdRowId: membersResultSet.getData(i, 'beneficiary_entity_row_id')
          },
          memberDetail
        );

        // TODO: use arbitrary query instead
        dbActions.push(setMemberName(
          membersResultSet.getData(i, '_id'),
          membersResultSet.getData(i, 'custom_member_row_id')
        ));
    }

    if (i < membersResultSet.getCount()) {
        setTimeout(resumeFn, 0, i);
    }
    return Promise.all(dbActions);
};

var membersOnClick = function (evt) {
    var tableId = util.getMemberCustomFormId();
    var containingDiv = $(evt.target);

    var rowId = containingDiv.attr('rowId');
    var customRowId = containingDiv.attr('customRowId');
    var householdRowId = containingDiv.attr('householdRowId');
    console.log('clicked with rowId: ' + rowId);
    // make sure we retrieved the rowId
    if (rowId !== null && rowId !== undefined &&
      customRowId !== null && customRowId !== undefined) {
        // we'll pass null as the relative path to use the default file
        if (util.getQueryParameter('type') === 'search') {
            dataUtil.getRow(util.beneficiaryEntityTable, householdRowId)
              .then( function(baseResult) {
                  if (baseResult.getCount() === 0) {
                      // populate error message
                      return;
                  }
                  odkTables.openDetailWithListView(null, util.getBeneficiaryEntityCustomFormId(),
                    baseResult.get('custom_beneficiary_entity_row_id'), 'config/tables/'
                    + util.beneficiaryEntityTable + '/html/' + util.beneficiaryEntityTable +
                    '_detail.html?type=registration&rootRowId=' + encodeURIComponent(householdRowId));
              });
        } else {
            odkTables.openDetailView(null, tableId, customRowId,
              'config/tables/' + util.membersTable + '/html/' + util.membersTable + '_detail.html?rootRowId=' +
              encodeURIComponent(rowId));
        }
    }
};

var setMemberName = function (memberRowId, customMemberRowId) {
    return new Promise( function(resolve, reject) {
        odkData.query(util.getMemberCustomFormId(), '_id = ?', [customMemberRowId],
          null, null, null, null, null, null, true, resolve, reject);
    }).then( function(customMemberResultSet) {
        var first_last_name = customMemberResultSet.getData(0, 'first_last_name');
        document.getElementById(memberRowId).innerText = 'Name' + ": " + first_last_name;
    })
};
