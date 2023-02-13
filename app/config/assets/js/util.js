/* global */
/**
 * Various functions that we might need across screens.
 */
'use strict';


/**
 * util function object provides utility functions which do not interface with data tables
 */
var util = {};

/**
 * util constants
 */

util.workflow = {};
util.workflow.none = 'NO_REGISTRATION';
util.workflow.optional = 'OPTIONAL_REGISTRATION';
util.workflow.required = 'REQUIRED_REGISTRATION';
util.workflow.idOnly = 'ID_ONLY_REGISTRATION';

util.workflowToClass = {
    [util.workflow.idOnly]: 'workflow-id-only',
    [util.workflow.required]: 'workflow-required',
    [util.workflow.optional]: 'workflow-optional',
    [util.workflow.none]: 'workflow-none'
};

/************************** General Util functions *********************************/

/**
 * Get the query parameter from the url. Note that this is kind of a hacky/lazy
 * implementation that will fail if the key string appears more than once, etc.
 */
util.getQueryParameter = function(key) {
    var href = document.location.search;
    var startIndex = href.search(key);
    if (startIndex < 0) {
        console.log('requested query parameter not found: ' + key);
        return null;
    }
    // Then we want the substring beginning after "key=".
    var indexOfValue = startIndex + key.length + 1;  // 1 for '='
    // And now it's possible that we have more than a single url parameter, so
    // only take as many characters as we need. We'll stop at the first &,
    // which is what specifies more keys.
    var fromValueOnwards = href.substring(indexOfValue);
    var stopAt = fromValueOnwards.search('&');
    if (stopAt < 0) {
        return decodeURIComponent(fromValueOnwards);
    } else {
        return decodeURIComponent(fromValueOnwards.substring(0, stopAt));
    }
};

util.genUUID = function() {
    // construct a UUID (from http://sta ckoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript )
    var id = 'uuid:' +
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = (c === 'x') ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    return id;
};


util.setJSONMap = function(JSONMap, key, value) {
    if (value !== null && value !== undefined) {
        JSONMap[key] = value;
    }
};

util.getCurrentOdkTimestamp = function() {
    return odkCommon.toOdkTimeStampFromDate(new Date());
};

util.populateDetailView = function(resultSet, parentDiv, locale, exclusionList) {
    if (resultSet.getCount() > 0) {
        var columns = resultSet.getColumns();
        var fieldListDiv = $('#' + parentDiv);
        for (var i = 0; i < columns.length; i++) {
            if (!exclusionList.includes(columns[i]) && !columns[i].startsWith("_")) {
                var line = util.buildDetailViewPTag(columns[i]).appendTo(fieldListDiv);
                if (columns[i] === 'date_created') {
                    var dateObj = odkCommon.toDateFromOdkTimeStamp(resultSet.get(columns[i]));
                    if (dateObj !== null && dateObj !== undefined && dateObj !== "") {
                        util.buildDetailViewSpanTag('inner_' + columns[i], dayjs(dateObj).format('YYYY-MM-DD')).appendTo(line);
                    }
                }
                else {
                    var columnValue = util.formatColumnValues(resultSet, columns[i]);
                    util.buildDetailViewSpanTag('inner_' + columns[i], columnValue).appendTo(line);
                }
                line.prepend(odkCommon.localizeText(locale, columns[i]) + ": ");
            }

        }
    }
};

util.formatColumnValues = function(resultSet, column) {
    var dataTableModel = resultSet.getMetadata().dataTableModel[column];
    if (dataTableModel && dataTableModel.elementType == 'date') {
        return dayjs(odkCommon.toDateFromOdkTimeStamp(resultSet.get(column))).format('YYYY-MM-DD');
    } else if (dataTableModel && dataTableModel.elementType == 'datetime') {
        return dayjs(odkCommon.toDateFromOdkTimeStamp(resultSet.get(column))).format('hh:mm:ss A, YYYY-MM-DD');
    } else if (dataTableModel && dataTableModel.elementType == 'time') {
        return dayjs(odkCommon.toDateFromOdkTimeStamp(resultSet.get(column))).format('hh:mm:ss A');
    } else if (dataTableModel && dataTableModel.elementType == 'date_no_time') {
        return dayjs(odkCommon.toDateFromOdkTimeStamp(resultSet.get(column))).format('YYYY-MM-DD');
    } else {
        return resultSet.get(column);
    }
}

// populates detail view with just one key value pair
util.populateDetailViewKeyValue = function(key, value, parentDiv, locale) {
    var line = util.buildDetailViewPTag(key).appendTo($('#' + parentDiv));
    util.buildDetailViewSpanTag('inner_' + key, value).appendTo(line);
    line.prepend(odkCommon.localizeText(locale, key) + ": ");
};

