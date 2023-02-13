'use strict';

function display() {
    document.getElementById("newEntitlement").onclick = function() {
        odkTables.launchHTML(null,
          'config/tables/' + util.authorizationTable + '/html/' + util.authorizationTable + '_list.html?type=new_ent');
    };

    document.getElementById("changeEntStatus").onclick = function() {
        odkTables.launchHTML(null,
          'config/relief_assets/html/override_choose.html?type=override_ent_status');
    };

    document.getElementById("distribution_report").onclick = function() {
        odkTables.launchHTML(null,
          'config/tables/' + util.distributionTable + '/html/' + util.distributionTable + '_list_field_report.html');
    };
}
