/**
 * Render the search page
 */
'use strict';

var baseTableColumns;
var customTableColumns;
var baseTable;
var customTable;
var customForeignKey;
var key = null;
var value = null;
var type = util.getQueryParameter('type');
var locale = odkCommon.getPreferredLocale();
var singularUnitLabel;
var pluralUnitLabel;
var targetTable;
var options = [];

function display() {
    $('#value').attr('placeholder', odkCommon.localizeText(locale, 'enter_value'));
    $('#launch').hide().click(launch);

    var searchBtn = document.getElementById('search');
    var searchInput = document.getElementById('value');

    searchBtn.addEventListener('click', search);

    searchInput.addEventListener('keyup', function (e) {
        if (e.key === 'Enter') {
            searchBtn.click();
            // use blur to hide the keyboard
            searchInput.blur();

            e.preventDefault();
        }
    });

    var renderPromises = [];

    if (type === util.getMemberCustomFormId()) {

        baseTable = util.membersTable;
        customTable = util.getMemberCustomFormId();
        customForeignKey = 'custom_member_row_id';

        $('#title').text(odkCommon.localizeText(locale, 'search_members'));
        singularUnitLabel = odkCommon.localizeText(locale, 'member');
        pluralUnitLabel = odkCommon.localizeText(locale, 'members');
        renderPromises.push(getSearchOptions(type, false, []));
        renderPromises.push(getSearchOptions(util.membersTable, true, []));

    } else if (type === util.getBeneficiaryEntityCustomFormId()) {

        baseTable = util.beneficiaryEntityTable;
        customTable = util.getBeneficiaryEntityCustomFormId();
        customForeignKey = 'custom_beneficiary_entity_row_id';

        if (util.getRegistrationMode() === 'HOUSEHOLD') {
            $('#title').text(odkCommon.localizeText(locale, 'search_households'));
            singularUnitLabel = odkCommon.localizeText(locale, 'household');
            pluralUnitLabel = odkCommon.localizeText(locale, 'households');
        } else {
            $('#title').text(odkCommon.localizeText(locale, 'search_beneficiaries'));
            singularUnitLabel = odkCommon.localizeText(locale, 'beneficiary');
            pluralUnitLabel = odkCommon.localizeText(locale, 'beneficiaries');
        }

        renderPromises.push(getSearchOptions(type, false, []));
        renderPromises.push(getSearchOptions(util.beneficiaryEntityTable, true, []));
        options.push(odkCommon.localizeText(locale, 'hh_size'));

    } else if (type === util.deliveryTable) {
        baseTable = util.deliveryTable;

        $('#title').text(odkCommon.localizeText(locale, 'search_deliveries'));

        if (util.getWorkflowMode() === util.workflow.none) {
            renderPromises.push(getSearchOptions(type, true, [ 'authorization_id',
             'authorization_type', 'custom_delivery_form_id', 'custom_delivery_row_id', 'entitlement_id', 'is_override',
              'item_pack_description', 'item_pack_id', 'item_pack_name', 'member_id']));
        } else {
            renderPromises.push(getSearchOptions(type, true, []));
        }

        singularUnitLabel = odkCommon.localizeText(locale, 'delivery');
        pluralUnitLabel = odkCommon.localizeText(locale, 'deliveries');
    }

    return Promise.all(renderPromises)
        .then(function(results) {
            // TODO: this should sort the localized column name

            options.sort(function(a, b){
                var alc = a.toLowerCase(), blc = b.toLowerCase();
                return alc > blc ? 1 : alc < blc ? -1 : 0;
            });
            options.forEach(addField);
            document.getElementById('field').value = getLastSearchParam();
        });
}

function getSearchOptions(tableId, isBaseTable, exclusionList) {
    return new Promise( function(resolve, reject) {
        odkData.query(tableId, null, null, null, null, null, null, 1, null, null,
            resolve, reject);
    }).then( function(result) {
        var columns = result.getColumns().filter( function( el ) {
            return exclusionList.indexOf( el ) < 0;
        } );

        if (isBaseTable) {
            baseTableColumns = columns;
        } else {
            customTableColumns = columns;
        }
        options = options.concat(columns);
    });
}

function addField(item) {
    var fieldSelect = $('#field');

    if (item.charAt(0) !== '_') {
        var displayText = odkCommon.localizeText(locale, item);
        if (displayText === undefined || displayText === null) {
            displayText = item;
        }
        fieldSelect.append($('<option/>').attr('value', item).text(displayText));
    }
}

