'use strict';

function display() {
  var currAuthRowId;

  return dataUtil
    .reconcileTokenAuthorizations()
    .then(dataUtil.getCurrentTokenAuthorizations)
    .then(function (result) {
      return new Promise(function (resolve, reject) {
        if (result.getCount() > 0) {
          odkData.getRows(util.distributionTable, result.getData(0, 'distribution_id'), resolve, reject);
          currAuthRowId = result.getData(0, '_id');
        }
      });
    })
    .then(function (result) {
      $('#title').text(result.getData(0, 'name'));

      $('#trigger').click(function () {
        triggerAuthorizationTermination(currAuthRowId);
      });
    });
}

function triggerAuthorizationTermination(authRowId) {
  var locale = odkCommon.getPreferredLocale();

  dataUtil
    .setToInactiveByRowId(util.authorizationTable, authRowId)
    .then(dataUtil.disableTokenDistributions)
    .then(function (result) {
      $('#trigger').prop('disabled', true);
      $('#confirmation').text(odkCommon.localizeText(locale, 'terminate_authorization_success'));
    })
    .catch(function (error) {
      console.log(error);
      $('#confirmation').text(odkCommon.localizeText(locale, 'terminate_authorization_failed'));
    });
}
