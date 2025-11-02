// Kafka Client for consuming events
import { Kafka, KafkaJSConnectionError } from 'kafkajs';

const KAFKA_BOOTSTRAP_SERVER = process.env.KAFKA_BOOTSTRAP_SERVER || '192.168.1.7:9092';

// Create Kafka instance
const kafka = new Kafka({
  clientId: 'distrischool-frontend',
  brokers: [KAFKA_BOOTSTRAP_SERVER],
});

// Create consumer instance
let consumerInstance: any = null;
let isConnected = false;

// Store for keeping track of processed messages
const processedOffsets = new Map<string, number>();

/**
 * Initialize and connect the consumer (singleton pattern)
 */
export async function connectConsumer() {
  if (isConnected && consumerInstance) {
    return consumerInstance;
  }

  try {
    const consumer = kafka.consumer({ groupId: 'distrischool-notifications' });
    await consumer.connect();
    await consumer.subscribe({ 
      topics: ['user-events', 'teacher-events'],
      fromBeginning: false 
    });
    
    consumerInstance = consumer;
    isConnected = true;
    console.log('Kafka consumer connected and subscribed');
    
    return consumer;
  } catch (error) {
    console.error('Failed to connect Kafka consumer:', error);
    // Return null instead of throwing to allow graceful degradation
    return null;
  }
}

/**
 * Disconnect the consumer
 */
export async function disconnectConsumer() {
  if (!consumerInstance || !isConnected) {
    return;
  }

  try {
    await consumerInstance.disconnect();
    consumerInstance = null;
    isConnected = false;
    console.log('Kafka consumer disconnected');
  } catch (error) {
    console.error('Failed to disconnect Kafka consumer:', error);
  }
}

/**
 * Poll for new messages from Kafka
 */
export async function pollMessages(timeout: number = 5000): Promise<any[]> {
  const messages: any[] = [];
  
  try {
    const consumer = await connectConsumer();
    
    if (!consumer) {
      console.warn('Kafka consumer not available, returning empty array');
      return [];
    }
    
    // Get partitions for subscribed topics
    const partitions = await consumer.listTopics();
    
    // For now, return empty array as we need a different approach for polling
    // KafkaJS doesn't support simple polling - it's designed for streaming
    // We'll need to fetch from a backend endpoint that aggregates messages
    
    return messages;
  } catch (error) {
    if (error instanceof KafkaJSConnectionError) {
      console.warn('Kafka connection error (may be offline):', error.message);
    } else {
      console.error('Error polling messages:', error);
    }
    return [];
  }
}

