class Datatype {
    static Types = {
        bigint: "bigint",
        boolean: "boolean",
        character: "character",
        date: "date",
        double: "double",
        enum: "enum",
        integer: "integer",
        json: "json",
        jsonb: "jsonb",
        money: "money",
        numeric: "numeric",
        real: "real",
        smallint: "smallint",
        string: "string",
        text: "text",
        timestamp: "timestamp",
        uuid: "uuid",
    };
    
    static cast(value, datatype, schema, table, column){
        switch(datatype){
            case "enum":
                return `'${value}'::"${schema}".${datatype}_${table}_${column}`;
            case "json":
            case "jsonb":
            case "uuid":
                return `'${value}'::${datatype}`;
            case "string":
            case "text":
            case "date":
            case "timestamp":
                return `'${value}'`;
            case "integer":
            case "bigint":
            case "smallint":
                return parseInt(value, 10);
            case "float":
            case "real":
            case "numeric":
                return parseFloat(value);
            case "boolean":
                return value == true || value == "true";
            default:
                return value;
        }
    }
}

module.exports = Datatype