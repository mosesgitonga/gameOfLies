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
    
    async getWhere(className, filters = {}, orConditions = []) {
        if (!className || (Object.keys(filters).length === 0 && orConditions.length === 0)) {
            throw new Error("Model name and at least one filter condition are required.");
        }
    
        try {
            if (!this.prisma[className]) {
                throw new Error(`Table ${className} does not exist`);
            }
    
            const query = {
                where: {
                    ...filters,
                    OR: orConditions.length ? orConditions : undefined
                }
            };
            console.log(`Executing Prisma query for ${className}:`, query);
    
            const results = await this.prisma[className].findMany(query);
            console.log(`Query results for ${className}:`, results);
    
            return results;
        } catch (error) {
            console.error("Database Error:", error);
            throw new Error("Internal Server Error");
        }
    }

    async all(className, queryOptions = {}, pagination = false, page = 1, pageSize = 20) {
        try {
            // Validate className
            if (!className) {
                throw new Error("Class name is missing");
            }
            if (typeof className !== "string") {
                throw new Error("Class name must be a string");
            }
    
            // Check if table exists
            if (!this.prisma[className]) {
                throw new Error(`Table '${className}' does not exist`);
            }
    
            // Validate queryOptions
            if (!queryOptions || typeof queryOptions !== "object") {
                throw new Error("Query options must be a non-empty object");
            }
    
            // Prepare query options
            const finalQueryOptions = { ...queryOptions }; // Clone to avoid mutating input
    
            if (pagination) {
                page = parseInt(page, 10);
                pageSize = parseInt(pageSize, 10);
    
                if (isNaN(page) || page < 1) {
                    throw new Error("Page number must be a positive integer");
                }
                if (isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
                    throw new Error("Page size must be between 1 and 100");
                }
    
                finalQueryOptions.take = pageSize;
                finalQueryOptions.skip = (page - 1) * pageSize;
            }
    
            // Execute query
            const records = await this.prisma[className].findMany(finalQueryOptions);
    
            // Return records (empty array is valid)
            return records || [];
        } catch (error) {
            console.error("Error fetching records:", error);
            throw new Error(`Failed to fetch data from '${className}': ${error.message}`);
        }
    }
    
    async update(className, targetId, updateFields, idField="id") {
        try {
            if (!className) {
                throw new Error("classname field is missing");
            }
            if (!this.prisma[className]) {
                throw new Error(`Table '${className}' does not exist`);
            }
            if (!targetId) {
                throw new Error(`Missing '${idField}' field`);
            }
            if (!updateFields || typeof updateFields !== "object" || Object.keys(updateFields).length === 0) {
                throw new Error("Update fields must be a non-empty object");
            }
    
            // Check if record exists
            const existingRecord = await this.prisma[className].findUnique({
                where: { [idField]: targetId }
            });
    
            if (!existingRecord) {
                throw new Error(`Record with ${idField}=${targetId} not found`);
            }
    
            // Update the record
            return await this.prisma[className].update({
                where: { [idField]: targetId },
                data: updateFields
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