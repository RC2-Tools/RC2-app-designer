/**
 * Render the overrides start page
 */
'use strict';

function display() {
    document.getElementById("registration").onclick = function() {
        odkTables.launchHTML(null,
                             'config/assets/html/override_choose.html?' +
                             '&type=override_beneficiary_entity_status');
    };

    document.getElementById("distribution").onclick = function() {
        odkTables.launchHTML(null,
            'config/assets/html/distribution_overrides.html');
    };
}
