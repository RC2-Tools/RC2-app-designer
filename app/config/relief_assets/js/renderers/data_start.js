/**
 * Render the data start page
 */
'use strict';

function display() {
    document.getElementById("beneficiary").onclick = function() {
        odkTables.launchHTML(null,
                             'config/relief_assets/html/data_registration.html');
    };

    document.getElementById("delivery").onclick = function() {
        odkTables.launchHTML(null,
                             'config/relief_assets/html/data_delivery.html');
    };
}
