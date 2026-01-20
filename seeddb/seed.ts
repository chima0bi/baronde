import Image from '../model/image'; 
import { HeroData } from '../heroData'; 
import mongoose from 'mongoose';
import "dotenv/config";



const transformHeroDataToImageData = (heroItem: any) => {
  return {
    images: heroItem.images.map((img: { url: string }) => ({
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

export const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');
    const existingCount = await Image.countDocuments();
    if (existingCount > 0) {
      console.log(`Database already contains ${existingCount} products. Skipping seed.`);
      return {
        success: true,
        message: `Database already seeded with ${existingCount} products`,
        skipped: true
      };
    }
    const transformedData = HeroData.map(transformHeroDataToImageData)
    const insertedData = await Image.insertMany(transformedData);
    
    console.log(`Successfully seeded ${insertedData.length} products to the database`);
    
    return {
      success: true,
      message: `Successfully seeded ${insertedData.length} products`,
      count: insertedData.length,
      data: insertedData
    };

  } catch (error) {
    console.error('Error seeding database:', error);
    return {
      success: false,
      message: 'Failed to seed database',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};



 export async function runSeed() {
  try {
    console.log("Connecting to MongoDB with URI:", process.env.MONGO_DB_URI);
    await mongoose.connect(process.env.MONGO_DB_URI as string);
    await seedDatabase();
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

runSeed();