function search() {
    key = document.getElementById('field').value;

    if (!key) {
        return;
    }

    value = document.getElementById('value').value || '';

    setLastSearchParam(key);

    var activeQuery;
    if (baseTableColumns.includes(key)) {
        targetTable = baseTable;
        activeQuery = 'SELECT COUNT(*) FROM ' + targetTable + ' WHERE ' + getLikeClause(key);
    } else if (customTableColumns.includes(key)) {
        targetTable = customTable;
        activeQuery = 'SELECT COUNT(*) FROM ' + targetTable + ' WHERE ' + getLikeClause(key);
    } else if (key === 'Household Size') {
        value = parseInt(value);
        targetTable = baseTable;
        activeQuery = 'SELECT COUNT(*) FROM ' + util.beneficiaryEntityTable + ' ben, '  + util.membersTable +
            ' mem WHERE ben._id = mem.beneficiary_entity_row_id ' +
            'GROUP BY ben._id ' +
            'HAVING count(*) = ?';
    } else {
        searchFailure(null);
        return;
    }

    if (key !== 'Household Size') {
        // escape special characters used in LIKE
        value = value.replace(/[\^%_]/g, '^$&');

        // only enable wildcard when the search contains at least
        // 1 character in Unicode General Category Letter
        var useWildcard = /\p{General_Category=Letter}/u.test(value);

        if (useWildcard) {
            value = '%' + value + '%';
        }
    }

    odkData.arbitraryQuery(targetTable, activeQuery, [value],
        null, null, searchSuccess, searchFailure);
}

function searchSuccess(result) {
    var count = result.getCount() > 0 ? result.get('COUNT(*)') : '0';

    if (count === '1') {
         $('#search_results').text(count + ' ' + singularUnitLabel + ' ' + odkCommon.localizeText(locale, 'found'));
    } else {
         $('#search_results').text(count + ' ' + pluralUnitLabel + ' ' + odkCommon.localizeText(locale, 'found'));
    }
    if (count > 0) {
        $('#launch').show();
    } else {
        $('#launch').hide();
    }
}

function searchFailure(error) {
    console.log(error);
    $('#search_results').text(odkCommon.localizeText(locale, 'invalid_search'));
    $('#launch').hide();
}

function launch() {
    if (type === util.getMemberCustomFormId() || type === util.getBeneficiaryEntityCustomFormId()) {
        var joinQuery;
        if (key === odkCommon.localizeText(locale, 'hh_size')) {
            joinQuery = 'SELECT *, COUNT(base._id) AS searchResult FROM ' + util.beneficiaryEntityTable + ' base, '  + util.membersTable +
                ' mem INNER JOIN '  + customTable + ' custom ON base.' + customForeignKey +
                ' = custom._id WHERE base._id = mem.beneficiary_entity_row_id ' +
                'GROUP BY base._id ' +
                'HAVING count(*) = ?';
        } else {
            var aliasedKey;
            if (baseTableColumns.includes(key)) {
                aliasedKey = 'base.' + key;
            } else if (customTableColumns.includes(key)) {
                aliasedKey = 'custom.' + key;
            }

            joinQuery = 'SELECT *, ' + aliasedKey + ' AS searchResult FROM ' + baseTable + ' base INNER JOIN ' + customTable +
                ' custom ON base.' + customForeignKey + ' = custom._id WHERE ' + getLikeClause(aliasedKey);
        }

        var relativePath = util.resolveViewPath(baseTable, 'list') + '?searchParam=' + encodeURIComponent(key);
        if (type === util.getBeneficiaryEntityCustomFormId()) {
            relativePath += '&type=delivery';
        } else {
            relativePath += '&type=search';
        }

        odkTables.openTableToListViewArbitraryQuery(null, baseTable, joinQuery, [value], relativePath);

    } else if (type === util.deliveryTable) {
        odkTables.openTableToListViewArbitraryQuery(
          null,
          type,
          'SELECT * FROM ' + type + ' WHERE ' + getLikeClause(key),
          [value],
          util.resolveViewPath(type, 'list')
        )
    }
}

function getLastSearchParamStorageKey() {
    return 'search.js' + odkCommon.getActiveUser() + type;
}

function getLastSearchParam() {
    return window.localStorage.getItem(getLastSearchParamStorageKey());
}

function setLastSearchParam(param) {
    window.localStorage.setItem(getLastSearchParamStorageKey(), param);
}

function getLikeClause(column) {
    return column + ' LIKE ? ESCAPE \'^\'';
}