// resultSets: array of odk result sets
// kvPairs: json of key value pairs
// parentDiv: html element to add to
// locale: locale for translations
util.populateDetailViewArbitrary = function(resultSets, kvPairs, parentDiv, locale, exclusionList, sortList) {
    // TODO: sortList doesn't work and is not used anywhere

    var mergeResult = {};

    resultSets.forEach(function(rs) {
        rs.getColumns().forEach(function(column) {
            mergeResult[column] = util.formatColumnValues(rs, column);
        });
    });

    if (kvPairs !== undefined && kvPairs != null) {
        $.extend(mergeResult, kvPairs);
    }

    var keys = Object.keys(mergeResult).sort();

    var fieldListDiv = $('#' + parentDiv);

    if (sortList !== null && sortList !== undefined && sortList.length > 0) {
        while (sortList.length > 0) {
            var key = sortList.shift();
            if (keys.includes(key)) {
                util.fillDetailViewArbitrary(mergeResult, fieldListDiv, key, locale);
            }
            key = (odkCommon.localizeText(locale, key) !== null && odkCommon.localizeText(locale, key) !== undefined) ?
                odkCommon.localizeText(locale, key) : key;

            line.prepend(key + ": ");
        }
    } else {
        keys.forEach(function(key) {
            if (!key.startsWith("_") && !exclusionList.includes(key)) {
                util.fillDetailViewArbitrary(mergeResult, fieldListDiv, key, locale);
            }
        });

    }
};

util.fillDetailViewArbitrary = function(mergeResult, fieldListDiv, key, locale) {
    var line = util.buildDetailViewPTag(key).appendTo(fieldListDiv);

    if (key === 'date_created') {
        var dateObj = odkCommon.toDateFromOdkTimeStamp(mergeResult[key]);
        if (dateObj !== null && dateObj !== undefined && dateObj !== "") {
            util.buildDetailViewSpanTag('inner_' + key, dayjs(dateObj).format('YYYY-MM-DD')).appendTo(line);
        }
    }
    else {
        util.buildDetailViewSpanTag('inner_' + key, mergeResult[key]).appendTo(line);
    }
    key = (odkCommon.localizeText(locale, key) !== null && odkCommon.localizeText(locale, key) !== undefined) ?
        odkCommon.localizeText(locale, key) : key;
    line.prepend(key + ": ");
};

util.buildDetailViewPTag = function(id) {
    return $('<p>')
      .attr('id', id)
      .addClass('font-weight-bold');
};

util.buildDetailViewSpanTag = function(id, text) {
    return $('<span>')
      .attr('id', id)
      .text(text)
      .addClass('font-weight-normal');
};

util.displayError = function(text) {
    var locale = window.locale || odkCommon.getPreferredLocale();

    bootbox.alert({
        message: text,
        buttons: {
            ok: {
                label: odkCommon.localizeText(locale, 'ok'),
                className: 'btn-danger'
            }
        }
    });
};

util.displayConfirm = function(text, callback) {
    var locale = window.locale || odkCommon.getPreferredLocale();

    bootbox.alert({
        message: odkCommon.localizeText(locale, text) || text,
        buttons: {
            ok: {
                label: odkCommon.localizeText(locale, 'ok'),
                className: 'btn-danger'
            }
        },
        callback: callback
    });
}

util.localizePage = function() {
    var elemToLocalize = document.querySelectorAll('[data-localize]');
    if (elemToLocalize.length < 1) {
        return;
    }

    var locale = window.locale || odkCommon.getPreferredLocale();
    for (var elem of elemToLocalize) {
        elem.innerText = odkCommon.localizeText(locale, elem.dataset['localize']) || '';
    }
};

util.renderSuperuserFeatures = function(featureSetupFunc) {
    return new Promise(function(resolve, reject) {
        odkData.getRoles(resolve, reject);
    }).then(function(result) {
        var roles = result.getRoles();
        console.log(roles);
        if ($.inArray('ROLE_SUPER_USER_TABLES', roles) > -1) {
            featureSetupFunc();
            $('.workflow-superuser').show();
        } else {
            for (var elem of document.querySelectorAll('.workflow-superuser')) {
                elem.remove();
            }
        }
    }).catch( function(reason) {
        console.log('roles failed with error: ' + error);
    });
};

util.resolveViewPath = function (tableId, viewType, moduleDir) {
    return `config/tables/${tableId}/${moduleDir}/html/${tableId}_${viewType}.html`;
}

function custom_alert( message, title ) {
    if ( !title )
        title = 'Alert';

    if ( !message )
        message = 'No Message to Display.';

    $('<div></div>').html( message ).dialog({
        title: title,
        resizable: false,
        modal: true,
        buttons: {
            'Ok': function()  {
                $( this ).dialog( 'close' );
            }
        }
    });
}


