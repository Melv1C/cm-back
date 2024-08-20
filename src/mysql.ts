import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

import { BaseData } from 'cm-data';

dotenv.config();

export class QueryError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'QueryError';
    }
}

class MySQL {
    
    private static pool: mysql.Pool;

    static init() {

        this.pool = mysql.createPool({
            host: process.env.MYSQL_HOST,
            port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
            timezone: 'Z',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
    }

    static async query(sql: string, values?: any): Promise<any> {
        const connection = await this.pool.getConnection();
        try {
            const [rows, fields] = await connection.query(sql, values);
            // Parse the results if rows is mysql.RowDataPacket[]
            if (Array.isArray(rows) && fields) {
                return parseData(rows as mysql.RowDataPacket[], fields);
            } else {
                return rows;
            }
        } catch (err: any) {
            throw new QueryError(err.message);
        } finally {
            connection.release();
        }
    }
    /**
     * Get the columns of a table
     * 
     * @param table The table name
     * @returns The columns of the table
     */
    private static async getColumns(table: string): Promise<string[]> {
        const query = `SHOW COLUMNS FROM ${table}`;
        const results = await this.query(query);
        // omit the create_at and update_at columns
        return results.map((result: any) => result.Field).filter((column: string) => !['create_at', 'update_at'].includes(column));
    }

    /**
     * Insert a row in a table
     * 
     * @param table The table name
     * @param data The data to insert
     * @returns The id of the new row
     * @throws Error if the query fails
     */

    private static async insert(table: string, data: any): Promise<number> {
        const columns = await this.getColumns(table);
        const query = ` INSERT INTO ${table} (${columns.join(',')}) 
                        VALUES (${columns.map((column: string) => "?").join(',')})`;
        const values = columns.map((column: string) => formatValue(data[column]));
        const results = await this.query(query, values);
        return results.insertId;
    }


    /**
     * Update a row in a table
     * 
     * @param table The table name
     * @param data The data to update
     * @returns true if the row was updated, false otherwise
     * @throws Error if the query fails
     * @throws Error if the row does not exist
     */
    private static async update(table: string, data: any): Promise<boolean> {
        const columns = await this.getColumns(table);
        const query = `UPDATE ${table} SET ${columns.map((column: string) => `${column} = ?`).join(',')} WHERE id = ?`;
        const values = columns.map((column: string) => formatValue(data[column]));
        values.push(data.id);
        const results = await this.query(query, values);
        return results.affectedRows > 0;
    }

    private static async delete(table: string, id: number): Promise<boolean> {
        const query = `DELETE FROM ${table} WHERE id = ${id}`;
        const results = await this.query(query);
        return results.affectedRows > 0;
    } 

    private static async select(table: string, id: number): Promise<{ [key: string]: any }> {
        const query = `SELECT * FROM ${table} WHERE id= ? LIMIT 1`;
        const results = await this.query(query, [id]);
        return results.length > 0 ? results[0] : null;
    }

    private static async selectByFields(table: string, fields: { [key: string]: any }): Promise<{ [key: string]: any }> {
        const conditions = Object.keys(fields).map((field: string) => `${field} = ?`).join(' AND ');
        const values = Object.values(fields);
        const query = `SELECT * FROM ${table} WHERE ${conditions}`;
        return await this.query(query, values);
    }

    private static async selectAll(table: string): Promise<{ [key: string]: any }[]> {
        const query = `SELECT * FROM ${table}`;
        return await this.query(query);
    }

    private static async searchAll(table: string, fields: string[], keyword: string): Promise<{ [key: string]: any }[]> {
        const keys = keyword.split(' ').filter((key: string) => key.length > 0);
        const conditions = keys.map((key: string) => `(${fields.map((field: string) => `${field} LIKE ?`).join(' OR ')})`).join(' AND ');
        const values = keys.flatMap((key: string) => fields.map((field: string) => `%${key}%`));
        const query = `SELECT * FROM ${table} WHERE ${conditions}`;
        return await this.query(query, values);
    }

    static async save<T extends BaseData>(data: T): Promise<boolean> {
        if (data.id === 0) {
            data.id = await this.insert(data.getTableName(), data.toJson());
        } else {
            await this.update(data.getTableName(), data.toJson());
        }
        return true;
    }

    static async remove<T extends BaseData>(data: T): Promise<boolean> {
        if (data.id === 0) {
            return false;
        } else {
            await this.delete(data.getTableName(), data.id);
            return true;
        }
    }

    static async load<T extends typeof BaseData>(T: T, id: number): Promise<InstanceType<T>> {

        const result = await this.select(T.TABLE, id);
        let returnClass = T.fromJson(result);

        return returnClass as InstanceType<T>;        
    }

    static async loadAll<T extends typeof BaseData>(T: T): Promise<InstanceType<T>[]> {
        const results = await this.selectAll(T.TABLE);
        return results.map((result: any) => T.fromJson(result) as InstanceType<T>);
    }

    static async loadBy<T extends typeof BaseData>(T: T, field: string, value: any): Promise<InstanceType<T>> {
        const results = await this.selectByFields(T.TABLE, { [field]: value });
        if (results.length > 0) {
            return T.fromJson(results[0]) as InstanceType<T>;
        } else {
            throw new Error('Not found');
        }
    }

    static async loadAllBy<T extends typeof BaseData>(T: T, fields: { [key: string]: any }): Promise<InstanceType<T>[]> {
        const results = await this.selectByFields(T.TABLE, fields);
        return results.map((result: any) => T.fromJson(result) as InstanceType<T>);
    }

    static async search<T extends typeof BaseData>(T: T, fields: string[], keyword: string): Promise<InstanceType<T>[]> {
        const results = await this.searchAll(T.TABLE, fields, keyword);
        return results.map((result: any) => T.fromJson(result) as InstanceType<T>);
    }
}

export default MySQL;

function parseData(rows: mysql.RowDataPacket[], fields: mysql.FieldPacket[]): mysql.QueryResult {
    return rows.map((row) => {
        const parsedRow: any = {};

        fields.forEach((field) => {
            const fieldName = field.name;
            const fieldType = field.type;
            const value = row[fieldName];

            // Handle the different data types
            if (value !== null) {
                switch (fieldType) {
                    case mysql.Types.DATE:
                    case mysql.Types.DATETIME:
                    case mysql.Types.TIMESTAMP:
                        parsedRow[fieldName] = new Date(value); // Convert to JavaScript Date
                        break;
                    case mysql.Types.JSON:
                        try {
                            parsedRow[fieldName] = JSON.parse(value); // Parse JSON string
                        } catch (e) {
                            console.error(`Error parsing JSON for field ${fieldName}:`, e);
                            parsedRow[fieldName] = value; // Return as is if parsing fails
                        }
                        break;
                    // Add more cases as needed for other specific data types
                    default:
                        parsedRow[fieldName] = value; // Default case
                        break;
                }
            } else {
                parsedRow[fieldName] = value; // Handle nulls
            }
        });

        return parsedRow;
    });
}


function formatValue(value: any): any {
    if (value instanceof Date) {
        return value.toISOString().replace('T', ' ').replace('Z', '');
    } else if (typeof value === 'object' || Array.isArray(value)) {
        return JSON.stringify(value);
    } else {
        return value;
    }
}


