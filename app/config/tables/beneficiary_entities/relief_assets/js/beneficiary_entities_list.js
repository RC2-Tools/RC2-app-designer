/**
 * Render registration list
 */
'use strict';

var idxStart = -1;
var beneficiaryEntitiesResultSet = {};
var locale = odkCommon.getPreferredLocale();

/**
 * Called when page loads to display things (Nothing to edit here)
 */
var registrationCBSuccess = function(result) {
    beneficiaryEntitiesResultSet = result;
    console.log(result.getCount());

    return (function() {
        displayGroup(idxStart);
    }());
};

var registrationCBFailure = function(error) {

    console.log('registration_list registrationCBFailure: ' + error);
};

var display = function() {
    resumeFn(0);
};

/**
 * Called when page loads to display things (Nothing to edit here)
 */
var resumeFn = function(fIdxStart) {
    odkData.getViewData(registrationCBSuccess, registrationCBFailure);

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
    if (beneficiaryEntitiesResultSet.getCount() === 0) {
        $('#title').addClass('d-none');
        $('#error').removeClass('d-none');
    } else {
        $('#title').removeClass('d-none');
        $('#error').addClass('d-none');
    }

    var searchParam = util.getQueryParameter('searchParam');
    var localizedSearchParam = !!searchParam ? odkCommon.localizeText(locale, searchParam) || searchParam : null;

    /* Number of rows displayed per 'chunk' - can modify this value */
    var chunk = 50;
    for (var i = idxStart; i < idxStart + chunk; i++) {
        if (i >= beneficiaryEntitiesResultSet.getCount()) {
            break;
        }

        var beneficiaryDetail = null;
        // beneficiary_entity_id is included in the default label
        if (!!searchParam && searchParam !== 'beneficiary_entity_id') {
            beneficiaryDetail = [
              localizedSearchParam + ': ' + beneficiaryEntitiesResultSet.getData(i, 'searchResult')
            ]
        }

        listViewUtil.addListItem(
          'Beneficiary Entity ID: ' + beneficiaryEntitiesResultSet.getData(i, 'beneficiary_entity_id'),
          beneficiaryEntityOnClick,
          {
              rootRowId: beneficiaryEntitiesResultSet.getRowId(i),
              customRowId: beneficiaryEntitiesResultSet.getData(i, "custom_beneficiary_entity_row_id"),
              id: beneficiaryEntitiesResultSet.getData(i, '_id')
          },
          beneficiaryDetail
        );
    }
    if (i < beneficiaryEntitiesResultSet.getCount()) {
        setTimeout(resumeFn, 0, i);
    }
};

var beneficiaryEntityOnClick = function (evt) {
    var targetElem = $(evt.target);

    var rootRowId = targetElem.attr('rootRowId');
    var customRowId = targetElem.attr('customRowId');
    console.log('clicked with rootRowId: ' + rootRowId);
    // make sure we retrieved the rootRowId
    if (rootRowId !== null && rootRowId !== undefined) {
        // we'll pass null as the relative path to use the default file
        var launchType = util.getQueryParameter('type');
        if (launchType === 'override_beneficiary_entity_status') {
            odkTables.openDetailView(null, util.getBeneficiaryEntityCustomFormId(), customRowId,
              'config/tables/' + util.beneficiaryEntityTable + '/relief_assets/html/' + util.beneficiaryEntityTable + '_detail.html?type=' +
              encodeURIComponent(launchType) + '&rootRowId=' + encodeURIComponent(rootRowId));

        } else {
            odkTables.openDetailWithListView(null, util.getBeneficiaryEntityCustomFormId(), customRowId,
              'config/tables/' + util.beneficiaryEntityTable + '/relief_assets/html/' + util.beneficiaryEntityTable + '_detail.html?type=' +
              encodeURIComponent(launchType) + '&rootRowId=' + encodeURIComponent(rootRowId));
        }
    }
};
