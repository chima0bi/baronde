"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = void 0;
exports.runSeed = runSeed;
const image_1 = __importDefault(require("../model/image"));
const heroData_1 = require("../heroData");
const mongoose_1 = __importDefault(require("mongoose"));
require("dotenv/config");
const transformHeroDataToImageData = (heroItem) => {
    return {
        images: heroItem.images.map((img) => ({
            public_id: `seeded_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            url: img.url
        })),
        name: heroItem.name,
        description: heroItem.description,
        categories: heroItem.categories,
        spec: heroItem.description,
        price: heroItem.price,
        stockQuantity: heroItem.stockQuantity || 1,
        discount: heroItem.discount || 0,
        keyword: heroItem.keyword,
        brand: heroItem.brand
    };
};
const seedDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Starting database seeding...');
        const existingCount = yield image_1.default.countDocuments();
        if (existingCount > 0) {
            console.log(`Database already contains ${existingCount} products. Skipping seed.`);
            return {
                success: true,
                message: `Database already seeded with ${existingCount} products`,
                skipped: true
            };
        }
        const transformedData = heroData_1.HeroData.map(transformHeroDataToImageData);
        const insertedData = yield image_1.default.insertMany(transformedData);
        console.log(`Successfully seeded ${insertedData.length} products to the database`);
        return {
            success: true,
            message: `Successfully seeded ${insertedData.length} products`,
            count: insertedData.length,
            data: insertedData
        };
    }
    catch (error) {
        console.error('Error seeding database:', error);
        return {
            success: false,
            message: 'Failed to seed database',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
});
exports.seedDatabase = seedDatabase;
function runSeed() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("Connecting to MongoDB with URI:", process.env.MONGO_DB_URI);
            yield mongoose_1.default.connect(process.env.MONGO_DB_URI);
            yield (0, exports.seedDatabase)();
            process.exit(0);
        }
        catch (error) {
            console.error('Seeding failed:', error);
            process.exit(1);
        }
    });
}
runSeed();
