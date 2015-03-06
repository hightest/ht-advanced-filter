/*!
 * angular-ht-advanced-filter
 * https://github.com/hightest/angular-advanced-filter
 * Version: 0.0.1 - 2015-03-06T15:41:00.425Z
 * License: 
 */


(function() {
    function FilterController($scope, $filter, $timeout) {
        var self = this;
        var settings = $scope.htAdvancedFilter;
        var elements = settings.data;
        var filteredData = settings.filteredData;

        self.fields = [{name: "Wszędzie", value: "$"}];
        self.fields = self.fields.concat(settings.fields);
        self.select = angular.isDefined(settings.select) ? settings.select : [];
        self.filters = angular.isDefined(settings.filters) ? settings.filters : [];

        self.filterTypes = [
            {
                'name': 'Szukaj w',
                'value': 'filter'
            },
            {
                'name': 'Mniejszy od',
                'value': 'lessThanOrEqualTo'
            },
            {
                'name': 'Większy od',
                'value': 'greaterThanOrEqualTo'
            }
        ];

        self.add = add;
        self.update = update;
        self.remove = remove;

        filter();


        $scope.$watch(function() {return elements;}, function(newVal, oldVal) {
            if (newVal == oldVal)
                return;
            filterData();
        }, true);

        function transformFilter(filters) {
            var result = {};

            var count = filters.length;
            for (var i = 0; i < count; ++i) {
                var filter = filters[i];

                if (filter.value.length) {
                    if (angular.isUndefined(result[filter.filter])) {
                        result[filter.filter] = {};
                    }
                    if (angular.isDefined(result[filter.filter][filter.field])) {
                        if (!Array.isArray(result[filter.filter][filter.field])) {
                            result[filter.filter][filter.field] = [result[filter.filter][filter.field]];
                        }
                        result[filter.filter][filter.field].push(filter.value);
                    } else {
                        result[filter.filter][filter.field] = filter.value;
                    }
                }
            }

            return result;
        }

        function addSelectFilters(filters) {
            var selectFilters = self.select;
            var countFilters = selectFilters.length;

            for (var i = 0; i < countFilters; ++i) {
                var filter = selectFilters[i];
                var countOptions = filter.options.length;

                for (var j = 0; j < countOptions; ++j) {
                    var option = filter.options[j];

                    if (angular.isDefined(option.selected) && option.selected) {
                        var filterName = option.type;
                        var filterField = option.field;
                        var filterValue = option.value;

                        if (!angular.isDefined(filters[filterName])) {
                            filters[filterName] = {};
                        }
                        if (angular.isDefined(filters[filterName][filterField]) && (filters[filterName][filterField].length > 0 || angular.isNumber(filters[filterName][filterField]))) {
                            if (!Array.isArray(filters[filterName][filterField])) {
                                filters[filterName][filterField] = [filters[filterName][filterField]];
                            }
                            filters[filterName][filterField].push(filterValue);
                        } else {
                            filters[filterName][filterField] = filterValue;
                        }
                    }
                }
            }

            return filters;
        }

        function getFlatObjects(object) {
            var elements = [];
            angular.forEach(object, function(value, key) {
                if (Array.isArray(value)) {
                    angular.forEach(value, function(datum) {
                        var flatObject = angular.copy(object);
                        flatObject[key] = datum;
                        elements = elements.concat(getFlatObjects(flatObject));
                    });
                }
            });
            if (elements.length === 0) {
                elements.push(object);
            }
            return elements;
        }

        var timeout = null;
        function filterData() {
            if (timeout) {
                $timeout.cancel(timeout);
            }
            timeout = $timeout(filter, 500);
        }

        function buildObject(key, value) {
            if (key.length === 0) return '"' + value + '"';

            var index = key.indexOf('.');
            var currentKey = key.split('.', 1)[0];
            var nextKey = '';
            if (index !== -1) nextKey = key.substr(index + 1);

            return '{"' + currentKey + '":' + buildObject(nextKey, value) + '}';
        }

        function convertValue(object) {
            var key = Object.keys(object)[0];
            var value = object[key];

            return JSON.parse(buildObject(key, value));
        }

        function filter() {
            var data = elements.slice();
            var filters = transformFilter(self.filters);
            filters = addSelectFilters(filters);

            for (var key in filters) {
                if (!filters.hasOwnProperty(key)) continue;

                var value = filters[key];
                value = getFlatObjects(value);
                if (value.length === 1) {
                    value[0] = convertValue(value[0]);
                    data = $filter(key)(data, value[0]);
                } else {
                    var result = [];
                    var valueLength = value.length;
                    for (var i = 0; i < valueLength; i++) {
                        result = result.concat($filter(key)(data, value[i]));
                    }

                    for (i = 0; i < result.length; i++) {
                        for (var j = i + 1; j < result.length; j++) {
                            if (result[i] == result[j]) {
                                result.splice(j--, 1);
                            }
                        }
                    }
                    data = result;
                }
            }

            filteredData.length = 0;
            for (var l = 0; l < data.length; l++) {
                filteredData.push(data[l]);
            }
        }


        function update() {
            filterData();
        }

        function remove(index) {
            self.filters.splice(index, 1);
            filter();
        }

        function add() {
            self.filters.push({
                filter: self.filterTypes[0].value,
                field: '$',
                value: ''
            });
        }
    }

    function FilterDirective() {
        return {
            require: '^ngModel',
            scope: {
                htAdvancedFilter: '='
            },
            controllerAs: 'filter',
            templateUrl: 'advanced-filter.html',
            controller: FilterController
        };
    }

    function GreaterThanOrEqualToFilter(filterFilter) {
        return function(input, minValue) {
            return filterFilter(input, minValue, function(actual, expected) {
                var isNumber = function(value) {
                    return !isNaN(parseFloat(value));
                };

                if (isNumber(actual) && isNumber(expected)) {
                    return actual >= expected;
                }

                return false;
            });
        };
    }

    function LessThanOrEqualToFilter(filterFilter) {
        return function(input, minValue) {
            return filterFilter(input, minValue, function(actual, expected) {
                var isNumber = function(value) {
                    return !isNaN(parseFloat(value));
                };

                if (isNumber(actual) && isNumber(expected)) {
                    return actual <= expected;
                }

                return false;
            });
        };
    }

    function FocusDirective() {
        return function (scope, element) {
            element[0].focus();
        };
    }

    angular.module('ht.advanced-filter', ['ui.bootstrap'])
        .directive('htAdvancedFilter', FilterDirective)
        .directive('htFocus', FocusDirective)
        .filter('greaterThanOrEqualTo', GreaterThanOrEqualToFilter)
        .filter('lessThanOrEqualTo', LessThanOrEqualToFilter);
})();

