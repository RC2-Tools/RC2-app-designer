'use strict';


function display() {
    return dataUtil
      .reconcileTokenAuthorizations()
      .then(dataUtil.getCurrentTokenAuthorizations)
      .then(function (result) {
          var numAuthorizations = result.getCount();

          var terminate = document.getElementById('terminate');
          terminate.onclick = function() {
              odkTables.launchHTML(null,
                'config/relief_assets/html/token_authorization_terminator.html');
          };
          if (numAuthorizations === 0) {
              terminate.disabled = true;
          }

          var create = document.getElementById('create');
          if (numAuthorizations > 0) {
              create.disabled = true;
          }
          create.onclick = function() {
              odkTables.launchHTML(null,
                'config/relief_assets/html/token_authorization_creator.html');
          };
      });
}
