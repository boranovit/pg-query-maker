# pg-query-maker
##### Node.js library for creating SQL scripts tailored for PostgreSQL

#### Installation
```bash
npm install pg-query-maker
```

#### Basic Usage
```javascript
const PgQueryMaker = require("pg-query-maker");
const pgQueryMaker = new PgQueryMaker();
```

#### Optional config
```javascript
pgQueryMaker.dir = "./pgqm-files";
pgQueryMaker.config.columnsByType = {
    uuid: {
        columns: ["id_player"],
        isSchemaType: true
    },
    json: {
        columns: ["player_data","team_data"]
    },
    string: {
        columns: ["first_name","last_name"]
    },
}
pgQueryMaker.config.columnsByTable = {
    players: {
        columns: ["id_player","first_name","last_name","player_data"]
    },
    teams: {
        columns: ["id_team","name","team_data"]
    }
}
```

#### Select
```javascript
function findPlayersByTeamName(teamName){
    pgQueryMaker.select({
        label: "playersByTeamName", // label for filename
        schemas: ["schema1","schema2"],
        distinctOn: ["id_player"],
        columns: ["a.first_name", "a.last_name"],
        tables: ["players as a"], // array of strings or objects, example {name: 'players', as: 'a'}
        join: (schema) => `"${schema}".teams AS b ON a.player_data ->> 'id_team' = b.id_team`, //string or function 
        where: `b.name ILIKE '%${teamName}%'`, // string or function if schema name is needed
        orderBy: "a.last_name DESC",
    })
}
findPlayersByTeamName("Boca Juniors")
```

#### Insert
```javascript
function createPlayer(insertData){
    pgQueryMaker.insert({
        label: "createPlayer",
        schemas: ["schema1","schema2"],
        tables: ["players"],
        insertData,
        onConflict: "DO NOTHING"
    })
}
createPlayer({
    id_player: {
        type: pgQueryMaker.Types.uuid,
        value: "25b72467-cb6b-4cef-828a-67fb78f9d222"
    },
    first_name: "Lionel", // type is not necessary if the column has already been added in the configuration
    last_name: {
        type: pgQueryMaker.Types.string,
        value: "Messi"
    },
    player_data: {
        id_team: 32,
        birthdate: '1987-06-24'
    } 
})
```

#### Update
```javascript
pgQueryMaker.update({
    label: "updatePlayer",
    schemas: ["schema1"],
    tables: ["players"],
    set: "first_name = 'Lionel Andres'",
    where: "id_player = '25b72467-cb6b-4cef-828a-67fb78f9d222'"
})
```

#### Delete
```javascript
pgQueryMaker.delete({
    label: "deleteOldPlayers",
    schemas: ["schema1","schema2"],
    tables: ["players"],
    where: "player_data ->> 'birthdate' > '1984-01-01'"
})
```