/************************** Red Cross Constants *********************************/

util.beneficiaryEntityTable = 'beneficiary_entities';
util.membersTable = 'members';
util.authorizationTable = 'authorizations';
util.entitlementTable = 'entitlements';
util.deliveryTable = 'deliveries';
util.distributionTable = 'distributions';
util.distributionReportTable = 'distribution_reports';
util.visitsTable = "visits";
util.visitProgramsTable = "visit_programs";
util.servicesTable = 'services';
util.beneficiaryServicesTable = 'beneficiary_services';
util.referralsTable = 'referrals';
util.savepointSuccess = "COMPLETE";
util.configPath = odkCommon.getBaseUrl() + 'config/assets/config.json';
util.actionTypeKey = 'actionTypeKey';

util.rootRowIdKey = 'rootRowId';
util.customFormIdKey = 'customFormId';
util.additionalCustomFormsObj = {};
util.additionalCustomFormsObj.dispatchKey = "additionalCustomForms";
util.additionalCustomFormsObj.formIdKey = "formId";
util.additionalCustomFormsObj.foreignReferenceKey = "foreignReferenceKey";
util.additionalCustomFormsObj.valueKey = "value";

util.departmentParam = 'department';
util.pamParam = 'pam';

/************************** Red cross config getters *********************************/

var configSingleton;

$.ajax({
    url: util.configPath,
    success: function( json ) {
        configSingleton = JSON.parse(json);
        util.getRegistrationMode = function() {
            return configSingleton['REGISTRATION_MODE'];
        };

        util.getWorkflowMode = function() {
            return configSingleton['WORKFLOW_MODE'];
        };

        util.getBeneficiaryEntityCustomFormId = function() {
            return configSingleton['BENEFICIARY_ENTITY_CUSTOM_FORM_ID'];
        };

        util.getMemberCustomFormId = function() {
            return configSingleton['MEMBER_CUSTOM_FORM_ID'];
        };

        util.getTokenAuthorizationFormId = function() {
            return 'authorizations';
        };

        util.getCustomBeneficiaryRowIdColumn = function() {
            return configSingleton['CUSTOM_BENEFICIARY_ROW_ID_COLUMN'];
        };

        util.getModule = function() {
            return configSingleton['MODULE'];
        };
    },
    async: false
});

/************************** UI Rendering Util Functions *********************************/

util.renderPage = function(renderFunction) {
    var mainElem = document.getElementById('main');
    mainElem.style.display = 'none';

    Promise
      .resolve(renderFunction())
      .then(util.localizePage)
      .then(function() {
          mainElem.style.display = 'flex';
      });
};


/**
 * dataUtil function object provides utility functions which interface with data tables
 */
var dataUtil = {};

dataUtil.getHouseholdSize = function(foreignRowId) {
    if (util.getRegistrationMode() !== 'HOUSEHOLD') {
        return null;
    }
    return new Promise(function(resolve, reject) {
        odkData.arbitraryQuery(util.membersTable, 'SELECT count(*) AS size from ' +
        util.membersTable + ' where beneficiary_entity_row_id = ?',
            [foreignRowId], null, null, resolve, reject);
    }).then(function(result) {
        return result.getData(0, 'size');
    });
};

dataUtil.getViewData = function() {
    return new Promise(function(resolve, reject) {
        odkData.getViewData(resolve, reject);
    });
};

dataUtil.getRow = function(tableId, rowId) {
    return new Promise(function(resolve, reject) {
        odkData.query(tableId, '_id = ?', [rowId],
            null, null, null, null, null, null, true, resolve, reject);
    });
};

dataUtil.deleteRow = function(tableId, rowId) {
    return new Promise(function(resolve, reject) {
        odkData.deleteRow(tableId, null, rowId, resolve, reject);
    });
};

dataUtil.entitlementIsDelivered = function(entitlement_id) {
    return new Promise(function(resolve, reject) {
        odkData.query(util.deliveryTable, 'entitlement_id = ?',
            [entitlement_id], null, null, null, null, null,
            null, true, resolve, reject);
    }).then(function(result) {
        return result.getCount() !== 0;
    }).catch( function(reason) {
        odkCommon.log('E', 'Failed to check if entitlement is delivered: ' + reason);
        return false;
    });
};

