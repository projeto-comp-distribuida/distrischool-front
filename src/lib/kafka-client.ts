// Kafka Client for consuming events
import { Kafka, KafkaJSConnectionError } from 'kafkajs';

// IMPORTANT: Apply Snappy compression patch BEFORE creating any Kafka instances
// This must be imported first to register Snappy codec with KafkaJS
import './kafka-snappy-patch';

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
 * Transform backend Kafka event format to our notification format
 */
function transformBackendEvent(backendEvent: any, topic: string): any | null {
  console.log(`[TRANSFORM] Starting transformation for event from topic: ${topic}`);
  console.log(`[TRANSFORM] Raw backend event:`, JSON.stringify(backendEvent, null, 2));
  
  try {
    // Map backend eventType to our notification types
    let eventType: string;
    
    console.log(`[TRANSFORM] Checking eventType: ${backendEvent.eventType}`);
    
    if (backendEvent.eventType === 'USER_CREATED') {
      eventType = 'user.created';
      console.log(`[TRANSFORM] ✓ Mapped USER_CREATED -> user.created`);
    } else if (backendEvent.eventType === 'USER_DISABLED' || backendEvent.eventType === 'USER_DEACTIVATED') {
      eventType = 'user.disabled';
      console.log(`[TRANSFORM] ✓ Mapped ${backendEvent.eventType} -> user.disabled`);
    } else if (backendEvent.eventType === 'USER_LOGGED') {
      // For now, we'll skip USER_LOGGED events as they're not shown in notifications
      // But we could add a 'user.logged' type if needed
      console.log(`[TRANSFORM] ⚠ Skipping USER_LOGGED event (not shown in notifications)`);
      return null;
    } else if (backendEvent.eventType === 'TEACHER_CREATED') {
      eventType = 'teacher.created';
      console.log(`[TRANSFORM] ✓ Mapped TEACHER_CREATED -> teacher.created`);
    } else {
      // Skip unknown event types
      console.log(`[TRANSFORM] ⚠ Skipping unknown event type: ${backendEvent.eventType}`);
      return null;
    }
    
    // Extract data from backend format
    // Backend sends: {eventType, userId, userEmail, firstName, lastName, data: {...}, ...}
    console.log(`[TRANSFORM] Extracting data from backend event...`);
    console.log(`[TRANSFORM] - backendEvent.userId: ${backendEvent.userId}`);
    console.log(`[TRANSFORM] - backendEvent.data?.userId: ${backendEvent.data?.userId}`);
    console.log(`[TRANSFORM] - backendEvent.userEmail: ${backendEvent.userEmail}`);
    console.log(`[TRANSFORM] - backendEvent.data?.email: ${backendEvent.data?.email}`);
    console.log(`[TRANSFORM] - backendEvent.firstName: ${backendEvent.firstName}`);
    console.log(`[TRANSFORM] - backendEvent.lastName: ${backendEvent.lastName}`);
    
    const data = {
      userId: backendEvent.userId || backendEvent.data?.userId,
      userEmail: backendEvent.userEmail || backendEvent.data?.email || backendEvent.email,
      userName: backendEvent.firstName && backendEvent.lastName 
        ? `${backendEvent.firstName} ${backendEvent.lastName}`
        : backendEvent.data?.firstName && backendEvent.data?.lastName
        ? `${backendEvent.data.firstName} ${backendEvent.data.lastName}`
        : backendEvent.firstName || backendEvent.data?.firstName || 'User',
      userRole: backendEvent.roles?.[0] || backendEvent.data?.roles?.[0],
      teacherId: backendEvent.teacherId || backendEvent.data?.teacherId,
      teacherName: backendEvent.teacherName || backendEvent.data?.teacherName,
      teacherEmail: backendEvent.teacherEmail || backendEvent.data?.teacherEmail,
      ...backendEvent.data,
    };
    
    console.log(`[TRANSFORM] Extracted data:`, JSON.stringify(data, null, 2));
    
    // Parse Java LocalDateTime format (e.g., "2025-11-03T23:23:59.517274178")
    // JavaScript Date can parse ISO strings, but we need to ensure proper format
    console.log(`[TRANSFORM] Parsing timestamp: ${backendEvent.timestamp}`);
    let timestamp: string;
    if (backendEvent.timestamp) {
      try {
        // If it's already an ISO string, use it; otherwise try to parse LocalDateTime
        const date = new Date(backendEvent.timestamp);
        console.log(`[TRANSFORM] Parsed date: ${date.toISOString()}, isValid: ${!isNaN(date.getTime())}`);
        if (isNaN(date.getTime())) {
          // If parsing failed, try to fix LocalDateTime format
          // Remove nanoseconds if present (keep only microseconds)
          const fixedTimestamp = backendEvent.timestamp.replace(/(\.\d{9})\d+/, '$1').substring(0, 23) + 'Z';
          console.log(`[TRANSFORM] Fixed timestamp format: ${fixedTimestamp}`);
          timestamp = new Date(fixedTimestamp).toISOString();
        } else {
          timestamp = date.toISOString();
        }
      } catch (e) {
        console.warn(`[TRANSFORM] ⚠ Error parsing timestamp, using current time:`, e);
        timestamp = new Date().toISOString();
      }
    } else {
      console.log(`[TRANSFORM] No timestamp provided, using current time`);
      timestamp = new Date().toISOString();
    }
    
    console.log(`[TRANSFORM] Final timestamp: ${timestamp}`);
    
    const result = {
      eventType,
      timestamp,
      data,
    };
    
    console.log(`[TRANSFORM] ✓ Transformation complete:`, JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error transforming backend event:', error);
    return null;
  }
}

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
      topics: ['distrischool.auth.user.created', 'distrischool.auth.user.logged', 'teacher-events'],
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
 * This function runs the consumer for a short period to collect messages
 */
export async function pollMessages(timeout: number = 5000): Promise<any[]> {
  const messages: any[] = [];
  let consumer: any = null;
  
  try {
    consumer = await connectConsumer();
    
    if (!consumer) {
      console.warn('Kafka consumer not available, returning empty array');
      return [];
    }
    
    // Collect messages for a short time period
    const messagePromise = new Promise<any[]>((resolve) => {
      const collectedMessages: any[] = [];
      let timeoutId: NodeJS.Timeout;
      
      // Run the consumer with a handler
      consumer.run({
        eachMessage: async ({ topic, partition, message }: any) => {
          try {
            const value = message.value?.toString();
            if (value) {
              const event = JSON.parse(value);
              collectedMessages.push({
                topic,
                partition,
                offset: message.offset,
                event,
              });
            }
          } catch (parseError) {
            console.error('Error parsing Kafka message:', parseError);
          }
        },
      }).catch((error: any) => {
        console.error('Error running consumer:', error);
      });
      
      // Set timeout to resolve after collecting messages
      timeoutId = setTimeout(() => {
        resolve(collectedMessages);
      }, timeout);
    });
    
    // Wait for messages or timeout
    const collectedMessages = await Promise.race([
      messagePromise,
      new Promise<any[]>((resolve) => 
        setTimeout(() => resolve([]), timeout)
      ),
    ]);
    
    return collectedMessages.map((msg) => msg.event).filter(Boolean);
  } catch (error) {
    if (error instanceof KafkaJSConnectionError) {
      console.warn('Kafka connection error (may be offline):', error.message);
    } else {
      console.error('Error polling messages:', error);
    }
    return [];
  } finally {
    // Note: We don't disconnect here to maintain connection between polls
    // The connection will be reused on next poll
  }
}

/**
 * Fetch messages from Kafka with a one-time connection
 * This is better for serverless environments like Next.js API routes
 */
export async function fetchMessagesOnce(timeout: number = 5000): Promise<any[]> {
  console.log(`[KAFKA] ==========================================`);
  console.log(`[KAFKA] fetchMessagesOnce called with timeout: ${timeout}ms`);
  console.log(`[KAFKA] Timestamp: ${new Date().toISOString()}`);
  
  let consumer: any = null;
  let admin: any = null;
  let runPromise: Promise<void> | null = null;
  // Track processed offsets to commit later - declared outside try block for access in finally
  let offsetTracking: Map<string, { offset: string; partition: number }> = new Map();
  
  try {
    const broker = process.env.KAFKA_BOOTSTRAP_SERVER || '192.168.1.7:9092';
    console.log(`[KAFKA] Step 1: Connecting to Kafka at ${broker}...`);
    console.log(`[KAFKA] Environment KAFKA_BOOTSTRAP_SERVER: ${process.env.KAFKA_BOOTSTRAP_SERVER || 'not set (using default)'}`);
    
    const clientId = `distrischool-frontend-${Date.now()}`;
    console.log(`[KAFKA] Step 2: Creating Kafka instance with clientId: ${clientId}`);
    
    const kafka = new Kafka({
      clientId,
      brokers: [broker],
      connectionTimeout: 15000,
      requestTimeout: 15000,
    });
    
    console.log(`[KAFKA] Step 3: Creating consumer with fixed consumer group...`);
    // Use a fixed consumer group to track offsets properly
    // This allows us to read new messages that arrive after we subscribe
    const groupId = 'distrischool-notifications-api';
    consumer = kafka.consumer({ 
      groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      allowAutoTopicCreation: true,
    });
    
    console.log(`[KAFKA] Consumer created with groupId: ${groupId}`);
    
    console.log(`[KAFKA] Step 4: Connecting consumer...`);
    
    await consumer.connect();
    console.log(`[KAFKA] ✓ Consumer connected successfully!`);
    
    // Collect messages - only keep messages from the last 7 days
    const collectedMessages: any[] = [];
    let isResolved = false;
    let messageCount = 0;
    let messagesReceived = 0;
    let messagesProcessed = 0;
    let messagesSkipped = 0;
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    // Initialize offset tracking (already declared above)
    offsetTracking = new Map<string, { offset: string; partition: number }>();
    
    const topics = ['distrischool.auth.user.created', 'distrischool.auth.user.logged', 'teacher-events'];
    console.log(`[KAFKA] Step 5: Subscribing to topics: ${topics.join(', ')}`);
    
    // Subscribe to topics - use fromBeginning: false to start from latest committed offset
    // This allows the consumer group to track progress across calls
    await consumer.subscribe({ 
      topics,
      fromBeginning: false  // Start from latest committed offset, or latest if no offset exists
    });
    
    console.log(`[KAFKA] ✓ Subscribed to topics successfully`);
    
    // Connect admin for offset management if needed
    admin = kafka.admin();
    await admin.connect();
    
    console.log(`[KAFKA] Step 6: Starting consumer.run() with timeout: ${timeout}ms`);
    console.log(`[KAFKA] Consumer will start from latest committed offset (or latest if no offset exists)`);
    
    // Start consuming messages
    runPromise = consumer.run({
      onPartitionsAssigned: async ({ partitions }: { partitions: Array<{ topic: string; partition: number }> }) => {
        console.log(`[KAFKA] ==========================================`);
        console.log(`[KAFKA] Partitions assigned callback fired!`);
        console.log(`[KAFKA] Partitions:`, JSON.stringify(partitions, null, 2));
        console.log(`[KAFKA] Consumer will start from latest committed offset for each partition`);
        console.log(`[KAFKA] ==========================================`);
      },
      onPartitionsRevoked: async () => {
        console.log(`[KAFKA] Partitions revoked`);
      },
      eachMessage: async ({ topic, partition, message }: any) => {
        messagesReceived++;
        console.log(`[KAFKA] ==========================================`);
        console.log(`[KAFKA] 📨 MESSAGE RECEIVED #${messagesReceived}`);
        console.log(`[KAFKA] Topic: ${topic}`);
        console.log(`[KAFKA] Partition: ${partition}`);
        console.log(`[KAFKA] Offset: ${message.offset}`);
        console.log(`[KAFKA] Timestamp: ${new Date().toISOString()}`);
        console.log(`[KAFKA] Message key: ${message.key?.toString() || 'null'}`);
        console.log(`[KAFKA] Message value length: ${message.value?.length || 0} bytes`);
        console.log(`[KAFKA] isResolved: ${isResolved}`);
        
        if (isResolved) {
          console.log(`[KAFKA] ⚠ Message ignored (isResolved=true)`);
          return;
        }
        
        try {
          const value = message.value?.toString();
          console.log(`[KAFKA] Message value (first 500 chars): ${value?.substring(0, 500)}`);
          
          if (value) {
            console.log(`[KAFKA] Parsing JSON...`);
            const backendEvent = JSON.parse(value);
            console.log(`[KAFKA] ✓ JSON parsed successfully`);
            console.log(`[KAFKA] Backend event structure:`, {
              hasEventType: !!backendEvent.eventType,
              eventType: backendEvent.eventType,
              hasUserId: !!(backendEvent.userId || backendEvent.data?.userId),
              userId: backendEvent.userId || backendEvent.data?.userId,
              hasTimestamp: !!backendEvent.timestamp,
              timestamp: backendEvent.timestamp,
              hasData: !!backendEvent.data,
            });
            
            messagesProcessed++;
            console.log(`[KAFKA] Step 7: Transforming backend event (message #${messagesProcessed})...`);
            // Transform backend event format to our notification format
            const transformedEvent = transformBackendEvent(backendEvent, topic);
            
            if (transformedEvent) {
              console.log(`[KAFKA] ✓ Transformation successful`);
              console.log(`[KAFKA] Step 8: Checking timestamp validity...`);
              
              // Parse timestamp and check if it's within the last 7 days (more lenient)
              let eventTimestamp: number;
              try {
                eventTimestamp = new Date(transformedEvent.timestamp).getTime();
                console.log(`[KAFKA] Parsed timestamp: ${eventTimestamp} (${new Date(eventTimestamp).toISOString()})`);
                if (isNaN(eventTimestamp)) {
                  console.warn(`[KAFKA] ⚠ Invalid timestamp for event: ${transformedEvent.timestamp}, using current time`);
                  eventTimestamp = Date.now();
                }
              } catch (e) {
                console.warn(`[KAFKA] ⚠ Error parsing timestamp: ${transformedEvent.timestamp}, using current time:`, e);
                eventTimestamp = Date.now();
              }
              
              // Include messages from the last 7 days (very lenient for testing)
              const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
              const now = Date.now();
              const age = now - eventTimestamp;
              const hoursAgo = Math.floor(age / (60 * 60 * 1000));
              const daysAgo = Math.floor(hoursAgo / 24);
              
              console.log(`[KAFKA] Current time: ${now} (${new Date(now).toISOString()})`);
              console.log(`[KAFKA] Event time: ${eventTimestamp} (${new Date(eventTimestamp).toISOString()})`);
              console.log(`[KAFKA] Seven days ago: ${sevenDaysAgo} (${new Date(sevenDaysAgo).toISOString()})`);
              console.log(`[KAFKA] Message age: ${age}ms (${hoursAgo} hours, ${daysAgo} days)`);
              console.log(`[KAFKA] Is within 7 days: ${eventTimestamp >= sevenDaysAgo}`);
              
              if (eventTimestamp >= sevenDaysAgo) {
                collectedMessages.push(transformedEvent);
                messageCount++;
                console.log(`[KAFKA] ✓✓✓ ADDED message #${messageCount} to collection!`);
                console.log(`[KAFKA] Event type: ${transformedEvent.eventType}`);
                console.log(`[KAFKA] Timestamp: ${transformedEvent.timestamp}`);
                console.log(`[KAFKA] Total collected: ${collectedMessages.length}`);
                
                // Track offset for committing
                const offsetKey = `${topic}:${partition}`;
                offsetTracking.set(offsetKey, {
                  offset: message.offset,
                  partition,
                });
              } else {
                messagesSkipped++;
                console.log(`[KAFKA] ⚠ SKIPPED old message (${hoursAgo} hours / ${daysAgo} days ago)`);
                console.log(`[KAFKA] Skipped count: ${messagesSkipped}`);
                
                // Still track offset even for skipped messages to avoid reprocessing
                const offsetKey = `${topic}:${partition}`;
                offsetTracking.set(offsetKey, {
                  offset: message.offset,
                  partition,
                });
              }
            } else {
              messagesSkipped++;
              console.log(`[KAFKA] ⚠ Transformation returned null`);
              console.log(`[KAFKA] Event type was: ${backendEvent.eventType}`);
              console.log(`[KAFKA] Topic: ${topic}`);
              console.log(`[KAFKA] Skipped count: ${messagesSkipped}`);
              
              // Track offset even for skipped messages
              const offsetKey = `${topic}:${partition}`;
              offsetTracking.set(offsetKey, {
                offset: message.offset,
                partition,
              });
            }
          }
        } catch (parseError) {
          messagesSkipped++;
          console.error(`[KAFKA] ❌ ERROR parsing Kafka message #${messagesReceived}:`, parseError);
          if (parseError instanceof Error) {
            console.error(`[KAFKA] Error message: ${parseError.message}`);
            console.error(`[KAFKA] Error stack: ${parseError.stack}`);
            
            // Check if it's a Snappy compression error
            const errorMessage = parseError.message;
            if (errorMessage.includes('Snappy') || errorMessage.includes('snappy')) {
              console.warn(`[KAFKA] ⚠ Snappy compression error - skipping this message and committing offset to avoid reprocessing`);
              // Track offset to skip this problematic message
              const offsetKey = `${topic}:${partition}`;
              offsetTracking.set(offsetKey, {
                offset: message.offset,
                partition,
              });
            }
          }
        }
      },
    });
    
    console.log(`[KAFKA] ✓ Consumer.run() started, waiting for messages...`);
    console.log(`[KAFKA] Timeout will trigger in ${timeout}ms`);
    
    // Start timeout for collecting messages
    const timeoutId = setTimeout(() => {
      isResolved = true;
      console.log(`[KAFKA] ==========================================`);
      console.log(`[KAFKA] ⏱ TIMEOUT REACHED (${timeout}ms)`);
      console.log(`[KAFKA] Messages received: ${messagesReceived}`);
      console.log(`[KAFKA] Messages processed: ${messagesProcessed}`);
      console.log(`[KAFKA] Messages skipped: ${messagesSkipped}`);
      console.log(`[KAFKA] Messages collected: ${messageCount}`);
      console.log(`[KAFKA] Total in collection: ${collectedMessages.length}`);
      console.log(`[KAFKA] Processed offsets to commit: ${offsetTracking.size}`);
      
      if (consumer && runPromise !== null) {
        console.log(`[KAFKA] Stopping consumer...`);
        consumer.stop().catch((err: any) => {
          console.error(`[KAFKA] ❌ Error stopping consumer:`, err);
        });
      }
    }, timeout);
    
    // Wait for timeout or until we get messages
    // Handle Snappy compression errors gracefully
    await Promise.race([
      (runPromise || Promise.resolve()).catch((err: any) => {
        // Check for Snappy compression errors
        const errorMessage = err instanceof Error ? err.message : String(err);
        const errorStack = err instanceof Error ? err.stack : '';
        
        if (errorMessage.includes('Snappy') || 
            errorMessage.includes('snappy') ||
            (errorStack && errorStack.includes('Snappy')) ||
            (errorStack && errorStack.includes('snappy'))) {
          console.warn(`[KAFKA] ⚠ Snappy compression error detected (this is expected for old messages)`);
          console.warn(`[KAFKA] Skipping Snappy-compressed messages and continuing...`);
          // Don't throw - continue processing other messages
          return Promise.resolve();
        } else if (errorMessage.includes('The group is rebalancing')) {
          console.warn(`[KAFKA] ⚠ Consumer group rebalancing (this is normal)`);
          return Promise.resolve();
        } else {
          console.error(`[KAFKA] Consumer run error:`, err);
          // For other errors, still don't throw to allow timeout to complete
          return Promise.resolve();
        }
      }),
      new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, timeout);
      }),
    ]);
    
    clearTimeout(timeoutId);
    
    console.log(`[KAFKA] ==========================================`);
    console.log(`[KAFKA] ✓ Finished fetching`);
    console.log(`[KAFKA] Final stats:`);
    console.log(`[KAFKA] - Messages received: ${messagesReceived}`);
    console.log(`[KAFKA] - Messages processed: ${messagesProcessed}`);
    console.log(`[KAFKA] - Messages skipped: ${messagesSkipped}`);
    console.log(`[KAFKA] - Messages collected: ${messageCount}`);
    console.log(`[KAFKA] - Total returned: ${collectedMessages.length}`);
    console.log(`[KAFKA] Returning collected messages array`);
    console.log(`[KAFKA] ==========================================`);
    
    return collectedMessages;
  } catch (error) {
    console.error(`[KAFKA] ==========================================`);
    console.error(`[KAFKA] ❌ ERROR in fetchMessagesOnce`);
    console.error(`[KAFKA] Error type: ${error instanceof Error ? error.constructor.name : typeof error}`);
    
    if (error instanceof KafkaJSConnectionError) {
      console.error(`[KAFKA] Connection error: ${error.message}`);
      console.error(`[KAFKA] Make sure Kafka is running on ${process.env.KAFKA_BOOTSTRAP_SERVER || '192.168.1.7:9092'}`);
    } else if (error instanceof Error && error.message.includes('Snappy compression not implemented')) {
      console.error(`[KAFKA] ❌❌❌ SNAPPY COMPRESSION ERROR ❌❌❌`);
      console.error(`[KAFKA] KafkaJS does not support Snappy compression, but the backend is using it.`);
      console.error(`[KAFKA] Solutions:`);
      console.error(`[KAFKA] 1. Configure backend to use gzip or no compression instead of Snappy`);
      console.error(`[KAFKA] 2. Use environment variable KAFKA_COMPRESSION_TYPE=gzip in backend`);
      console.error(`[KAFKA] 3. Or use a different Kafka client library that supports Snappy`);
      console.error(`[KAFKA] For now, notifications will not work until compression is changed.`);
    } else {
      console.error(`[KAFKA] General error:`, error);
      if (error instanceof Error) {
        console.error(`[KAFKA] Error message: ${error.message}`);
        console.error(`[KAFKA] Error stack:`, error.stack);
      }
    }
    console.error(`[KAFKA] ==========================================`);
    return [];
  } finally {
    console.log(`[KAFKA] ==========================================`);
    console.log(`[KAFKA] FINALLY block: Cleaning up...`);
    
    // Commit offsets before disconnecting to track progress
    if (consumer && offsetTracking.size > 0) {
      try {
        console.log(`[KAFKA] Committing ${offsetTracking.size} processed offsets...`);
        // Group offsets by topic for committing
        const offsetsByTopic: Map<string, Array<{ partition: number; offset: string }>> = new Map();
        
        for (const entry of offsetTracking.entries()) {
          const [key, offsetInfo] = entry;
          const [topic] = key.split(':');
          if (!offsetsByTopic.has(topic)) {
            offsetsByTopic.set(topic, []);
          }
          offsetsByTopic.get(topic)!.push({
            partition: offsetInfo.partition,
            offset: offsetInfo.offset,
          });
        }
        
        // Commit offsets for each topic
        for (const [topic, offsets] of offsetsByTopic.entries()) {
          try {
            const topicOffsets = offsets.map(({ partition, offset }) => ({
              topic,
              partition,
              offset: (parseInt(offset) + 1).toString(), // Commit next offset (offset + 1)
            }));
            
            await consumer.commitOffsets(topicOffsets);
            console.log(`[KAFKA] ✓ Committed offsets for ${topic}: ${topicOffsets.length} partitions`);
          } catch (commitError) {
            console.warn(`[KAFKA] ⚠ Error committing offsets for ${topic}:`, commitError);
          }
        }
        console.log(`[KAFKA] ✓ Offset committing completed`);
      } catch (commitError) {
        console.warn(`[KAFKA] ⚠ Error during offset commit:`, commitError);
      }
    } else {
      console.log(`[KAFKA] No offsets to commit (offsetTracking.size: ${offsetTracking?.size || 0})`);
    }
    
    // Always disconnect after fetching
    if (admin) {
      try {
        console.log(`[KAFKA] Disconnecting admin...`);
        await admin.disconnect();
        console.log(`[KAFKA] ✓ Admin disconnected`);
      } catch (adminError) {
        console.warn(`[KAFKA] ⚠ Error disconnecting admin:`, adminError);
      }
    }
    if (consumer) {
      try {
        console.log(`[KAFKA] Stopping consumer...`);
        if (runPromise !== null) {
          await consumer.stop();
          console.log(`[KAFKA] ✓ Consumer stopped`);
        }
        console.log(`[KAFKA] Disconnecting consumer...`);
        await consumer.disconnect();
        console.log(`[KAFKA] ✓ Consumer disconnected successfully`);
      } catch (disconnectError) {
        console.error(`[KAFKA] ❌ Error during cleanup:`, disconnectError);
        if (disconnectError instanceof Error) {
          console.error(`[KAFKA] Disconnect error message: ${disconnectError.message}`);
          console.error(`[KAFKA] Disconnect error stack: ${disconnectError.stack}`);
        }
      }
    } else {
      console.log(`[KAFKA] No consumer to disconnect`);
    }
    console.log(`[KAFKA] ==========================================`);
  }
}

