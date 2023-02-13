'use strict';

var idxStart = -1;
var authorizationsResultSet = {};
var actionTypeKey = "actionTypeKey";
var type = util.getQueryParameter('type');


var authorizationsCBSuccess = function(result) {
    authorizationsResultSet = result;
    if (authorizationsResultSet.getCount() === 0) {
        $('#title').addClass('d-none');
        $('#error').removeClass('d-none');
    } else {
        $('#title').removeClass('d-none');
        $('#error').addClass('d-none');

        displayGroup(idxStart);
    }
};

var authorizationsCBFailure = function(error) {

    console.log('authorizations_list authorizationsCBFailure: ' + error);
};

var display = function() {
    resumeFn(0);
};

var resumeFn = function(fIdxStart) {
    var joinQuery;
    if (type === 'new_ent') {
        joinQuery = "SELECT * FROM " + util.authorizationTable + " WHERE extra_field_entitlements='ONE' OR extra_field_entitlements='MANY'" ;
    } else if (type === 'deliveries') {
        joinQuery = "SELECT * FROM " + util.authorizationTable;
    }


  odkData.arbitraryQuery(util.authorizationTable, joinQuery, [], null, null,
            authorizationsCBSuccess, authorizationsCBFailure);

    idxStart = fIdxStart;
    console.log('resumeFn called. idxStart: ' + idxStart);
};

var displayGroup = function(idxStart) {
    console.log('displayGroup called. idxStart: ' + idxStart);

    /* Number of rows displayed per 'chunk' - can modify this value */
    console.log(authorizationsResultSet.getColumns());
    var chunk = 50;
    for (var i = idxStart; i < idxStart + chunk; i++) {
        if (i >= authorizationsResultSet.getCount()) {
            break;
        }

        listViewUtil.addListItem(
          authorizationsResultSet.getData(i, 'distribution_name'),
          authListOnClickHandler,
          { rowId: authorizationsResultSet.getRowId(i) },
          [ authorizationsResultSet.getData(i, 'item_name') ]
        );
    }

    if (i < authorizationsResultSet.getCount()) {
        setTimeout(resumeFn, 0, i);
    }
};

var authListOnClickHandler = function (evt) {
    var rowId = $(evt.target).attr('rowId');

    console.log('clicked with rowId: ' + rowId);
    // make sure we retrieved the rowId
    if (rowId !== null && rowId !== undefined) {
        if (type === 'new_ent') {
            odkTables.launchHTML(null,
              'config/relief_assets/html/new_entitlement.html?authorization_id=' + rowId);
        } else {
            odkTables.openDetailView(null, util.authorizationTable, rowId,
              'config/relief_assets/html/progress_summary.html');
        }
    }
};