util.triggerVisit = function(visitId, actionTypeValue, dispatchStruct) {
    var visitRow;
    var customVisitRowId;
    return new Promise(function(resolve, reject) {
        odkData.query(util.visitsTable, '_id = ?', [visitId],
            null, null, null, null, null, null, true, resolve, reject);
    }).then(function(result) {
        visitRow = result;
        if (visitRow === undefined || visitRow.getCount === 0) {
            return Promise.reject('Failed to retrieve visit.');
        }

        customVisitRowId = visitRow.getData(0, 'custom_visit_row_id');

        if (customVisitRowId === null || customVisitRowId === undefined) {
            customVisitRowId = util.genUUID();
            return new Promise(function(resolve, reject) {
                var jsonMap = {};
                jsonMap['custom_visit_row_id'] = customVisitRowId;
                odkData.updateRow(util.visitsTable, jsonMap, visitId, resolve, reject);
            });
        }

        return Promise.resolve(null);

    }).then(function(result) {
        if (dispatchStruct === undefined || dispatchStruct === null) {
            dispatchStruct = {};
        }

        dispatchStruct[util.actionTypeKey] = actionTypeValue;
        dispatchStruct[util.rootRowIdKey] = visitId;
        dispatchStruct[util.customFormIdKey] = visitRow.getData(0, 'custom_visit_form_id');
        var jsonStruct = JSON.stringify(dispatchStruct);

        odkTables.editRowWithSurvey(jsonStruct, visitRow.getData(0, 'custom_visit_table_id'), customVisitRowId,
            visitRow.getData(0, 'custom_visit_form_id'), null);
    }).catch(function(reason) {
        console.log('Could not update row in visit table: ' + reason);
    });
};

dataUtil.tableExists = function(tableId) {
    return new Promise( function(resolve, reject) {
        odkData.getAllTableIds(resolve, reject);
    }).then( function(result) {
        return Promise.resolve(result.getAllTableIds().includes(tableId));
    });
};

/**
 * Generic method to create and launch survey for a custom row based off of a root row
 * @param baseEntry is the base table row
 * @param customTableNameKey is the column name in the base table to find the custom form id
 * @param customFormForeignKey is the column in the base table to find what the custom row id should be set to
 * @param actionTypeValue is the actionType to set to the dispatchStruct actionTypeKey for clients to customize handlers for returning from Survey
 * @param dispatchStruct is an optional parameter which can be used to prepopulate the dispatchStruct with additonal custom values (useful for leveraging the additionalCustomForms schema)
 * @param visibilityColumn is the column of the group permission we are setting
 * @param jsonMap is an optionally pre-populated map of kv pairs to populate the new row with
 */

dataUtil.createCustomRowFromBaseEntry = function(baseEntry, customTableNameKey, customFormForeignKey, actionTypeValue, dispatchStruct, visibilityColumn, jsonMap, jsonMapSurvey) {
    var rootDeliveryRowId = baseEntry.get('_id');
    var customFormId = baseEntry.get(customTableNameKey);
    var customDeliveryRowId = baseEntry.get(customFormForeignKey);
    if (!baseEntry || baseEntry.getCount === 0) {
        throw ('Base table entry is invalid');
    }
    if (jsonMap === null) {
        jsonMap = {};
    }

    // We also need to add group permission fields
    util.setJSONMap(jsonMap, visibilityColumn, baseEntry.get(visibilityColumn));

    util.setJSONMap(jsonMap, '_row_owner', odkCommon.getActiveUser());

    util.setJSONMap(jsonMap, '_default_access', baseEntry.get('_default_access'));

    return new Promise(function (resolve, reject) {
        odkData.query(customFormId, null, null, null, null, null, null, 1, null, null, resolve, reject);
    }).then(function(result) {
        if (result !== null && result !== undefined) {
            var customCols = result.getColumns();
            dataUtil.cleanJsonMap(customCols, jsonMap);

            return new Promise(function (resolve, reject) {
                odkData.addRow(customFormId, jsonMap, customDeliveryRowId, resolve, reject);
            }).then(function (result) {
                if (dispatchStruct === undefined || dispatchStruct === null) {
                    dispatchStruct = {};
                }
                util.setJSONMap(dispatchStruct, util.actionTypeKey, actionTypeValue);
                util.setJSONMap(dispatchStruct, util.rootRowIdKey, rootDeliveryRowId);
                util.setJSONMap(dispatchStruct, util.customFormIdKey, customFormId);
                dataUtil.editRowWithJson(JSON.stringify(dispatchStruct), customFormId, customDeliveryRowId, customFormId, null, jsonMapSurvey);
            });
        }
    });
};

