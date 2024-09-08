const fs = require("fs");
const Datatype = require("./datatypes/Datatype");
const { setAll, errorsRequired, consol } = require("./helpers");

class PgQueryMaker {
    constructor() {
        this.createFile = true;
        this.dir = "./pg-query";
        this.Types = Datatype.Types;
        this.config = {
            columnsByType: {},
            columnsByTable: {},
        };
    }
    
    setFilename(label, query) {
        return `${new Date().toJSON().replace(/[-:.T]/g, "").slice(0, 14)}-${query}${label || ""}.sql`;
    }

    makeQuery(sql, label, query) {
        sql = sql.join("\n").replace('\\"', '\"');
        if(this.createFile){
            if (!fs.existsSync(this.dir)) fs.mkdirSync(this.dir);
            const filename = this.setFilename(label, query);
            fs.writeFileSync(`${this.dir}/${filename}`, sql);
            consol("green", `File created: ${this.dir}/${filename}`);
        }
        return sql;
    }

    /**
     * 
     * @param {object} opts
     * @param {string} opts.label Label for filename
     * @param {string[]} opts.schemas
     * @param {boolean} opts.showSchemaName Add column with schema name
     * @param {object[]|string[]} opts.tables
     * @param {boolean} opts.showTableName Add column with table name
     * @param {string[]} opts.columns
     * @param {string[]} opts.distinctOn 
     * @param {string|function} opts.where
     * @param {string|function} opts.join
     * @param {string} opts.orderBy
     * @param {number} opts.limit
     *  
     */
    select(opts) {
        if (errorsRequired(opts, ["schemas","tables"])) return;
        const sqlQueries = [];
        for (const schema of opts.schemas) {
            for (let [i, table] of opts.tables.entries()) {
                const d = setAll({...opts, schema, table}, this.config);
                sqlQueries.push(
                    `(SELECT ${d.distinctOn}${d.showSchema}${d.showTable}${d.columns} FROM "${schema}".${d.table} ` +
                    `${d.join}` +
                    `${d.where}` +
                    `${d.groupBy}${d.having}${d.schemaOrderBy}${d.schemaLimit}) ` + 
                    (d.isLastTable ? `${d.orderBy}${d.limit};` : `UNION `)
                );
            }
        }
        return this.makeQuery(sqlQueries, opts.label, "SELECT");
    }

    /**
     * 
     * @param {object} opts
     * @param {string} opts.label Label for filename
     * @param {string[]} opts.schemas
     * @param {object[]|string[]} opts.tables
     * @param {string} opts.set
     * @param {string|function} opts.where
     *  
     */
    update(opts) {
        if (errorsRequired(opts, ["schemas","tables","set"])) return;
        const sqlQueries = [];
        for (const schema of opts.schemas) {
            for (let [i, table] of opts.tables.entries()) {
                const d = setAll({...opts, schema, table}, this.config);
                sqlQueries.push(
                    `UPDATE "${schema}".${d.table} ${d.set}${d.where};`
                );
            }
        }
        return this.makeQuery(sqlQueries, opts.label, "UPDATE");
    }

    /**
     * 
     * @param {object} opts
     * @param {string} opts.label Label for filename
     * @param {string[]} opts.schemas
     * @param {object[]|string[]} opts.tables
     * @param {object} opts.insertData
     * @param {string} opts.onConflict
     *  
     */
    insert(opts) {
        if (errorsRequired(opts, ["schemas","tables","insertData"])) return;
        const sqlQueries = [];
        for (const schema of opts.schemas) {
            for (let [i, table] of opts.tables.entries()) {
                const d = setAll({...opts, schema, table}, this.config);
                sqlQueries.push(
                    `INSERT INTO "${schema}".${d.table} ${d.insertData.columns} ${d.insertData.values} ${d.onConflict};`
                );
            }
        }
        return this.makeQuery(sqlQueries, opts.label, "INSERT");
    }

    /**
     * 
     * @param {object} opts
     * @param {string} opts.label Label for filename
     * @param {string[]} opts.schemas
     * @param {object[]|string[]} opts.tables
     * @param {string|function} opts.where
     *  
     */
    delete(opts) {
        if (errorsRequired(opts, ["schemas","tables"])) return;
        const sqlQueries = [];
        for (const schema of opts.schemas) {
            for (let [i, table] of opts.tables.entries()) {
                const d = setAll({...opts, schema, table}, this.config);
                sqlQueries.push(
                    `DELETE FROM "${schema}".${d.table} ${d.where};`
                );
            }
        }
        return this.makeQuery(sqlQueries, opts.label, "DELETE");
    }
    
    query(opts) {
        if (errorsRequired(opts, ["schemas"])) return;
        const sqlQueries = [];
        for (const schema of opts.schemas) {
            sqlQueries.push(opts.query(schema));
        }
        return this.makeQuery(sqlQueries, opts.label, "CUSTOM");
    }
}

module.exports = PgQueryMaker;
module.exports.PgQueryMaker = PgQueryMaker;