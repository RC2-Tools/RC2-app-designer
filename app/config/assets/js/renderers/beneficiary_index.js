/**
 * Render index.html
 */
'use strict';

// Displays homescreen

var beneficiaryIndex = {};

beneficiaryIndex.display = function() {
    $('.menu-item').hide();
    $('.' + util.workflowToClass[util.getWorkflowMode()]).show();

    var registerBtn = document.getElementById('register');

    if (util.getWorkflowMode() === util.workflow.idOnly) {
        registerBtn.onclick = function () {
            odkTables.launchHTML(null, 'config/assets/html/choose_location.html');
        };
    } else {
        registerBtn.onclick = function() {
            odkTables.launchHTML(null, 'config/assets/html/registration.html');
        };
    }

    if (util.getBeneficiaryEntityCustomFormId()) {
        registerBtn.disabled = false;
    } else {
        registerBtn.disabled = true;
    }

    document.getElementById('deliver').onclick = function() {
        odkTables.launchHTML(null, 'config/assets/html/delivery.html');
    };

    document.getElementById('visit').onclick = function() {
        odkTables.launchHTML(null, 'config/assets/html/visit.html');
    };

    document.getElementById('data').onclick = function() {
        odkTables.launchHTML(null,
                             'config/assets/html/data_start.html');
    };

    if (util.getWorkflowMode() === util.workflow.idOnly) {
        return Promise.resolve();
    } else {
        return util.renderSuperuserFeatures(function() {
            document.getElementById('overrides').onclick = function() {
                odkTables.launchHTML(null, 'config/assets/html/overrides_start.html');
            };
        });
    }
};