dataUtil.editRowWithJson = function (dispatchStruct, tableId, rowId, formId, screenPath, jsonMap) {
    if ( formId === undefined ) {
        formId = null;
    }
    if ((tableId === 'framework') && !((formId === null) || (formId === 'framework'))) {
        throw 'editRowWithSurvey()--formId must be null or "framework" for framework form';
    }

    if ( screenPath === undefined ) {
        screenPath = null;
    }
    var platInfo = JSON.parse(odkCommon.getPlatformInfo());

    var uri = odkCommon.constructSurveyUri(tableId, formId, rowId, screenPath, jsonMap);

    var hashString = uri.substring(uri.indexOf('#'));

    var extrasBundle = { url: platInfo.baseUri + 'system/index.html' + hashString
    };

    var intentArgs = {
        // uri:      // set the data field of intent to this
        data: uri,   // unless data is supplied -- that takes precedence
        type: "vnd.android.cursor.item/vnd.opendatakit.form", // mime type
        // package:  // set the intent package to this value
        action: "android.intent.action.EDIT",
        category: "android.intent.category.DEFAULT",

        extras: extrasBundle
    };

    return odkCommon.doAction( dispatchStruct,
      "org.opendatakit.survey.activities.SplashScreenActivity",
      intentArgs );
};

dataUtil.cleanJsonMap = function(customCols, jsonMap) {
    var jsonMapKeys = Object.keys(jsonMap);
    for (var i = 0; i < jsonMapKeys.length; i++) {
        if (!customCols.includes(jsonMapKeys[i])) {
            // Remove the element from the jsonMap that isn't in the customTable
            delete jsonMap[jsonMapKeys[i]];
        }
    }
};

dataUtil.createCustomRowFromBaseTable = function(rootDeliveryRowId, customFormId, customDeliveryRowId, actionTypeValue,
                                                 dispatchStruct, defaultGroup, defaultAccess, jsonMap) {

    if (jsonMap === null) {
        jsonMap = {};
    }

    // We also need to add group permission fields
    util.setJSONMap(jsonMap, '_group_modify', defaultGroup);

    util.setJSONMap(jsonMap, '_row_owner', odkCommon.getActiveUser());

    util.setJSONMap(jsonMap, '_default_access', 'HIDDEN');

    return new Promise( function(resolve, reject) {
        odkData.query(customFormId, null, null, null, null, null, null, 1, null, null, resolve, reject);
    }).then(function(result) {
        if (result !== null && result !== undefined) {
            var customCols = result.getColumns();
            dataUtil.cleanJsonMap(customCols, jsonMap);

            return new Promise(function (resolve, reject) {
                odkData.addRow(customFormId, jsonMap, customDeliveryRowId, resolve, reject);
            }).then( function(result) {
                if (dispatchStruct === undefined || dispatchStruct === null) {
                    dispatchStruct = {};
                }
                util.setJSONMap(dispatchStruct, util.actionTypeKey, actionTypeValue);
                util.setJSONMap(dispatchStruct, util.rootRowIdKey, rootDeliveryRowId);
                util.setJSONMap(dispatchStruct, util.customFormIdKey, customFormId);
                odkTables.editRowWithSurvey(JSON.stringify(dispatchStruct), customFormId, customDeliveryRowId, customFormId, null);
            });
        }
    })
};

// extracts and validates whether a given authorization row has a valid customDeliveryFormId
dataUtil.isCustomDeliveryAuthorization = function(authorizationRow) {
    if (authorizationRow.getCount() === 0) {
        return false;
    } else {
        var customDeliveryFormId = authorizationRow.getData(0, 'custom_delivery_form_id');
        //TODO: verify that customDeliveryFormExists
        return customDeliveryFormId !== undefined && customDeliveryFormId !== null && customDeliveryFormId !== "" && customDeliveryFormId !== util.deliveryTable;
    }
};


//TODO: add date created attribute
dataUtil.addDeliveryRowByEntitlement = function(entitlementRow, customDeliveryFormId, customDeliveryRowId) {
    var jsonMap = {};
    util.setJSONMap(jsonMap, 'beneficiary_entity_id', entitlementRow.get('beneficiary_entity_id'));
    util.setJSONMap(jsonMap, 'member_id', entitlementRow.get('member_id'));
    util.setJSONMap(jsonMap, 'entitlement_id', entitlementRow.get('_id'));
    util.setJSONMap(jsonMap, 'authorization_id', entitlementRow.get('authorization_id'));
    util.setJSONMap(jsonMap, 'distribution_name', entitlementRow.get('distribution_name'));
    util.setJSONMap(jsonMap, 'authorization_type', entitlementRow.get('authorization_type'));
    util.setJSONMap(jsonMap, 'item_id', entitlementRow.get('item_id'));
    util.setJSONMap(jsonMap, 'item_name', entitlementRow.get('item_name'));
    util.setJSONMap(jsonMap, 'item_description', entitlementRow.get('item_description'));
    util.setJSONMap(jsonMap, 'is_override', entitlementRow.get('is_override'));
    util.setJSONMap(jsonMap, 'custom_delivery_form_id', customDeliveryFormId);
    util.setJSONMap(jsonMap, 'custom_delivery_row_id', customDeliveryRowId);
    util.setJSONMap(jsonMap, '_row_owner', odkCommon.getActiveUser());
    util.setJSONMap(jsonMap, 'date_created', util.getCurrentOdkTimestamp());
    util.setJSONMap(jsonMap, '_default_access', entitlementRow.get('_default_access'));
    util.setJSONMap(jsonMap, 'assigned_item_code', entitlementRow.get('assigned_item_code'));
    util.setJSONMap(jsonMap, '_group_read_only', entitlementRow.get('_group_read_only'));

    return new Promise(function(resolve, reject) {
        odkData.addRow(util.deliveryTable, jsonMap, util.genUUID(), resolve, reject);
    });
};

