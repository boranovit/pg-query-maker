const Datatype = require("../datatypes/Datatype")

function setAll(obj, config){
    return {
        distinctOn:     setDistinctOn(obj.distinctOn),
        showSchema:     obj.showSchemaName ? `'${obj.schema}' as schema, ` : "",
        showTable:      obj.showTableName ? `'${obj.table.split(" ")[0]}' as table, ` : "",
        columns:        setColumns(obj.columns, obj.tables, config),
        table:          setTable(obj.table),
        join:           setClause("JOIN", obj.join, obj.schema),
        where:          setClause("WHERE", obj.where, obj.schema),
        orderBy:        setClause("ORDER BY", obj.orderBy),
        limit:          setClause("LIMIT", obj.limit),
        set:            setClause("SET", obj.set),
        onConflict:     setClause("ON CONFLICT", obj.onConflict),
        insertData:     setInsertData(obj.insertData, obj.schema, obj.table, config.columnsByType),
        isLastTable:    isLast(obj.schema, obj.schemas) && isLast(obj.table, obj.tables),
    }
}

function setDistinctOn(distinctOn){
    return Array.isArray(distinctOn) && distinctOn.length ? `DISTINCT ON (${distinctOn.join(", ")}) ` : "";
}

function setClause(clause, val, schema) {
    if (val instanceof Function && schema) return val(schema) ? `${clause} ${val(schema)} ` : "";
    return val ? `${clause} ${val} ` : "";
}

function setTable(table) {
    return (typeof table === 'object') ? `${table.name}${table.as ? ` AS ${table.as}` : ""}` : table;
}

function setColumns(columns, tables, config) {
    if (!columns || !columns.length || columns.includes("*")) columns = getColumnsByTables(tables, config.columnsByTable);
    return columns.map(column => {
        const datatype = findColumnType(column.split(".")[1] || column, config.columnsByType);
        if (datatype && isSchemaType(datatype, config.columnsByType)) return `${column}::text`;
        return column;
    }).join(", ") || "*";
}

function findColumnType(column, columnsByType) {
    for (const datatype in columnsByType) {
        if (columnsByType[datatype].columns.includes(column)) return datatype;
    }
}

function isSchemaType(datatype, columnsByType) {
    return columnsByType[datatype].isSchemaType;
}

function getColumnsByTables(tables, columnsByTable) {
    let tableObjs = tables.map(t => typeof t === 'object' ? t : {name: t.split(" ")[0], as: t.split(" ")[2]});
    let validColumns = [], columns = [];
    tableObjs.forEach(t => {
        let columnsTable = columnsByTable[t.name] ? columnsByTable[t.name].columns.map(c=> `${t.as ? t.as+'.'+c : c}`) : [];
        columns.push(columnsTable);
        validColumns = [...validColumns, ...columnsTable];
    })
    columns.forEach(tableColumns => validColumns = validColumns.filter(column => tableColumns.includes(column)));
    return [...new Set(validColumns)];
}

function setInsertData(register, schema, table, columnsByType) {
    if (!register) return null;
    let columns = [], values = [];
    for (const column in register) {
        columns.push(column);
        values.push(cast(register[column], schema, table, column, columnsByType));
    }
    columns = columns.length ? `("${columns.join("\", \"")}")` : "";
    values = values.length ? `VALUES (${values.join(", ")})` : "VALUES ()";
    return { columns, values };
}

function cast(val, schema, table, column, columnsByType) {
    if (typeof val === 'object' && (val.value || val.type)) return val.type ? Datatype.cast(val.value, val.type, schema, table, column) : val.value;
    if (typeof val === 'object') val = JSON.stringify(val);
    const datatype = findColumnType(column, columnsByType);
    return datatype ? Datatype.cast(val, datatype, schema, table, column) : val;
}

function isLast(el, arr){ 
    return el === arr[arr.length - 1];
}

function errorsRequired(opts, requiredOpts){
    const errors = [];
    requiredOpts.forEach(opt =>(!opts[opt] || !Object.keys(opts[opt]).length) && errors.push(`- "${opt}" is required`))
    if(errors.length){
        errors.unshift(`Label ${opts.label}:`);
        return consol("red", errors.join("\n")) || true;
    } 
}

function consol(type, msg){
	const c = {
		green: "\x1b[32m",
		red: "\x1b[31m",
		yellow: "\x1b[33m",
		blue: "\x1b[34m",
		reset: "\x1b[0m",
		bright: "\x1b[1m",
		underscore: "\x1b[4m",
		hidden: "\x1b[8m",
	};
	console.log(c[type], msg);
}

module.exports = { setAll, setClause, setColumns, setDistinctOn, setTable, isLast, setInsertData, errorsRequired, consol }