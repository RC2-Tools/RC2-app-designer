'use strict';

function triggerAuthorizationCreation() {
  var locale = odkCommon.getPreferredLocale();

  var newDistUuid = util.genUUID();
  var newAuthUuid = util.genUUID();
  var newDistName = document.getElementById('code').value;

  new Promise(function (resolve, reject) {
    odkData.addRow(
      util.distributionTable,
      {
        name: newDistName,
        status: 'ACTIVE',
        date_created: util.getCurrentOdkTimestamp(),
      },
      newDistUuid,
      resolve,
      reject
    );
  })
    .then(function (result) {
      return new Promise(function (resolve, reject) {
        odkData.addRow(
          util.authorizationTable,
          {
            status: 'ACTIVE',
            type: util.workflow.none,
            date_created: util.getCurrentOdkTimestamp(),
            extra_field_entitlements: 'NONE',
            distribution_id: newDistUuid,
            distribution_name: newDistName
          },
          newAuthUuid,
          resolve,
          reject
        );
      });
    })
    .then(dataUtil.reconcileTokenAuthorizations)
    .then(function (result) {
      $('#trigger').prop('disabled', true);
      $('#confirmation').text(odkCommon.localizeText(locale, 'create_authorization_success'));
    })
    .catch(function (error) {
      $('#confirmation').text(odkCommon.localizeText(locale, 'create_authorization_failed'));
    });
}