dataUtil.addDeliveryRowWithoutEntitlement = function(beneficiaryEntityId, authorizationRow, customDeliveryRowId) {
    var jsonMap = {};
    util.setJSONMap(jsonMap, 'beneficiary_entity_id', beneficiaryEntityId);
    util.setJSONMap(jsonMap, 'authorization_id', authorizationRow.get('_id'));
    util.setJSONMap(jsonMap, 'distribution_name', authorizationRow.get('distribution_name'));
    util.setJSONMap(jsonMap, 'authorization_type', authorizationRow.get('type'));
    util.setJSONMap(jsonMap, 'item_id', authorizationRow.get('item_id'));
    util.setJSONMap(jsonMap, 'item_name', authorizationRow.get('item_name'));
    util.setJSONMap(jsonMap, 'item_description', authorizationRow.get('item_description'));
    util.setJSONMap(jsonMap, 'is_override', 'FALSE');
    util.setJSONMap(jsonMap, 'custom_delivery_form_id', authorizationRow.get('custom_delivery_form_id'));
    util.setJSONMap(jsonMap, 'custom_delivery_row_id', customDeliveryRowId);
    util.setJSONMap(jsonMap, '_row_owner', odkCommon.getActiveUser());
    util.setJSONMap(jsonMap, 'date_created', util.getCurrentOdkTimestamp());

    return new Promise(function(resolve, reject) {
        odkData.addRow(util.deliveryTable, jsonMap, util.genUUID(), resolve, reject);
    });

};


// returns true if the row was successfully added, otherwise cleans up dangling rows and returns false
dataUtil.validateCustomTableEntry = function(action, dispatchStr, label, rootFormId) {

    var result = action.jsonValue.result;

    console.log("Finishing custom " + label);

    var rootRowId = dispatchStr[util.rootRowIdKey];
    if (rootRowId === null || rootRowId === undefined) {
        console.log("Error: no root" + label + "id");
        return Promise.resolve(false);
    }

    if (result === null || result === undefined) {
        console.log("Error: no result object on " + label);
        return dataUtil.deleteRow(rootFormId, rootRowId)
          .then(function () {
              return false;
          });
    }

    var customRowId = result.instanceId;
    if (customRowId === null || customRowId === undefined) {
        console.log("Error: no instance ID on " + label);
        dataUtil.deleteRow(rootFormId, rootRowId)
          .then(function () {
              return false;
          });
    }

    var customFormId = dispatchStr[util.customFormIdKey];
    if (customFormId === null || customFormId === undefined) {
        console.log("Error: no " + label + " table name");
        dataUtil.deleteRow(rootFormId, rootRowId)
          .then(function () {
              return false;
          });
    }

    var savepointType = action.jsonValue.result.savepoint_type;

    if (savepointType === util.savepointSuccess) {
        console.log(label + " succeeded");
        return Promise.resolve(true);
    } else {
        console.log(label + " is false; delete rows");
        var dbActions = [];
        dbActions.push(dataUtil.deleteRow(rootFormId, rootRowId));
        dbActions.push(dataUtil.deleteRow(customFormId, customRowId));

        var additionalCustomFormsArr = dispatchStr[util.additionalCustomFormsObj.dispatchKey];
        if (additionalCustomFormsArr !== null && additionalCustomFormsArr !== undefined) {
            for (var i = 0; i < additionalCustomFormsArr.length; i++) {
                var tuple = additionalCustomFormsArr[i];
                var targetFormId = tuple[util.additionalCustomFormsObj.formIdKey];
                var targetForeignKey = tuple[util.additionalCustomFormsObj.foreignReferenceKey];
                var targetValue = tuple[util.additionalCustomFormsObj.valueKey];
                console.log(targetFormId + ' - ' + targetForeignKey + ' - ' + targetValue);
                dbActions.push(new Promise( function(resolve, reject) {
                    odkData.query(targetFormId, targetForeignKey + ' = ?', [targetValue],
                        null, null, null, null, null, null, false, resolve, reject);
                }).then( function(result) {
                    for (var j = 0; j < result.getCount(); j++) {
                        dbActions.push(dataUtil.deleteRow(targetFormId, result.getRowId(j)));
                    }
                }));
            }
        }

        return Promise.all(dbActions).then( function(resultArr) {
            console.log('Cleaned up invalid + ' + label + ' rows');
            return false;
        });
    }
};

