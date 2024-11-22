
export const isInteger = (value) => {
    if (typeof(value) === 'number') {
        if (Math.floor(value) === value) {
            return true;
        }
    }
    return false;
}

export class ValueMapAnalysis {

    totalSize = 0;
    numberOfValues = 0;
    numberOfEmpties = 0;
    percentOfValues = 0;
    percentUnique = 0;

    numberOfStringValues = 0;
    totalStringLength = 0;
    averageStringLength = 0;

    frequencyOfDataTypes = {};
    frequencyOfValues = {};

    constructor (key) {
        this.key = key;
    }

    getTopDataType = () => {
        let max = 0;
        let maxDataType = undefined;

        Object.keys(this.frequencyOfDataTypes).forEach(dataType => {
            let value = this.frequencyOfDataTypes[dataType]
            if (value > max) {
                max = value;
                maxDataType = dataType;
            }
        })

        return maxDataType;
    }
}

export const sortArray = ({array, key, desc = false}) => {
    let sortedArray = array.slice().sort((a,b) => {
        if (a[key] === b[key]) {
            return 0;
        } else if (a[key] < b[key]) {
            return desc ? 1 : -1
        } else {
            return desc ? -1 : 1;
        }
    })
    return sortedArray;
}

export class ValueAndType {
    value = undefined;
    type = 'string'
}

export const getPropertyValueMap = (propertyContainers, limit) => {

    let propertyContainersToUse = propertyContainers;
    if (isInteger(limit) && limit > 0) {
        propertyContainersToUse = propertyContainersToUse.slice(0,limit);
    }        

    let propertyValueMap = propertyContainersToUse
        .map(propertyContainer => propertyContainer.properties)
        .reduce((map, props) => {
            Object.keys(props).forEach(key => {
                let values = map[key] || [];
                values.push(props[key]);
                map[key] = values;
            });
            return map;
        }, {});
    return propertyValueMap;
}

export const getRecommendedLabel = (propertyContainers, limit) => {
    let propertyValueMap = getPropertyValueMap(propertyContainers, limit);
    let analysisArray = Object.keys(propertyValueMap).map(key => {
        let values = propertyValueMap[key];
        let analysis = analyzeValues(key, values);
        return analysis;
    })

    let stringKeys = analysisArray.filter(x => x.getTopDataType() === 'string')
    let recommendedLabel = '';
    if (stringKeys.length > 0) {
        let sortedArray = sortArray({array: 
                analysisArray
                    .filter(x => x.percentOfValues > 0.9)
                    .filter(x => x.averageStringLength < 30), 
                key: 'averageStringLength', 
                desc: true
        });
        if (sortedArray.length > 1) {
            sortedArray = sortArray({array: sortedArray, key: 'percentUnique', desc: true})
            recommendedLabel = sortedArray[0].key;
        }
    };

    if (!recommendedLabel) {
        let sortedArray = sortArray({array: analysisArray, key: 'percentUnique', desc: true});
        recommendedLabel = sortedArray[0].key;
    }

    return recommendedLabel;
}

export const analyzeValues = (key, values) => {

    const analysis = new ValueMapAnalysis(key);

    analysis.totalSize = values.length;
    analysis.numberOfValues = values.filter(x => x !== undefined && x !== null && x !== '').length;
    analysis.numberOfEmpties = analysis.totalSize - analysis.numberOfValues;
    analysis.percentOfValues = (analysis.totalSize > 0) ? analysis.numberOfValues / analysis.totalSize : 0;

    const valuesAndTypes = values
        .filter(x => x !== undefined && x !== null && x !== '')
        .map(value => getTypeAndValue(value));

    valuesAndTypes.forEach(valuesAndType => {
        let dataTypeCount = analysis.frequencyOfDataTypes[valuesAndType.type];
        analysis.frequencyOfDataTypes[valuesAndType.type] = (dataTypeCount === undefined) ? 1 : dataTypeCount + 1;

        let valueCount = analysis.frequencyOfValues[valuesAndType.value];
        analysis.frequencyOfValues[valuesAndType.value] = (valueCount === undefined) ? 1 : valueCount + 1;

        if (valuesAndType.type === 'string') {
            analysis.numberOfStringValues++;
            analysis.totalStringLength += valuesAndType.value.length;
        }
    })

    if (analysis.numberOfValues > 0) {
        analysis.percentUnique = Object.keys(analysis.frequencyOfValues).length / analysis.numberOfValues;
    }        

    if (analysis.numberOfStringValues > 0) {
        analysis.averageStringLength = analysis.totalStringLength / analysis.numberOfStringValues;
    }

    return analysis;   
}

export const getTypeAndValue = (value) => {
    const valueAndType = new ValueAndType();
    valueAndType.value = value;
    valueAndType.type = typeof(value);
    return valueAndType;
}
