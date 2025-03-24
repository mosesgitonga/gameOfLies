import { PrismaClient } from '@prisma/client'

class Engine {
    constructor() {
        this.prisma = new PrismaClient()
    }

    async get(className, field, value = '') {
        if (!className || !field || !value) {
            throw new Error("Some required parameters are missing");
        }
        try {
            if (!this.prisma[className]) {
                throw new Error(`Table ${className} does not exist`);
            }
    
            const data = await this.prisma[className].findUnique({
                where: { [field]: value } 
            });
    
            return data ? data : null;
        } catch (error) {
            console.error('Database Error:', error);
            throw new Error('Internal Server Error');
        }
    }
    

    async all(className, pagination = false, page = 1, pageSize = 20) {
        try {
            if (!className) {
                throw new Error("class name is missing")
            }
            if (!this.prisma[className]) {
                throw new Error(`Table ${className} does not exist`)
            }

            const queryOptions = {};
            if (pagination) {
                queryOptions.take = pageSize;
                queryOptions.skip = (page - 1) * pageSize;
            }

            return await this.prisma[className].findMany(queryOptions)
        } catch (error) {
            console.error(error)
            throw new Error("Internal Server Error")
        }
    }

    async update(className, data, idField = "id") {
        try {
            if (!className) {
                throw new Error("classname field is missing");
            }
            if (!this.prisma[className]) {
                throw new Error(`Table '${className}' does not exist`);
            }
            if (!data || typeof data !== "object") {
                throw new Error("data is not specified or not an object");
            }
            if (!data[idField]) {
                throw new Error(`Missing '${idField}' field in data`);
            }
    
            const existingRecord = await this.prisma[className].findUnique({
                where: { [idField]: data[idField] }
            });

            if (!existingRecord) {
                throw new Error(`Record with ${idField}=${data[idField]} not found`);
            }
    
            return await this.prisma[className].update({
                where: { [idField]: data[idField] },
                data
            });
        } catch (error) {
            console.error(error);
            throw new Error("Internal Server Error");
        }
    }

    async create(className, data) {
        if (!className || !data) {
            throw new Error("missing required parameters")
        }
        if (typeof data !== 'object') {
            throw new Error("data is not an object")
        }
        
        if (!this.prisma[className]) {
            throw new Error(`Table ${className} does not exist `)
        }

        return await this.prisma[className].create({ data })
    }

    async delete(className, idValue, idField = "id") {
        try {
            if (!className || !idValue) {
                throw new Error("required method parameters are missing")
            }
            if (!this.prisma[className]) {
                throw new Error(`Table ${className} does not exist`)
            }
            
            const existingRecord = await this.get(className, idField, idValue);
            if (!existingRecord) {
                throw new Error(`Record with ${idField}=${idValue} does not exist`)
            }

            return await this.prisma[className].delete({
                where: { [idField]: idValue }
            });

        } catch (error) {
            console.error(error);
            throw new Error("Internal Server Error")
        }
    }
}

export default Engine;