/**
 * There should only be 1 active token distribution.
 * This function disables all but the latest token distribution.
 */
dataUtil.reconcileTokenAuthorizations = function() {
    return new Promise(function (resolve, reject) {
        odkData.arbitraryQuery(
          util.authorizationTable,
          'SELECT _id FROM ' + util.authorizationTable +
          ' WHERE type = ?' +
          ' AND status = ?' +
          ' AND _savepoint_timestamp <> (' +
          '   SELECT MAX(_savepoint_timestamp) FROM ' + util.authorizationTable +
          '   WHERE type = ? AND status = ?' +
          ' )',
          [util.workflow.none, 'ACTIVE', util.workflow.none, 'ACTIVE'],
          null,
          null,
          resolve,
          reject
        )
    })
      .then(dataUtil.setAllToInactive)
      .then(dataUtil.disableTokenDistributions);
};

dataUtil.getCurrentTokenAuthorizations = function() {
    return new Promise( function(resolve, reject) {
        odkData.query(util.authorizationTable, 'status = ? AND type = ?', ['ACTIVE', util.workflow.none], null, null,
            null, null, null, null, true, resolve,
            reject);
    });
};

dataUtil.disableTokenDistributions = function() {
    return new Promise(function (resolve, reject) {
        odkData.arbitraryQuery(
          util.distributionTable,
          'SELECT _id FROM ' + util.distributionTable +
          ' WHERE _id IN (' +
          '   SELECT distribution_id FROM ' + util.authorizationTable +
          '   WHERE type = ? AND ' + util.authorizationTable + '.status = ?' +
          ' )' +
          ' AND status = ?',
          [util.workflow.none, 'INACTIVE', 'ACTIVE'],
          null,
          null,
          resolve,
          reject
        );
    })
      .then(dataUtil.setAllToInactive);
};

dataUtil.setToInactiveByRowId = function(tableId, rowId) {
  return new Promise(function (resolve, reject) {
    odkData.updateRow(tableId, {status: 'INACTIVE'}, rowId, resolve, reject);
  });
};

dataUtil.setAllToInactive = function(queryResult) {
  var tableId = queryResult.getTableId();

  var setToInactivePromises = queryResult
    .getColumnData('_id')
    .map(function (rowId) {
      return dataUtil.setToInactiveByRowId(tableId, rowId);
    });

  return Promise.all(setToInactivePromises);
};

