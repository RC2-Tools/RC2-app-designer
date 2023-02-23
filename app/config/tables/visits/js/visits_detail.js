'use strict';

var locale = odkCommon.getPreferredLocale();

function display() {
    odkData.getViewData(visitDataCallbackSuccess, visitDataCallbackFailure)

    $('#title').text(odkCommon.localizeText(locale, 'beneficiary_entity_id') + ": " + util.getQueryParameter('rcId'));

    document
      .getElementById('visitDetailEditBtn')
      .addEventListener('click', function () {
          odkTables.editRowWithSurvey(
            null,
            util.getQueryParameter('tableId'),
            util.getQueryParameter('rowId'),
            util.getQueryParameter('formId'),
            null
          )
      })
}

function visitDataCallbackSuccess(result) {
    util.populateDetailViewArbitrary([result], null, "field_list", locale, []);
}

function visitDataCallbackFailure(reason) {
    console.log('failed with message: ' + reason);
}
