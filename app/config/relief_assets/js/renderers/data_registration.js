/**
 * Render the data options page
 */
'use strict';

// Displays homescreen
function display() {
    var enabledBeneficiaryEntities = document.getElementById('enabledBeneficiaryEnt');
    enabledBeneficiaryEntities.onclick = function() {
        odkTables.openTableToListView(
          null,
          util.beneficiaryEntityTable,
          '(status = ? or status = ?)',
          ['ENABLED', 'enabled'],
          'config/tables/' + util.beneficiaryEntityTable + '/relief_assets/html/' + util.beneficiaryEntityTable + '_list.html?type=delivery');
    };

    var disabledBeneficiaryEntities = document.getElementById('disabledBeneficiaryEnt');
    disabledBeneficiaryEntities.onclick = function() {
        odkTables.openTableToListView(
          null,
          util.beneficiaryEntityTable,
          '(status = ? or status = ?)',
          ['DISABLED', 'disabled'],
          'config/tables/' + util.beneficiaryEntityTable + '/relief_assets/html/' + util.beneficiaryEntityTable + '_list.html?type=delivery');
    };

    var beneficiaryEntitySearch = document.getElementById('searchBeneficiaryEnt');
    beneficiaryEntitySearch.onclick = function() {
        odkTables.launchHTML(null,
          'config/relief_assets/html/search.html?type=' + util.getBeneficiaryEntityCustomFormId());
    };

    var resolvedLocalizationSuffix;
    if (util.getRegistrationMode() === 'HOUSEHOLD') {
        resolvedLocalizationSuffix = '_households';
    } else {
        resolvedLocalizationSuffix = '_beneficiaries';
    }

    enabledBeneficiaryEntities.querySelector('span:last-of-type').dataset.localize =
      'enabled' + resolvedLocalizationSuffix;

    disabledBeneficiaryEntities.querySelector('span:last-of-type').dataset.localize =
      'disabled' + resolvedLocalizationSuffix;

    beneficiaryEntitySearch.querySelector('span:last-of-type').dataset.localize =
      'search' + resolvedLocalizationSuffix;

    if (util.getRegistrationMode() === 'HOUSEHOLD') {
        document.getElementById('searchMember').onclick = function() {
            odkTables.launchHTML(null,
              'config/relief_assets/html/search.html?type=' + util.getMemberCustomFormId());
        };
    } else {
        document.getElementById('searchMember').remove();
    }
}