// Promise resolves to true if the database was changed through healing
dataUtil.selfHealMembers = function(beneficiaryEntityBaseRowId, beneficiaryEntityCustomRowId) {

    var rowActions = [];

    // get all custom member rows from this beneficiary entity which do not have a corresponding base member row
    var danglingCustomMembers = new Promise( function(resolve, reject) {
        var getDanglingCustomMembers = "SELECT * FROM " + util.getMemberCustomFormId()
            + " LEFT JOIN " + util.membersTable +
            " ON " + util.membersTable + ".custom_member_row_id = " + util.getMemberCustomFormId() + "._id" +
            " WHERE " + util.getMemberCustomFormId() + ".custom_beneficiary_entity_row_id = ? " +
            "AND " + util.membersTable + ".custom_member_row_id IS NULL";
        odkData.arbitraryQuery(util.getMemberCustomFormId(), getDanglingCustomMembers, [beneficiaryEntityCustomRowId], null, null, resolve, reject);
    });

    // get all base member rows from this beneficiary entity which do not have a corresponding custom member row
    var danglingBaseMembers = new Promise( function(resolve, reject) {
        var getDanglingBaseMembers = "SELECT * FROM " + util.membersTable
            + " LEFT JOIN " + util.getMemberCustomFormId() +
            " ON " + util.membersTable + ".custom_member_row_id = " + util.getMemberCustomFormId() +  "._id" +
            " WHERE " + util.membersTable + ".beneficiary_entity_row_id = ? " +
            "AND "+ util.getMemberCustomFormId() + "._id IS NULL";
        odkData.arbitraryQuery(util.getMemberCustomFormId(), getDanglingBaseMembers, [beneficiaryEntityBaseRowId], null, null, resolve, reject);
    });


    return Promise.all([danglingCustomMembers, danglingBaseMembers])
    .then( function(resultArr) {

        // add base rows
        var customMemberRows = resultArr[0];
        console.log("adding base rows: " + customMemberRows.getCount());
        for (var i = 0; i < customMemberRows.getCount(); i++) {
            let jsonMap = {};
            util.setJSONMap(jsonMap, '_row_owner', customMemberRows.getData(i, '_row_owner'));
            util.setJSONMap(jsonMap, 'beneficiary_entity_row_id', beneficiaryEntityBaseRowId);
            util.setJSONMap(jsonMap, 'date_created', util.getCurrentOdkTimestamp());
            util.setJSONMap(jsonMap, 'custom_member_form_id', util.getMemberCustomFormId());
            util.setJSONMap(jsonMap, 'custom_member_row_id', customMemberRows.getRowId(i));
            util.setJSONMap(jsonMap, 'status', 'ENABLED');
            util.setJSONMap(jsonMap, '_group_modify', customMemberRows.getData(i, '_group_modify'));
            util.setJSONMap(jsonMap, '_default_access', customMemberRows.getData(i, '_default_access'));

            rowActions.push(new Promise( function(resolve, reject) {
                odkData.addRow(util.membersTable, jsonMap, util.genUUID(), resolve, reject);
            }));
        }


        // delete base rows
        var baseMemberRows = resultArr[1];
        console.log("remove dangling base rows: " + baseMemberRows.getCount());
        for (var i = 0; i < baseMemberRows.getCount(); i++) {
            rowActions.push(new Promise( function(resolve, reject) {
                odkData.deleteRow(util.membersTable, null, baseMemberRows.getRowId(i), resolve, reject);
            }));
        }
        return Promise.all(rowActions);
    }).then( function(result) {
        if (rowActions.length === 0) {
            return Promise.resolve(false);
        } else {
            return Promise.resolve(true);
        }
    });
};

/*dataUtil.getGroupedEntitlements = function(beneficiaryEntityId) {


    odkData.arbitraryQuery(util.entitlementTable, 'SELECT * FROM ' + util.entitlementTable + ' INNER JOIN ' + util.deliveryTable + ' ON ' + util.entitlementTable + '._id=' + util.deliveryTable + '.entitlement_id'
        [beneficiaryEntityId], null, null, resolve, reject);


    var originalEntitlementSet;
    new Promise( function(resolve, reject) {
        odkData.query(util.entitlementTable, 'beneficiary_entity_id = ?',
            [beneficiaryEntityId], null, null, null, null, null,
            null, true, resolve, reject);
    }).then( function(result) {
        console.log(result);
        originalEntitlementSet = result;
        var entitlementStatusChecks = [];
        for (var i = 0; i < result.getCount(); i++) {
            var entitlementId = result.getRowId(i);
            entitlementStatusChecks.push(new Promise( function(resolve, reject) {
                odkData.query(util.deliveryTable, '_id = ?',
                    [entitlementId], null, null, null, null, null,
                    null, true, resolve, reject);
            }));
        }
        return entitlementStatusChecks;
    }).then( function(result) {
        console.log(result);
        return Promise.all(result);
    }).then( function(result) {
        console.log(result);
        var pendingEntitlements = [];
        var deliveredEntitlements = [];
        for (var i = 0; i < originalEntitlementSet.getCount(); i++) {
            if (result.getRowIds().includes(originalEntitlementSet.getRowId(i))) {
                deliveredEntitlements.push(originalEntitlementSet.get(i));
            } else {
                deliveredEntitlements.push(originalEntitlementSet.get(i));
            }
        }
        return {"pending" : pendingEntitlements, "delivered" : deliveredEntitlements};
    });
}*/

/**
 * List View Util
 **/
(function () {
    window.listViewUtil = {
        addListItem: function (label, onclick, attrObj, detailArr, itemClasses) {
            var template = document.getElementById('listItemTemplate');
            var main = document.getElementById('main');

            var newListItem = document.importNode(template.content, true);
            var $newListItem = $(newListItem);

            $newListItem
              .find('.list-view-item')
              .addClass(itemClasses);

            var itemSpace = $newListItem
              .find('.item_space')
              .text(label)
              .click(onclick);

            if (attrObj !== undefined && attrObj !== null) {
                for (var attr in attrObj) {
                    itemSpace = itemSpace.attr(attr, attrObj[attr])
                }
            }

            if (detailArr !== undefined && detailArr !== null) {
                var details = $newListItem.find('.detail');
                for (var detail of detailArr) {
                    details.append($('<span/>').text(detail));
                }
            }

            main.appendChild(newListItem);
        }
    };
}());