angular.module("ht.advanced-filter").run(["$templateCache", function($templateCache) {$templateCache.put("advanced-filter.html","<div><div class=\"form-inline\" ng-repeat=\"object in filter.filters\"><div class=\"form-group\"><select class=\"form-control\" ng-model=\"object.filter\" ng-change=\"filter.update()\" ng-options=\"filterType.value as filterType.name for filterType in filter.filterTypes\"></select></div><div class=\"form-group\"><select class=\"form-control\" ng-model=\"object.field\" ng-change=\"filter.update()\" ng-options=\"field.value as field.name for field in filter.fields\"></select></div><div class=\"form-group\"><input class=\"form-control\" ng-change=\"filter.update()\" type=\"text\" ng-model=\"object.value\" ht-focus=\"\"></div><div class=\"form-group\"><span class=\"glyphicon glyphicon-remove-circle\" ng-click=\"filter.remove($index)\"></span></div></div><button type=\"button\" class=\"btn btn-default\" ng-click=\"filter.add()\">Dodaj filtr</button></div><h4 ng-repeat-start=\"field in filter.select\">{{field.name}}</h4><div class=\"btn-group\" ng-repeat-end=\"\"><label ng-repeat=\"option in field.options\" class=\"btn btn-success\" ng-change=\"filter.update()\" ng-model=\"option.selected\" btn-radio=\"1\" btn-checkbox=\"\">{{option.name}}</label></div>");}]);